"use client";

import { useActionState } from "react";
import { Check, Handshake, X } from "lucide-react";
import { requestContactAction, respondContactAction } from "@/actions/requirements";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionState } from "@/lib/types";

/** Lister: ask a matching buyer to share their number. */
export function RequestContactButton({ requirementId, projectId }: { requirementId: string; projectId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(requestContactAction, {});
  if (state.ok) return <p className="text-sm font-medium text-brand-green">{state.message}</p>;
  return (
    <form action={action} className="flex flex-col items-start gap-1.5 sm:items-end">
      <input type="hidden" name="requirement_id" value={requirementId} />
      <input type="hidden" name="project_id" value={projectId} />
      <SubmitButton className="btn btn-primary btn-sm" pendingText="Sending…">
        <Handshake className="h-4 w-4" strokeWidth={1.8} /> Request contact
      </SubmitButton>
      {state.message && <p className="text-xs text-danger">{state.message}</p>}
    </form>
  );
}

/** Buyer: accept (share number) or decline a lister's request. */
export function RespondButtons({ contactId }: { contactId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(respondContactAction, {});
  if (state.ok) return <p className="text-sm font-medium text-brand-green">{state.message}</p>;
  return (
    <form action={action} className="flex flex-col gap-1.5">
      <input type="hidden" name="contact_id" value={contactId} />
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="decision" value="accept" className="btn btn-primary btn-sm" pendingText="Sharing…">
          <Check className="h-4 w-4" strokeWidth={2.2} /> Share my number
        </SubmitButton>
        <button name="decision" value="decline" className="btn btn-ghost btn-sm">
          <X className="h-4 w-4" strokeWidth={2} /> No thanks
        </button>
      </div>
      {state.message && <p className="text-xs text-danger">{state.message}</p>}
    </form>
  );
}
