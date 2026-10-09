"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { clearSession, getSessionUser, homeFor, setSession } from "@/lib/auth";
import { DEMO_OTP, isStaff } from "@/lib/constants";
import { mutate, nowIso, readDb, uid } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { ActionState } from "@/lib/types";
import { fieldErrors, formValues, loginOtpSchema, loginPasswordSchema, signupSchema } from "@/lib/validators";

/** Only allow relative, same-site redirects after sign-in. */
function safeNext(next: FormDataEntryValue | null, fallback: string) {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/admin/login") ? n : fallback;
}

export async function signupAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd);
  const parsed = signupSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const input = parsed.data;

  const result = await mutate((db) => {
    if (db.profiles.some((p) => p.phone === input.phone)) return { error: "This mobile number already has an account. Please sign in." };
    const id = uid();
    const at = nowIso();
    db.profiles.push({
      id,
      role: input.role,
      full_name: input.full_name,
      phone: input.phone,
      email: input.email,
      company_name: input.role === "developer" || input.role === "broker" ? input.company_name : null,
      agent_rera_no: input.role === "broker" ? input.agent_rera_no : null,
      password_hash: hashPassword(input.password),
      is_blocked: false,
      created_at: at,
      updated_at: at,
    });
    logActivity(db, { id, role: input.role }, "user.signup", { type: "profile", id }, { name: input.full_name, role: input.role });
    return { id };
  });
  if ("error" in result) return { errors: { phone: result.error! }, values };

  await setSession(result.id);
  revalidatePath("/", "layout");
  redirect(safeNext(fd.get("next"), input.role === "buyer" ? "/projects" : "/dashboard?welcome=1"));
}

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd);
  const mode = fd.get("mode") === "otp" ? "otp" : "password";
  const staffOnly = fd.get("staff") === "1";

  const parsed =
    mode === "otp"
      ? loginOtpSchema.safeParse(Object.fromEntries(fd))
      : loginPasswordSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  const db = await readDb();
  const user = db.profiles.find((p) => p.phone === parsed.data.phone);
  const bad = { errors: { form: mode === "otp" ? "That code didn't match. Please try again." : "Mobile number or password is incorrect." }, values };

  if (!user) return mode === "otp" ? { errors: { phone: "No account with this number. Create one first." }, values } : bad;
  if (mode === "otp" && "otp" in parsed.data && parsed.data.otp !== DEMO_OTP) return bad;
  if (mode === "password" && "password" in parsed.data && !verifyPassword(parsed.data.password, user.password_hash)) return bad;
  if (user.is_blocked) return { errors: { form: "This account has been paused. Please contact support." }, values };
  if (staffOnly && !isStaff(user.role)) return { errors: { form: "This sign-in is for the Real Growth team only." }, values };

  await setSession(user.id);
  await mutate((d) => logActivity(d, { id: user.id, role: user.role }, "user.login", { type: "profile", id: user.id }, { via: mode }));
  revalidatePath("/", "layout");
  redirect(safeNext(fd.get("next"), homeFor(user.role)));
}

/** Demo OTP: real SMS needs a provider (Twilio / MSG91 — see Open Questions). */
export async function requestOtpAction(phone: string): Promise<{ ok: boolean; message: string }> {
  const clean = phone.replace(/\D/g, "").slice(-10);
  if (!/^[6-9]\d{9}$/.test(clean)) return { ok: false, message: "Enter a 10-digit mobile number first." };
  return { ok: true, message: `We've sent a 6-digit code to ${clean}. (Demo code: ${DEMO_OTP})` };
}

export async function logoutAction() {
  const user = await getSessionUser();
  if (user) await mutate((db) => logActivity(db, user, "user.logout", { type: "profile", id: user.id }));
  await clearSession();
  revalidatePath("/", "layout");
  redirect(user && isStaff(user.role) ? "/admin/login" : "/");
}
