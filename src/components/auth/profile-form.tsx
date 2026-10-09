"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/actions/profile";
import { Field, FormAlert } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionState, SessionUser } from "@/lib/types";

export function ProfileForm({ user }: { user: SessionUser }) {
  const [state, action] = useActionState<ActionState, FormData>(updateProfileAction, {});
  const e = state.errors ?? {};
  const v = state.values ?? {};
  const business = user.role === "developer" || user.role === "broker";
  return (
    <form action={action} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {state.message && <div className="sm:col-span-2"><FormAlert tone={state.ok ? "success" : "error"}>{state.message}</FormAlert></div>}
      <Field label="Full name" htmlFor="full_name" error={e.full_name}>
        <input id="full_name" name="full_name" className="input" defaultValue={v.full_name ?? user.full_name} />
      </Field>
      <Field label="Mobile number" htmlFor="phone" hint="Contact us to change your mobile number.">
        <input id="phone" className="input bg-canvas" value={`+91 ${user.phone}`} disabled />
      </Field>
      <Field label="Email" htmlFor="email" optional error={e.email}>
        <input id="email" name="email" type="email" className="input" defaultValue={v.email ?? user.email ?? ""} />
      </Field>
      {business && (
        <Field label="Company / firm name" htmlFor="company_name" optional>
          <input id="company_name" name="company_name" className="input" defaultValue={v.company_name ?? user.company_name ?? ""} />
        </Field>
      )}
      {user.role === "broker" && (
        <Field label="MahaRERA agent number" htmlFor="agent_rera_no" optional>
          <input id="agent_rera_no" name="agent_rera_no" className="input" defaultValue={v.agent_rera_no ?? user.agent_rera_no ?? ""} />
        </Field>
      )}
      <div className="sm:col-span-2">
        <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
      </div>
    </form>
  );
}
