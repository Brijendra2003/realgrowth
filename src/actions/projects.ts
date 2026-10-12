"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { getSessionUser, requireLister } from "@/lib/auth";
import { destroyMedia, isOwnUpload, type UploadKind } from "@/lib/cloudinary";
import { MAX_PHOTOS, MAX_VIDEOS, type ProjectStatus } from "@/lib/constants";
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

type SavedMedia = { id: string; cloudinary_public_id: string | null; kind: string };
type NewMedia = { cloudinary_public_id: string; url: string; kind: UploadKind };

/**
 * Photos and videos are uploaded by the browser straight to Cloudinary (signed
 * by /api/cloudinary/sign); the form only carries their ids, in the order the
 * lister arranged them. An entry is either a photo already on this property or
 * a new upload; anything that isn't in this lister's own Cloudinary folder is ignored.
 */
function parseMedia(fd: FormData, userId: string, existing: SavedMedia[]) {
  const out: (SavedMedia | NewMedia)[] = [];
  for (const entry of fd.getAll("media")) {
    try {
      const m = JSON.parse(String(entry)) as { id?: unknown; public_id?: unknown; url?: unknown; kind?: unknown };
      if (typeof m.id === "string") {
        const saved = existing.find((e) => e.id === m.id);
        if (saved && !out.includes(saved)) out.push(saved);
        continue;
      }
      const kind: UploadKind = m.kind === "video" ? "video" : "image";
      if (
        typeof m.public_id === "string" &&
        typeof m.url === "string" &&
        isOwnUpload(userId, m.public_id, m.url, kind) &&
        !out.some((x) => x.cloudinary_public_id === m.public_id)
      ) {
        out.push({ cloudinary_public_id: m.public_id, url: m.url, kind });
      }
    } catch {}
  }
  return out;
}

export async function saveProjectAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireLister("/list-project");
  const values = formValues(fd);
  delete values.media;
  const projectId = String(fd.get("project_id") ?? "") || null;
  const db = await sb();

  let p: Project | null = null;
  let existing: SavedMedia[] = [];
  if (projectId) {
    if (/^[0-9a-f-]{36}$/i.test(projectId)) p = row<Project>(await db.from("projects").select("*").eq("id", projectId).eq("lister_id", user.id).maybeSingle());
    if (!p) return { message: "We couldn't find this property." };
    existing = rows<SavedMedia>(await db.from("project_media").select("id,cloudinary_public_id,kind").eq("project_id", p.id).order("sort_order"));
  }

  const parsed = parseForm(fd);
  const errors: Record<string, string> = parsed.success ? {} : fieldErrors(parsed.error);

  const media = parseMedia(fd, user.id, existing);
  const photoCount = media.filter((m) => m.kind === "image").length;
  const videoCount = media.filter((m) => m.kind === "video").length;
  if (photoCount === 0) errors.photos = "Add at least one photo — listings with photos get far more enquiries.";
  if (photoCount > MAX_PHOTOS) errors.photos = `You can add up to ${MAX_PHOTOS} photos.`;
  if (videoCount > MAX_VIDEOS) errors.photos = `You can add up to ${MAX_VIDEOS} videos.`;

  if (!parsed.success || Object.keys(errors).length) {
    return { errors, values, message: "Please fix the highlighted fields." };
  }
  const input = parsed.data;
  // Each item's place in the list is its sort order; the first photo is the cover.
  const uploads = media.flatMap((m, i) => ("id" in m ? [] : [{ ...m, sort_order: i }]));
  const kept = media.flatMap((m, i) => ("id" in m ? [{ id: m.id, sort_order: i }] : []));

  if (!p) {
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
    const inserted = await db.from("project_media").insert(uploads.map((m) => ({ ...m, project_id: id })));
    if (inserted.error) console.error(`[project.create] photos: ${inserted.error.message}`);
    await logActivity(user, "project.created", { type: "project", id }, { title: input.title });
    revalidatePath("/", "layout");
    redirect("/my-projects?saved=review");
  }

  const removed = existing.filter((m) => m.kind !== "brochure" && !kept.some((k) => k.id === m.id));

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
    await destroyMedia(removed);
  }
  await Promise.all(kept.map((m) => db.from("project_media").update({ sort_order: m.sort_order }).eq("id", m.id)));
  if (uploads.length) {
    const inserted = await db.from("project_media").insert(uploads.map((m) => ({ ...m, project_id: p.id })));
    if (inserted.error) console.error(`[project.update] photos: ${inserted.error.message}`);
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
