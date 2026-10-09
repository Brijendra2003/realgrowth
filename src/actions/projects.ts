"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { getSessionUser, requireLister } from "@/lib/auth";
import { MAX_PHOTOS, type ProjectStatus } from "@/lib/constants";
import { mutate, nowIso, uid, UPLOAD_DIR } from "@/lib/db";
import { slugify } from "@/lib/format";
import type { ActionState, ProjectMedia } from "@/lib/types";
import { fieldErrors, formValues, projectSchema } from "@/lib/validators";

const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
const MAX_BYTES = 5 * 1024 * 1024;

/** Fields whose change sends a live project back to review (Architecture §3.2). */
const KEY_FIELDS = ["price", "area_id", "maharera_no", "address_line", "purpose", "segment", "property_type_id"] as const;

function parseForm(fd: FormData) {
  const raw: Record<string, unknown> = Object.fromEntries(fd);
  raw.amenities = fd.getAll("amenities").map(String);
  return projectSchema.safeParse(raw);
}

/**
 * Stores uploads locally (served from /api/media). In production this is
 * replaced by signed Cloudinary uploads from the browser (see /api/cloudinary/sign).
 */
async function saveUploads(files: File[]): Promise<{ media: ProjectMedia[]; error?: string }> {
  const media: ProjectMedia[] = [];
  for (const file of files) {
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return { media, error: "Photos must be JPG, PNG or WebP." };
    if (file.size > MAX_BYTES) return { media, error: `"${file.name}" is larger than 5 MB. Please use a smaller photo.` };
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  for (const file of files) {
    const name = `${uid()}.${IMAGE_TYPES[file.type]}`;
    await fs.writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
    media.push({ id: uid(), url: `/api/media/${name}`, kind: "image", sort_order: 0 });
  }
  return { media };
}

export async function saveProjectAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireLister("/list-project");
  const values = formValues(fd);
  const projectId = String(fd.get("project_id") ?? "") || null;

  const parsed = parseForm(fd);
  const errors: Record<string, string> = parsed.success ? {} : fieldErrors(parsed.error);

  const files = fd.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const keep = fd.getAll("keep_media").map(String);
  if (files.length + keep.length === 0) errors.photos = "Add at least one photo — listings with photos get far more enquiries.";
  if (files.length + keep.length > MAX_PHOTOS) errors.photos = `You can add up to ${MAX_PHOTOS} photos.`;

  if (!parsed.success || Object.keys(errors).length) {
    return { errors, values, message: "Please fix the highlighted fields." };
  }

  const upload = await saveUploads(files);
  if (upload.error) return { errors: { photos: upload.error }, values };
  const input = parsed.data;

  const result = await mutate((db) => {
    const at = nowIso();
    if (!projectId) {
      const seq = db.projects.length + 101;
      const id = uid();
      db.projects.push({
        id,
        code: `RG-${new Date().getFullYear()}-${String(seq).padStart(6, "0")}`,
        lister_id: user.id,
        slug: `${slugify(input.title)}-${seq}`,
        ...input,
        media: upload.media.map((m, i) => ({ ...m, sort_order: i })),
        status: "unverified",
        rejection_reason: null,
        verified_by: null,
        verified_at: null,
        views_count: 0,
        created_at: at,
        updated_at: at,
      });
      logActivity(db, user, "project.created", { type: "project", id }, { title: input.title });
      return { id, backToReview: true };
    }

    const p = db.projects.find((x) => x.id === projectId && x.lister_id === user.id);
    if (!p) return { error: "We couldn't find this property." };
    const keyChanged = KEY_FIELDS.some((k) => String(p[k] ?? "") !== String(input[k] ?? ""));
    const kept = p.media.filter((m) => keep.includes(m.id));
    const media = [...kept, ...upload.media].map((m, i) => ({ ...m, sort_order: i }));
    const wasLive = p.status === "verified";

    Object.assign(p, input, { media, updated_at: at });
    let backToReview = false;
    if (p.status === "rejected" || (wasLive && keyChanged)) {
      p.status = "unverified";
      p.rejection_reason = null;
      backToReview = true;
    }
    logActivity(db, user, p.status === "unverified" && backToReview ? "project.resubmitted" : "project.edited", { type: "project", id: p.id }, {
      title: p.title,
      key_fields_changed: keyChanged,
    });
    return { id: p.id, backToReview };
  });

  if ("error" in result) return { message: result.error };
  revalidatePath("/", "layout");
  redirect(`/my-projects?saved=${result.backToReview ? "review" : "live"}`);
}

export async function setProjectStatusAction(fd: FormData) {
  const user = await requireLister("/my-projects");
  const id = String(fd.get("project_id"));
  const status = String(fd.get("status")) as ProjectStatus;
  if (!["withdrawn", "sold"].includes(status)) return;
  await mutate((db) => {
    const p = db.projects.find((x) => x.id === id && x.lister_id === user.id);
    if (!p) return;
    p.status = status;
    p.updated_at = nowIso();
    logActivity(db, user, `project.${status}`, { type: "project", id }, { title: p.title });
  });
  revalidatePath("/", "layout");
}

export async function toggleSaveAction(fd: FormData) {
  const user = await getSessionUser();
  const projectId = String(fd.get("project_id"));
  const back = String(fd.get("back") ?? "/projects");
  if (!user) redirect(`/login?next=${encodeURIComponent(back)}`);
  await mutate((db) => {
    const i = db.saved.findIndex((s) => s.user_id === user.id && s.project_id === projectId);
    if (i >= 0) db.saved.splice(i, 1);
    else db.saved.push({ user_id: user.id, project_id: projectId, created_at: nowIso() });
  });
  revalidatePath("/", "layout");
}

export async function trackViewAction(projectId: string) {
  await mutate((db) => {
    const p = db.projects.find((x) => x.id === projectId && x.status === "verified");
    if (p) p.views_count++;
  });
}
