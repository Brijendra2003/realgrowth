"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { clearSession, requireUser } from "@/lib/auth";
import { destroyMedia } from "@/lib/cloudinary";
import { isStaff } from "@/lib/constants";
import { fetchAll, rows, sb } from "@/lib/supabase";
import type { ActionState } from "@/lib/types";
import { fieldErrors, formValues, profileSchema } from "@/lib/validators";

export async function updateProfileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("/profile");
  const values = formValues(fd);
  const parsed = profileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const db = await sb();
  const { error } = await db.from("profiles").update(parsed.data).eq("id", user.id);
  if (error) {
    console.error(`[profile.update] ${error.message}`);
    return { message: "We couldn't save your profile just now. Please try again.", values };
  }
  await logActivity(user, "user.profile_updated", { type: "profile", id: user.id });
  revalidatePath("/", "layout");
  return { ok: true, message: "Your profile is saved." };
}

/**
 * DPDP Act: users can delete their account. The account, its listings and
 * photos, the enquiries on those listings and the enquiries it sent are all
 * removed (the database cascades from the profile row).
 */
export async function deleteAccountAction(fd: FormData) {
  const user = await requireUser("/profile");
  if (isStaff(user.role) || fd.get("confirm") !== "DELETE") return;
  const db = await sb();

  const projectIds = rows<{ id: string }>(await db.from("projects").select("id").eq("lister_id", user.id)).map((p) => p.id);
  const photos = projectIds.length
    ? await fetchAll<{ cloudinary_public_id: string | null; kind: string }>((from, to) =>
        db.from("project_media").select("cloudinary_public_id,kind").in("project_id", projectIds).order("id").range(from, to),
      )
    : [];

  const { error } = await db.from("profiles").delete().eq("id", user.id);
  if (error) {
    console.error(`[profile.delete] ${error.message}`);
    redirect("/profile?error=delete");
  }
  await destroyMedia(photos);
  await logActivity(user, "user.deleted", { type: "profile", id: user.id });
  await clearSession();
  revalidatePath("/", "layout");
  redirect("/?deleted=1");
}
