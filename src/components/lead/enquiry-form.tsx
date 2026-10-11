"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, Repeat, Send } from "lucide-react";
import { enquiryAction } from "@/actions/leads";
import { Field, FormAlert } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Turnstile } from "@/components/ui/turnstile";
import type { ActionState } from "@/lib/types";

export function EnquiryForm({
  projectId,
  defaults,
  priorWithLister,
  alreadyEnquired,
  listerName,
  signedIn,
}: {
  projectId: string;
  defaults: { name: string; phone: string };
  priorWithLister: number;
  alreadyEnquired: boolean;
  listerName: string;
  signedIn: boolean;
}) {
  const [state, action] = useActionState<ActionState, FormData>(enquiryAction, {});
  const v = state.values ?? {};

  if (state.ok) {
    return (
      <div className="animate-fade-up py-4 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-brand-green" strokeWidth={1.4} />
        <p className="mt-3 text-lg font-semibold">Enquiry sent</p>
        <p className="mt-1 text-sm text-ink-soft">{state.message}</p>
        {signedIn && (
          <Link href="/my-enquiries" className="btn btn-outline btn-sm mt-5">
            Track my enquiries
          </Link>
        )}
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="project_id" value={projectId} />
      {priorWithLister > 0 && (
        <div className="flex gap-3 rounded-xl border border-clay/20 bg-clay-50 p-3 text-sm text-clay">
          <Repeat className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          <p>
            You&apos;ve already enquired on <strong>{priorWithLister}</strong> {priorWithLister === 1 ? "project" : "projects"} from {listerName}. We&apos;ve filled in your details.
          </p>
        </div>
      )}
      {alreadyEnquired && <FormAlert tone="info">You&apos;ve enquired here before. Sending again will remind the lister.</FormAlert>}
      {state.message && !state.ok && <FormAlert>{state.message}</FormAlert>}

      <Field label="Your name" htmlFor="enq-name" error={state.errors?.name}>
        <input id="enq-name" name="name" className="input" defaultValue={v.name ?? defaults.name} autoComplete="name" aria-invalid={!!state.errors?.name} />
      </Field>
      <Field label="Mobile number" htmlFor="enq-phone" error={state.errors?.phone}>
        <div className="flex">
          <span className="grid place-items-center rounded-l-[0.85rem] border-[1.5px] border-r-0 border-line bg-canvas px-3 text-sm text-muted">+91</span>
          <input id="enq-phone" name="phone" inputMode="numeric" className="input !rounded-l-none" defaultValue={v.phone ?? defaults.phone} autoComplete="tel-national" aria-invalid={!!state.errors?.phone} />
        </div>
      </Field>
      <Field label="Message" htmlFor="enq-msg" optional error={state.errors?.message}>
        <textarea id="enq-msg" name="message" rows={3} className="input !min-h-24" defaultValue={v.message ?? "I'm interested in this property. Please call me."} />
      </Field>
      <label className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-soft">
        <input type="checkbox" name="consent" defaultChecked className="mt-0.5 h-4 w-4 accent-brand-green" />
        <span>
          Share my name and number with the lister so they can call me. See our <Link href="/privacy" className="underline">privacy policy</Link>.
        </span>
      </label>
      {state.errors?.consent && <p className="field-error">{state.errors.consent}</p>}
      <Turnstile action="enquiry" resetOn={state} />
      <SubmitButton className="btn btn-primary btn-lg w-full" pendingText="Sending…">
        <Send className="h-4 w-4" strokeWidth={2} /> Send enquiry
      </SubmitButton>
    </form>
  );
}
