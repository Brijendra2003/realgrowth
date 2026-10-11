// Creates (or resets the password of) a Real Growth team account.
// The first super admin has to be made this way; after that, super admins add
// staff from /admin/staff.
//
//   npm run create-admin
//
// Reads the Supabase keys from .env.local. Passwords use the same scrypt format
// as src/lib/password.ts.

import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("Supabase keys not found. Run this with `npm run create-admin` from the project folder, with .env.local filled in.");
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
let muted = false;
const write = rl._writeToOutput.bind(rl);
rl._writeToOutput = (text) => write(muted && !text.includes("\n") ? "" : text);

const ask = (question, { hidden = false } = {}) =>
  new Promise((resolve) => {
    rl.question(question, (answer) => {
      muted = false;
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
    muted = hidden;
  });

const ROLES = ["super_admin", "admin", "ops"];

try {
  const full_name = await ask("Full name: ");
  const phone = (await ask("Mobile number (10 digits): ")).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  const email = (await ask("Email (optional): ")) || null;
  const role = (await ask(`Role [${ROLES.join(" / ")}] (super_admin): `)) || "super_admin";
  const password = await ask("Password (at least 10 characters, not shown): ", { hidden: true });
  const again = await ask("Password again: ", { hidden: true });

  if (full_name.length < 2) throw new Error("Please enter a name.");
  if (!/^[6-9]\d{9}$/.test(phone)) throw new Error("That doesn't look like a 10-digit Indian mobile number.");
  if (!ROLES.includes(role)) throw new Error(`Role must be one of: ${ROLES.join(", ")}.`);
  if (password.length < 10) throw new Error("The password needs at least 10 characters.");
  if (password !== again) throw new Error("The two passwords don't match.");

  const salt = randomBytes(16).toString("hex");
  const password_hash = `${salt}:${scryptSync(password, salt, 32).toString("hex")}`;

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const existing = await db.from("profiles").select("id,role,full_name").eq("phone", phone).maybeSingle();
  if (existing.error) throw new Error(`${existing.error.message}\nHave you run supabase/migrations/0002_server_side_access.sql?`);

  if (existing.data) {
    const ok = (await ask(`${existing.data.full_name} (${existing.data.role}) already uses this number. Reset the password and set role to ${role}? [y/N] `)).toLowerCase();
    if (ok !== "y") throw new Error("Nothing changed.");
    const res = await db.from("profiles").update({ password_hash, role, full_name, email, is_blocked: false }).eq("id", existing.data.id);
    if (res.error) throw new Error(res.error.message);
    console.log(`Updated. ${full_name} can sign in at /admin/login with ${phone}.`);
  } else {
    const res = await db.from("profiles").insert({ role, full_name, phone, email, password_hash });
    if (res.error) throw new Error(`${res.error.message}\nHave you run supabase/migrations/0002_server_side_access.sql?`);
    console.log(`Created. ${full_name} can sign in at /admin/login with ${phone}.`);
  }
} catch (err) {
  console.error(`\n${err.message}`);
  process.exitCode = 1;
} finally {
  rl.close();
}
