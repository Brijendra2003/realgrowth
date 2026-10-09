"use client";

import { useActionState } from "react";
import { createStaffAction } from "@/actions/admin";
import { Field, FormAlert } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionState } from "@/lib/types";

export function StaffForm() {
  const [state, action] = useActionState<ActionState, FormData>(createStaffAction, {});
  const e = state.errors ?? {};
  const v = state.ok ? {} : (state.values ?? {});
  return (
    <form action={action} className="space-y-4" key={state.ok ? state.message : "form"}>
      {state.message && <FormAlert tone={state.ok ? "success" : "error"}>{state.message}</FormAlert>}
      <Field label="Full name" htmlFor="s-name" error={e.full_name}><input id="s-name" name="full_name" className="input" defaultValue={v.full_name} /></Field>
      <Field label="Mobile number" htmlFor="s-phone" error={e.phone}><input id="s-phone" name="phone" inputMode="numeric" className="input" defaultValue={v.phone} /></Field>
      <Field label="Email" htmlFor="s-email" optional error={e.email}><input id="s-email" name="email" type="email" className="input" defaultValue={v.email} /></Field>
      <Field label="Role" htmlFor="s-role">
        <select id="s-role" name="role" className="input" defaultValue={v.role ?? "ops"}>
          <option value="ops">Operations — verify listings, monitor leads</option>
          <option value="admin">Admin — plus block users</option>
          <option value="super_admin">Super admin — full control</option>
        </select>
      </Field>
      <Field label="Temporary password" htmlFor="s-pass" error={e.password} hint="Share it privately; they can sign in at /admin/login.">
        <input id="s-pass" name="password" type="password" className="input" autoComplete="new-password" />
      </Field>
      <SubmitButton className="btn btn-primary w-full" pendingText="Adding…">Add team member</SubmitButton>
    </form>
  );
}
