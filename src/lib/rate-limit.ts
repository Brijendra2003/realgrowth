import "server-only";
import { headers } from "next/headers";
import { sb } from "./supabase";

/** The caller's IP as reported by the hosting proxy. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/**
 * Counts this attempt and reports whether `key` is over `max` attempts in the
 * window. Stored in the database (`rate_hits`) so it holds across server
 * instances. If the check itself fails we let the request through rather than
 * lock everyone out.
 */
export async function limited(key: string, max: number, windowMs: number): Promise<boolean> {
  const db = await sb();
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error } = await db.from("rate_hits").select("id", { count: "exact", head: true }).eq("key", key).gte("created_at", since);
  if (error) {
    console.error(`[rate-limit] ${error.message}`);
    return false;
  }
  if ((count ?? 0) >= max) return true;
  await db.from("rate_hits").insert({ key });
  // Occasionally clear out old rows.
  if (Math.random() < 0.02) {
    await db.from("rate_hits").delete().lt("created_at", new Date(Date.now() - 2 * 86_400_000).toISOString());
  }
  return false;
}
