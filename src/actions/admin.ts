"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity, notify } from "@/lib/activity";
import { requireStaff } from "@/lib/auth";
import { mutate, nowIso, uid } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import type { ActionState } from "@/lib/types";
import { fieldErrors, formValues, staffSchema } from "@/lib/validators";

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

  const result = await mutate((db) => {
    const p = db.projects.find((x) => x.id === id);
    if (!p) return { error: "Project not found." };
    const at = nowIso();
    p.status = decision;
    p.rejection_reason = decision === "rejected" ? reason : null;
    p.updated_at = at;
    if (decision === "verified") {
      p.verified_by = staff.id;
      p.verified_at = at;
    }
    db.project_reviews.push({ id: uid(), project_id: p.id, reviewer_id: staff.id, decision, reason: reason || null, created_at: at });
    notify(
      db,
      p.lister_id,
      decision === "verified" ? "Your property is live 🎉" : "Your property needs a few changes",
      decision === "verified" ? `${p.title} is now visible to buyers.` : `${p.title}: ${reason}`,
      decision === "verified" ? `/projects/${p.slug}` : `/my-projects/${p.id}/edit`,
    );
    logActivity(db, staff, `project.${decision}`, { type: "project", id: p.id }, { title: p.title, reason: reason || undefined });
    return { title: p.title };
  });
  if ("error" in result) return { message: result.error };
  revalidatePath("/", "layout");
  redirect(`/admin/verification?done=${decision}`);
}

export async function setBlockedAction(fd: FormData) {
  const staff = await requireStaff(["admin", "super_admin"]);
  const id = String(fd.get("user_id"));
  const block = fd.get("block") === "1";
  await mutate((db) => {
    const u = db.profiles.find((p) => p.id === id);
    if (!u || ["admin", "super_admin"].includes(u.role)) return;
    u.is_blocked = block;
    u.updated_at = nowIso();
    logActivity(db, staff, block ? "user.blocked" : "user.unblocked", { type: "profile", id }, { name: u.full_name });
  });
  revalidatePath("/", "layout");
}

export async function createStaffAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff(["super_admin"]);
  const values = formValues(fd);
  const parsed = staffSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const input = parsed.data;
  const result = await mutate((db) => {
    if (db.profiles.some((p) => p.phone === input.phone)) return { error: "This mobile number is already registered." };
    const id = uid();
    const at = nowIso();
    db.profiles.push({
      id,
      role: input.role,
      full_name: input.full_name,
      phone: input.phone,
      email: input.email,
      company_name: null,
      agent_rera_no: null,
      password_hash: hashPassword(input.password),
      is_blocked: false,
      created_at: at,
      updated_at: at,
    });
    logActivity(db, staff, "staff.created", { type: "profile", id }, { name: input.full_name, role: input.role });
    return { ok: true };
  });
  if ("error" in result) return { errors: { phone: result.error! }, values };
  revalidatePath("/", "layout");
  return { ok: true, message: `${input.full_name} can now sign in at /admin/login.` };
}

export async function removeStaffAction(fd: FormData) {
  const staff = await requireStaff(["super_admin"]);
  const id = String(fd.get("user_id"));
  if (id === staff.id) return;
  await mutate((db) => {
    const i = db.profiles.findIndex((p) => p.id === id && ["ops", "admin", "super_admin"].includes(p.role));
    if (i < 0) return;
    const [removed] = db.profiles.splice(i, 1);
    logActivity(db, staff, "staff.removed", { type: "profile", id }, { name: removed!.full_name, role: removed!.role });
  });
  revalidatePath("/", "layout");
}

export async function toggleAreaAction(fd: FormData) {
  const staff = await requireStaff(["super_admin"]);
  const id = Number(fd.get("area_id"));
  await mutate((db) => {
    const a = db.areas.find((x) => x.id === id);
    if (!a) return;
    a.is_active = !a.is_active;
    logActivity(db, staff, a.is_active ? "area.shown" : "area.hidden", { type: "area", id: String(id) }, { name: a.name });
  });
  revalidatePath("/", "layout");
}

export async function addAreaAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff(["super_admin"]);
  const name = String(fd.get("name") ?? "").trim();
  const zone = String(fd.get("zone") ?? "").trim();
  if (name.length < 3) return { errors: { name: "Enter the area name" } };
  if (!zone) return { errors: { zone: "Choose a zone" } };
  const result = await mutate((db) => {
    if (db.areas.some((a) => a.name.toLowerCase() === name.toLowerCase())) return { error: "This area already exists." };
    const id = Math.max(...db.areas.map((a) => a.id)) + 1;
    db.areas.push({ id, zone, name, is_active: true });
    logActivity(db, staff, "area.created", { type: "area", id: String(id) }, { name, zone });
    return { ok: true };
  });
  if ("error" in result) return { errors: { name: result.error! } };
  revalidatePath("/", "layout");
  return { ok: true, message: `${name} added to ${zone}.` };
}
