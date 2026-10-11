"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { getSessionUser, requireLister } from "@/lib/auth";
import { destroyImages, isOwnUpload } from "@/lib/cloudinary";
import { MAX_PHOTOS, type ProjectStatus } from "@/lib/constants";
import { slugify } from "@/lib/format";
import { row, rows, sb } from "@/lib/supabase";
import type { ActionState, Project } from "@/lib/types";
import { fieldErrors, formValues, projectSchema } from "@/lib/validators";

/** Fields whose change sends a live project back to review (Architecture §3.2). */
const KEY_FIELDS = ["price", "area_id", "maharera_no", "address_line", "purpose", "segment", "property_type_id"] as const;

const SAVE_FAILED = "We couldn't save your property just now. Please try again.";

function parseForm(fd: FormData) {
  const raw: Record<string, unknown> = Object.fromEntries(fd);
  raw.amenities = fd.getAll("amenities").map(String);
  return projectSchema.safeParse(raw);
}

/**
 * Photos are uploaded by the browser straight to Cloudinary (signed by
 * /api/cloudinary/sign); the form only carries their ids. Anything that isn't
 * in this lister's own Cloudinary folder is ignored.
 */
function parseUploads(fd: FormData, userId: string) {
  const out: { cloudinary_public_id: string; url: string }[] = [];
  for (const entry of fd.getAll("media_new")) {
    try {
      const { public_id, url } = JSON.parse(String(entry)) as { public_id?: unknown; url?: unknown };
      if (typeof public_id === "string" && typeof url === "string" && isOwnUpload(userId, public_id, url) && !out.some((m) => m.cloudinary_public_id === public_id)) {
        out.push({ cloudinary_public_id: public_id, url });
      }
    } catch {}
  }
  return out;
}

export async function saveProjectAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireLister("/list-project");
  const values = formValues(fd);
  delete values.media_new;
  const projectId = String(fd.get("project_id") ?? "") || null;

  const parsed = parseForm(fd);
  const errors: Record<string, string> = parsed.success ? {} : fieldErrors(parsed.error);

  const uploads = parseUploads(fd, user.id);
  const keep = fd.getAll("keep_media").map(String);
  if (uploads.length + keep.length === 0) errors.photos = "Add at least one photo — listings with photos get far more enquiries.";
  if (uploads.length + keep.length > MAX_PHOTOS) errors.photos = `You can add up to ${MAX_PHOTOS} photos.`;

  if (!parsed.success || Object.keys(errors).length) {
    return { errors, values, message: "Please fix the highlighted fields." };
  }
  const input = parsed.data;
  const db = await sb();

  if (!projectId) {
    const { data, error } = await db
      .from("projects")
      .insert({ ...input, lister_id: user.id, slug: `${slugify(input.title)}-${randomBytes(3).toString("hex")}`, status: "unverified" })
      .select("id")
      .single();
    if (error) {
      console.error(`[project.create] ${error.message}`);
      return { values, message: SAVE_FAILED };
    }
    const id = (data as { id: string }).id;
    const media = await db.from("project_media").insert(uploads.map((m, i) => ({ ...m, project_id: id, kind: "image", sort_order: i })));
    if (media.error) console.error(`[project.create] photos: ${media.error.message}`);
    await logActivity(user, "project.created", { type: "project", id }, { title: input.title });
    revalidatePath("/", "layout");
    redirect("/my-projects?saved=review");
  }

  const p = row<Project>(await db.from("projects").select("*").eq("id", projectId).eq("lister_id", user.id).maybeSingle());
  if (!p) return { message: "We couldn't find this property." };
  const existing = rows<{ id: string; cloudinary_public_id: string | null }>(
    await db.from("project_media").select("id,cloudinary_public_id").eq("project_id", p.id).order("sort_order"),
  );
  const kept = existing.filter((m) => keep.includes(m.id));
  const removed = existing.filter((m) => !keep.includes(m.id));
  if (kept.length + uploads.length === 0) return { errors: { photos: "Add at least one photo — listings with photos get far more enquiries." }, values };

  const keyChanged = KEY_FIELDS.some((k) => String(p[k] ?? "") !== String(input[k] ?? ""));
  const backToReview = p.status === "rejected" || (p.status === "verified" && keyChanged);

  const { error } = await db
    .from("projects")
    .update({ ...input, ...(backToReview ? { status: "unverified", rejection_reason: null } : {}) })
    .eq("id", p.id)
    .eq("lister_id", user.id);
  if (error) {
    console.error(`[project.update] ${error.message}`);
    return { values, message: SAVE_FAILED };
  }

  if (removed.length) {
    await db.from("project_media").delete().in("id", removed.map((m) => m.id));
    await destroyImages(removed.map((m) => m.cloudinary_public_id));
  }
  await Promise.all(kept.map((m, i) => db.from("project_media").update({ sort_order: i }).eq("id", m.id)));
  if (uploads.length) {
    const media = await db.from("project_media").insert(uploads.map((m, i) => ({ ...m, project_id: p.id, kind: "image", sort_order: kept.length + i })));
    if (media.error) console.error(`[project.update] photos: ${media.error.message}`);
  }

  await logActivity(user, backToReview ? "project.resubmitted" : "project.edited", { type: "project", id: p.id }, { title: input.title, key_fields_changed: keyChanged });
  revalidatePath("/", "layout");
  redirect(`/my-projects?saved=${backToReview || p.status === "unverified" ? "review" : "live"}`);
}

export async function setProjectStatusAction(fd: FormData) {
  const user = await requireLister("/my-projects");
  const id = String(fd.get("project_id"));
  const status = String(fd.get("status")) as ProjectStatus;
  if (!["withdrawn", "sold"].includes(status)) return;
  const db = await sb();
  const updated = rows<{ title: string }>(await db.from("projects").update({ status }).eq("id", id).eq("lister_id", user.id).select("title"));
  if (updated[0]) await logActivity(user, `project.${status}`, { type: "project", id }, { title: updated[0].title });
  revalidatePath("/", "layout");
}

export async function toggleSaveAction(fd: FormData) {
  const user = await getSessionUser();
  const projectId = String(fd.get("project_id"));
  const back = String(fd.get("back") ?? "/projects");
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);
  const db = await sb();
  const removed = rows(await db.from("saved_projects").delete().eq("user_id", user.id).eq("project_id", projectId).select("project_id"));
  if (!removed.length) await db.from("saved_projects").insert({ user_id: user.id, project_id: projectId });
  revalidatePath("/", "layout");
}

export async function trackViewAction(projectId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) return;
  const db = await sb();
  await db.rpc("increment_project_views", { p_id: projectId });
}
