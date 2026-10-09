"use client";

import { useActionState, useState } from "react";
import { updateLeadAction } from "@/actions/leads";
import { Field, FormAlert } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { LEAD_STAGE_LABELS, LEAD_STAGES, LOST_REASONS, type LeadStage } from "@/lib/constants";
import type { ActionState } from "@/lib/types";

export function LeadStageForm({ leadId, stage, siteVisitAt }: { leadId: string; stage: LeadStage; siteVisitAt: string }) {
  const [state, action] = useActionState<ActionState, FormData>(updateLeadAction, {});
  const [next, setNext] = useState<LeadStage>(stage);
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="lead_id" value={leadId} />
      {state.message && <FormAlert tone={state.ok ? "success" : "error"}>{state.message}</FormAlert>}
      <Field label="Stage" htmlFor="stage">
        <select id="stage" name="stage" className="input" value={next} onChange={(ev) => setNext(ev.target.value as LeadStage)}>
          {LEAD_STAGES.map((s) => (
            <option key={s} value={s}>{LEAD_STAGE_LABELS[s]}</option>
          ))}
        </select>
      </Field>
      {next === "site_visit_scheduled" && (
        <Field label="Visit date & time" htmlFor="site_visit_at" error={e.site_visit_at} className="animate-fade-up">
          <input id="site_visit_at" name="site_visit_at" type="datetime-local" className="input" defaultValue={siteVisitAt} />
        </Field>
      )}
      {next === "closed_lost" && (
        <Field label="Why was it lost?" htmlFor="lost_reason" error={e.lost_reason} className="animate-fade-up">
          <select id="lost_reason" name="lost_reason" className="input" defaultValue="">
            <option value="">Choose a reason</option>
            {LOST_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Note" htmlFor="note" optional hint="e.g. “Called — wants a higher floor”">
        <textarea id="note" name="note" rows={3} className="input !min-h-20" />
      </Field>
      <SubmitButton className="btn btn-primary w-full" pendingText="Saving…">
        {next === stage ? "Add note" : `Move to “${LEAD_STAGE_LABELS[next]}”`}
      </SubmitButton>
    </form>
  );
}
