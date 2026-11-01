import { logActivity } from "@/lib/activity";
import { destroyMedia } from "@/lib/cloudinary";
import { TRASH_DAYS } from "@/lib/constants";
import { rows, sb } from "@/lib/supabase";

/**
 * Deletes for good every listing that has sat in the trash for TRASH_DAYS:
 * its photos and videos on Cloudinary, then the row (leads, media, reviews and
 * saves go with it through `on delete cascade`). Runs daily from
 * /api/cron/purge-trash, and after the team opens Trash as a fallback.
 */
export async function purgeTrashedProjects(): Promise<number> {
  const db = await sb();
  const cutoff = new Date(Date.now() - TRASH_DAYS * 86_400_000).toISOString();
  const due = rows<{ id: string; title: string; code: string; media: { cloudinary_public_id: string | null; kind: string }[] }>(
    await db
      .from("projects")
      .select("id,title,code,media:project_media(cloudinary_public_id,kind)")
      .eq("status", "trashed")
      .lt("trashed_at", cutoff)
      .limit(100),
  );
  let purged = 0;
  for (const p of due) {
    // Re-check the status so a listing restored a moment ago is left alone.
    const deleted = rows(await db.from("projects").delete().eq("id", p.id).eq("status", "trashed").lt("trashed_at", cutoff).select("id"));
    if (!deleted.length) continue;
    await destroyMedia(p.media);
    await logActivity(null, "project.purged", { type: "project", id: p.id }, { title: p.title, code: p.code });
    purged++;
  }
  return purged;
}
