import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { connection } from "next/server";
import type { Database } from "./types";
import { buildSeed } from "./seed";

/**
 * Local development data store.
 *
 * Persists the same tables as the Supabase schema (supabase/migrations) to
 * `.data/db.json` so the whole product works without any cloud credentials.
 * To go live, replace `readDb` / `mutate` with Supabase queries — every page
 * and server action goes through src/lib/queries.ts and src/actions/*, so the
 * swap stays inside the data layer.
 */

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

type Store = { loading: Promise<Database> | null; queue: Promise<unknown> };
const g = globalThis as unknown as { __rgStore?: Store };
const store: Store = (g.__rgStore ??= { loading: null, queue: Promise.resolve() });

function load(): Promise<Database> {
  store.loading ??= (async () => {
    try {
      return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Database;
    } catch {
      const db = buildSeed();
      await persist(db);
      return db;
    }
  })();
  return store.loading;
}

async function persist(db: Database) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 1), "utf8");
  await fs.rename(tmp, DB_FILE);
}

/** Read a snapshot of the database. Always request-time (never prerendered). */
export async function readDb(): Promise<Database> {
  await connection();
  return load();
}

/** Run a mutation serially and persist it. */
export function mutate<T>(fn: (db: Database) => T | Promise<T>): Promise<T> {
  const run = store.queue.then(async () => {
    const db = await load();
    const result = await fn(db);
    await persist(db);
    return result;
  });
  store.queue = run.catch(() => undefined);
  return run;
}

export const uid = () => crypto.randomUUID();
export const nowIso = () => new Date().toISOString();
