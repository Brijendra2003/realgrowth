"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity, notify } from "@/lib/activity";
import { requireStaff } from "@/lib/auth";
import { STAFF_ROLES } from "@/lib/constants";
import { hashPassword } from "@/lib/password";
import { getRequirementsMatchingProject } from "@/lib/queries";
import { row, rows, sb, total } from "@/lib/supabase";
import type { ActionState, Area, Profile, Project } from "@/lib/types";
import { fieldErrors, formValues, staffSchema } from "@/lib/validators";

const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

export async function reviewProjectAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const id = String(fd.get("project_id"));
  const decision = fd.get("decision") === "reject" ? "rejected" : "verified";
  const reason = String(fd.get("reason") ?? "").trim();
  if (decision === "rejected" && reason.length < 10) {
    return { errors: { reason: "Tell the lister what to fix (at least 10 letters)." } };
  }
  if (decision === "verified" && fd.getAll("check").length < 4) {
    return { errors: { check: "Tick every item on the checklist before approving." } };
  }
  if (!isUuid(id)) return { message: "Project not found." };

  const db = await sb();
  const at = new Date().toISOString();
  // Only a listing that is waiting for review can be approved or rejected.
  const updated = rows<Pick<Project, "id" | "title" | "slug" | "lister_id">>(
    await db
      .from("projects")
      .update({
        status: decision,
        rejection_reason: decision === "rejected" ? reason : null,
        ...(decision === "verified" ? { verified_by: staff.id, verified_at: at } : {}),
      })
      .eq("id", id)
      .eq("status", "unverified")
      .select("id,title,slug,lister_id"),
  );
  const p = updated[0];
  if (!p) return { message: "This listing is no longer waiting for review." };

  await db.from("project_reviews").insert({ project_id: p.id, reviewer_id: staff.id, decision, reason: reason || null });
  await notify(
    p.lister_id,
    decision === "verified" ? "Your property is live 🎉" : "Your property needs a few changes",
    decision === "verified" ? `${p.title} is now visible to buyers.` : `${p.title}: ${reason}`,
    decision === "verified" ? `/projects/${p.slug}` : `/my-projects/${p.id}/edit`,
  );
  await logActivity(staff, `project.${decision}`, { type: "project", id: p.id }, { title: p.title, reason: reason || undefined });
  if (decision === "verified") {
    // Buyers whose requirement this listing matches hear about it straight away.
    const { matches } = await getRequirementsMatchingProject(p.id);
    for (const m of matches) {
      await notify(m.requirement.buyer_id, `New match — ${m.percent}%`, `${p.title} matches what you're looking for.`, `/requirements/${m.requirement.id}`);
    }
  }
  revalidatePath("/", "layout");
  redirect(`/admin/verification?done=${decision}`);
}

export async function setBlockedAction(fd: FormData) {
  const staff = await requireStaff(["admin", "super_admin"]);
  const id = String(fd.get("user_id"));
  const block = fd.get("block") === "1";
  if (!isUuid(id) || id === staff.id) return;
  const db = await sb();
  const updated = rows<Pick<Profile, "full_name">>(
    await db.from("profiles").update({ is_blocked: block }).eq("id", id).not("role", "in", "(admin,super_admin)").select("full_name"),
  );
  if (updated[0]) await logActivity(staff, block ? "user.blocked" : "user.unblocked", { type: "profile", id }, { name: updated[0].full_name });
  revalidatePath("/", "layout");
}

export async function createStaffAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff(["super_admin"]);
  const values = formValues(fd);
  const parsed = staffSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const input = parsed.data;

  const db = await sb();
  const { data, error } = await db
    .from("profiles")
    .insert({ role: input.role, full_name: input.full_name, phone: input.phone, email: input.email, password_hash: hashPassword(input.password) })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { errors: { phone: "This mobile number is already registered." }, values };
    console.error(`[staff.create] ${error.message}`);
    return { message: "We couldn't create this account just now. Please try again.", values };
  }
  await logActivity(staff, "staff.created", { type: "profile", id: (data as { id: string }).id }, { name: input.full_name, role: input.role });
  revalidatePath("/", "layout");
  return { ok: true, message: `${input.full_name} can now sign in at /admin/login.` };
}

export async function removeStaffAction(fd: FormData) {
  const staff = await requireStaff(["super_admin"]);
  const id = String(fd.get("user_id"));
  if (!isUuid(id) || id === staff.id) return;
  const db = await sb();
  const removed = rows<Pick<Profile, "full_name" | "role">>(
    await db.from("profiles").delete().eq("id", id).in("role", [...STAFF_ROLES]).select("full_name,role"),
  );
  if (removed[0]) await logActivity(staff, "staff.removed", { type: "profile", id }, { name: removed[0].full_name, role: removed[0].role });
  revalidatePath("/", "layout");
}

export async function toggleAreaAction(fd: FormData) {
  const staff = await requireStaff(["super_admin"]);
  const id = Number(fd.get("area_id"));
  if (!Number.isInteger(id)) return;
  const db = await sb();
  const a = row<Area>(await db.from("areas").select("id,zone,name,is_active").eq("id", id).maybeSingle());
  if (!a) return;
  await db.from("areas").update({ is_active: !a.is_active }).eq("id", id);
  await logActivity(staff, a.is_active ? "area.hidden" : "area.shown", { type: "area", id: String(id) }, { name: a.name });
  revalidatePath("/", "layout");
}

export async function addAreaAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff(["super_admin"]);
  const name = String(fd.get("name") ?? "").trim().slice(0, 80);
  const zone = String(fd.get("zone") ?? "").trim().slice(0, 80);
  if (name.length < 3) return { errors: { name: "Enter the area name" } };
  if (!zone) return { errors: { zone: "Choose a zone" } };

  const db = await sb();
  const clash = total(await db.from("areas").select("id", { count: "exact", head: true }).ilike("name", name.replace(/[%_\\]/g, "\\$&")));
  if (clash) return { errors: { name: "This area already exists." } };
  const { data, error } = await db.from("areas").insert({ name, zone }).select("id").single();
  if (error) {
    if (error.code === "23505") return { errors: { name: "This area already exists." } };
    console.error(`[area.create] ${error.message}`);
    return { errors: { name: "We couldn't add this area just now. Please try again." } };
  }
  await logActivity(staff, "area.created", { type: "area", id: String((data as { id: number }).id) }, { name, zone });
  revalidatePath("/", "layout");
  return { ok: true, message: `${name} added to ${zone}.` };
}
