"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { clearSession, getSessionUser, homeFor, setSession } from "@/lib/auth";
import { CAPTCHA_FAILED, verifyCaptcha } from "@/lib/captcha";
import { isStaff } from "@/lib/constants";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clientIp, limited } from "@/lib/rate-limit";
import { row, sb } from "@/lib/supabase";
import type { ActionState, Profile } from "@/lib/types";
import { fieldErrors, formValues, loginSchema, signupSchema } from "@/lib/validators";

const TOO_MANY = "Too many attempts. Please wait a few minutes and try again.";
const MINUTES = 60_000;

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

  if (!(await verifyCaptcha(fd))) return { errors: { form: CAPTCHA_FAILED }, values };
  if (await limited(`signup:${await clientIp()}`, 5, 60 * MINUTES)) return { errors: { form: TOO_MANY }, values };

  const db = await sb();
  const { data, error } = await db
    .from("profiles")
    .insert({
      role: input.role,
      full_name: input.full_name,
      phone: input.phone,
      email: input.email,
      company_name: input.role === "developer" || input.role === "broker" ? input.company_name : null,
      agent_rera_no: input.role === "broker" ? input.agent_rera_no : null,
      password_hash: hashPassword(input.password),
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") return { errors: { phone: "This mobile number already has an account. Please sign in." }, values };
    console.error(`[signup] ${error.message}`);
    return { errors: { form: "We couldn't create your account just now. Please try again." }, values };
  }

  const id = (data as { id: string }).id;
  await logActivity({ id, role: input.role }, "user.signup", { type: "profile", id }, { name: input.full_name, role: input.role });
  await setSession(id);
  revalidatePath("/", "layout");
  redirect(safeNext(fd.get("next"), "/dashboard?welcome=1"));
}

export async function loginAction(_: ActionState, fd: FormData): Promise<ActionState> {
  const values = formValues(fd);
  const staffOnly = fd.get("staff") === "1";

  const parsed = loginSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const { phone, password } = parsed.data;

  if (!(await verifyCaptcha(fd))) return { errors: { form: CAPTCHA_FAILED }, values };
  const ip = await clientIp();
  if ((await limited(`login:tel:${phone}`, 8, 15 * MINUTES)) || (await limited(`login:ip:${ip}`, 30, 15 * MINUTES))) {
    return { errors: { form: TOO_MANY }, values };
  }

  const db = await sb();
  const user = row<Pick<Profile, "id" | "role" | "password_hash" | "is_blocked">>(
    await db.from("profiles").select("id,role,password_hash,is_blocked").eq("phone", phone).maybeSingle(),
  );
  // Same message whether the number is unknown or the password is wrong.
  const bad = { errors: { form: "Mobile number or password is incorrect." }, values };
  if (!user || !verifyPassword(password, user.password_hash)) return bad;
  if (staffOnly && !isStaff(user.role)) return bad;
  if (user.is_blocked) return { errors: { form: "This account has been paused. Please contact support." }, values };

  await setSession(user.id);
  await logActivity({ id: user.id, role: user.role }, "user.login", { type: "profile", id: user.id });
  revalidatePath("/", "layout");
  redirect(safeNext(fd.get("next"), homeFor(user.role)));
}

export async function logoutAction() {
  const user = await getSessionUser();
  if (user) await logActivity(user, "user.logout", { type: "profile", id: user.id });
  await clearSession();
  revalidatePath("/", "layout");
  redirect(user && isStaff(user.role) ? "/admin/login" : "/");
}
