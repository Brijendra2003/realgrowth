import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { connection } from "next/server";

/**
 * The only door to the database. Every read goes through src/lib/queries.ts
 * and every write through src/actions/*, both on the server with the service
 * role key. Row Level Security is on with no policies, so the public anon key
 * can reach nothing (supabase/migrations/0002_server_side_access.sql).
 */

let client: SupabaseClient | undefined;

function admin(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example).");
  }
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/** Server-side Supabase client. Always request-time (never prerendered). */
export async function sb(): Promise<SupabaseClient> {
  await connection();
  return admin();
}

type Result<T> = { data: T | null; error: { message: string; code?: string } | null };

/** Returns the rows of a query, or throws so the error boundary shows instead of silently empty data. */
export function rows<T>(res: Result<unknown>): T[] {
  if (res.error) throw new Error(`Database error: ${res.error.message}`);
  return (res.data ?? []) as T[];
}

/** Returns the single row of a `.maybeSingle()` query, or null. */
export function row<T>(res: Result<unknown>): T | null {
  if (res.error) throw new Error(`Database error: ${res.error.message}`);
  return (res.data ?? null) as T | null;
}

/** Returns the count of a `{ count: "exact", head: true }` query. */
export function total(res: { count: number | null; error: { message: string } | null }): number {
  if (res.error) throw new Error(`Database error: ${res.error.message}`);
  return res.count ?? 0;
}

const PAGE = 1000; // PostgREST returns at most 1000 rows per request

/** Reads every row of a query, a page at a time. Give the query a stable order. */
export async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<Result<unknown>>, max = 20_000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < max; from += PAGE) {
    const batch = rows<T>(await page(from, from + PAGE - 1));
    out.push(...batch);
    if (batch.length < PAGE) break;
  }
  return out;
}
