"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { clearSession, requireUser } from "@/lib/auth";
import { isStaff } from "@/lib/constants";
import { mutate, nowIso } from "@/lib/db";
import type { ActionState } from "@/lib/types";
import { fieldErrors, formValues, profileSchema } from "@/lib/validators";

export async function updateProfileAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser("/profile");
  const values = formValues(fd);
  const parsed = profileSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  await mutate((db) => {
    const p = db.profiles.find((x) => x.id === user.id);
    if (!p) return;
    Object.assign(p, parsed.data, { updated_at: nowIso() });
    logActivity(db, user, "user.profile_updated", { type: "profile", id: user.id });
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Your profile is saved." };
}

/** DPDP Act: users can delete their account. Listings are withdrawn, enquiries anonymised. */
export async function deleteAccountAction(fd: FormData) {
  const user = await requireUser("/profile");
  if (isStaff(user.role) || fd.get("confirm") !== "DELETE") return;
  await mutate((db) => {
    db.profiles = db.profiles.filter((p) => p.id !== user.id);
    for (const p of db.projects) if (p.lister_id === user.id && p.status !== "sold") p.status = "withdrawn";
    for (const l of db.leads) {
      if (l.buyer_id === user.id) {
        l.name = "Deleted user";
        l.phone = "0000000000";
        l.email = null;
      }
    }
    db.saved = db.saved.filter((s) => s.user_id !== user.id);
    db.notifications = db.notifications.filter((n) => n.user_id !== user.id);
    logActivity(db, user, "user.deleted", { type: "profile", id: user.id });
  });
  await clearSession();
  revalidatePath("/", "layout");
  redirect("/?deleted=1");
}
