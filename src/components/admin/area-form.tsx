"use client";

import { useActionState } from "react";
import { addAreaAction } from "@/actions/admin";
import { Field, FormAlert } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionState } from "@/lib/types";

export function AreaForm({ zones }: { zones: string[] }) {
  const [state, action] = useActionState<ActionState, FormData>(addAreaAction, {});
  return (
    <form action={action} className="space-y-4" key={state.ok ? state.message : "form"}>
      {state.message && <FormAlert tone={state.ok ? "success" : "error"}>{state.message}</FormAlert>}
      <Field label="Zone" htmlFor="zone" error={state.errors?.zone}>
        <select id="zone" name="zone" className="input" defaultValue="">
          <option value="">Choose a zone</option>
          {zones.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
      </Field>
      <Field label="Area name" htmlFor="name" error={state.errors?.name}>
        <input id="name" name="name" className="input" placeholder="e.g. Golden Nest" />
      </Field>
      <SubmitButton className="btn btn-primary w-full" pendingText="Adding…">Add area</SubmitButton>
    </form>
  );
}
