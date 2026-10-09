import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { isLister, isStaff, type UserRole } from "./constants";
import { readDb } from "./db";
import type { SessionUser } from "./types";

export const SESSION_COOKIE = "rg_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const SECRET = process.env.SESSION_SECRET ?? "dev-only-secret-change-me-in-env-local";

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { uid: string; exp: number };
    return exp > Date.now() ? uid : null;
  } catch {
    return null;
  }
}

export async function setSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** The signed-in user, or null. Deduplicated per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  await connection(); // the expiry check reads the clock, so this is always request-time
  const uid = readSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!uid) return null;
  const db = await readDb();
  const p = db.profiles.find((x) => x.id === uid);
  if (!p || p.is_blocked) return null;
  return {
    id: p.id,
    role: p.role,
    full_name: p.full_name,
    phone: p.phone,
    email: p.email,
    company_name: p.company_name,
    agent_rera_no: p.agent_rera_no,
  };
});

export async function requireUser(next = "/dashboard"): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireLister(next = "/dashboard"): Promise<SessionUser> {
  const user = await requireUser(next);
  if (!isLister(user.role)) redirect(isStaff(user.role) ? "/admin" : "/dashboard?notice=lister-only");
  return user;
}

export async function requireStaff(roles: UserRole[] = ["ops", "admin", "super_admin"]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (!roles.includes(user.role)) redirect(isStaff(user.role) ? "/admin?notice=no-access" : "/");
  return user;
}

export function homeFor(role: UserRole): string {
  return isStaff(role) ? "/admin" : "/dashboard";
}
