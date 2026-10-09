"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { reviewProjectAction } from "@/actions/admin";
import { Field, FormAlert } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionState } from "@/lib/types";

export function ReviewForm({ projectId, needsRera }: { projectId: string; needsRera: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(reviewProjectAction, {});
  const [mode, setMode] = useState<"approve" | "reject">("approve");
  const checks = [
    "Called the lister and confirmed they own / are authorised to list it",
    "Photos look genuine and match the property type",
    "Area, address and price look right",
    needsRera ? "MahaRERA number checked on the MahaRERA website" : "No MahaRERA needed (ready / resale)",
  ];

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="project_id" value={projectId} />
      {state.message && <FormAlert>{state.message}</FormAlert>}
      <div className="grid grid-cols-2 gap-1 rounded-full bg-canvas p-1">
        <button type="button" onClick={() => setMode("approve")} className={`rounded-full py-2 text-sm font-semibold ${mode === "approve" ? "bg-brand-green text-white" : "text-ink-soft"}`}>Approve</button>
        <button type="button" onClick={() => setMode("reject")} className={`rounded-full py-2 text-sm font-semibold ${mode === "reject" ? "bg-clay text-white" : "text-ink-soft"}`}>Ask for changes</button>
      </div>

      {mode === "approve" ? (
        <fieldset>
          <legend className="label">Checklist</legend>
          <ul className="space-y-2.5">
            {checks.map((c, i) => (
              <li key={c}>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper p-3 text-sm hover:border-brand-green/40">
                  <input type="checkbox" name="check" value={i} className="mt-0.5 h-4 w-4 accent-brand-green" />
                  {c}
                </label>
              </li>
            ))}
          </ul>
          {state.errors?.check && <p className="field-error">{state.errors.check}</p>}
        </fieldset>
      ) : (
        <Field label="What should the lister fix?" htmlFor="reason" error={state.errors?.reason} hint="They'll see this exactly as you write it. Be specific and friendly.">
          <textarea id="reason" name="reason" rows={4} className="input" placeholder="e.g. Please upload a clear photo of the building entrance." />
        </Field>
      )}

      <input type="hidden" name="decision" value={mode} />
      {mode === "approve" ? (
        <SubmitButton className="btn btn-primary btn-lg w-full" pendingText="Approving…">
          <CheckCircle2 className="h-5 w-5" /> Approve & publish
        </SubmitButton>
      ) : (
        <SubmitButton className="btn btn-lg w-full bg-clay text-white hover:bg-[#a9512e]" pendingText="Sending…">
          <XCircle className="h-5 w-5" /> Send back to lister
        </SubmitButton>
      )}
    </form>
  );
}
