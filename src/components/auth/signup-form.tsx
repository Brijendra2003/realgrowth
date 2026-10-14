"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowRight, Building2, Check, Home, Search, UserRound } from "lucide-react";
import { signupAction } from "@/actions/auth";
import { Field, FormAlert } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Turnstile } from "@/components/ui/turnstile";
import { SIGNUP_ROLE_CARDS, type PublicRole } from "@/lib/constants";
import type { ActionState } from "@/lib/types";

const ICONS: Record<PublicRole, typeof Home> = { buyer: Search, developer: Building2, owner: Home, broker: UserRound };

export function SignupForm({ defaultRole, next }: { defaultRole?: PublicRole; next?: string }) {
  const [state, action] = useActionState<ActionState, FormData>(signupAction, {});
  const v = state.values ?? {};
  const [role, setRole] = useState<PublicRole | undefined>((v.role as PublicRole) ?? defaultRole);
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-6" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {e.form && <FormAlert>{e.form}</FormAlert>}

      <fieldset>
        <legend className="label">What describes you best?</legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SIGNUP_ROLE_CARDS.map((c) => {
            const Icon = ICONS[c.role];
            const active = role === c.role;
            return (
              <label
                key={c.role}
                className={`relative flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition ${
                  active ? "border-brand-green bg-brand-green-50 shadow-card" : "border-line bg-paper hover:border-brand-green/40"
                }`}
              >
                <input type="radio" name="role" value={c.role} checked={active} onChange={() => setRole(c.role)} className="sr-only" />
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${active ? "bg-brand-green text-white" : "bg-sand text-brand-green"}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <span>
                  <span className="block font-semibold leading-snug">{c.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">{c.body}</span>
                </span>
                {active && (
                  <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-brand-green text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
              </label>
            );
          })}
        </div>
        {e.role && <p className="field-error">{e.role}</p>}
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" htmlFor="full_name" error={e.full_name} className="sm:col-span-2">
          <input id="full_name" name="full_name" className="input" autoComplete="name" defaultValue={v.full_name} aria-invalid={!!e.full_name} />
        </Field>
        <Field label="Mobile number" htmlFor="phone" error={e.phone} hint="We'll use this to sign you in">
          <input id="phone" name="phone" inputMode="numeric" className="input" placeholder="98XXXXXXXX" autoComplete="tel-national" defaultValue={v.phone} aria-invalid={!!e.phone} />
        </Field>
        <Field label="Email" htmlFor="email" optional error={e.email}>
          <input id="email" name="email" type="email" className="input" autoComplete="email" defaultValue={v.email} />
        </Field>
        <Field label="Create a password" htmlFor="password" error={e.password} hint="At least 8 characters" className="sm:col-span-2">
          <PasswordInput id="password" name="password" autoComplete="new-password" aria-invalid={!!e.password} />
        </Field>
        {(role === "developer" || role === "broker") && (
          <Field label={role === "developer" ? "Company name" : "Firm name"} htmlFor="company_name" optional hint="You can add this later" className="animate-fade-up">
            <input id="company_name" name="company_name" className="input" defaultValue={v.company_name} />
          </Field>
        )}
        {role === "broker" && (
          <Field label="MahaRERA agent number" htmlFor="agent_rera_no" optional hint="Starts with A5…" className="animate-fade-up">
            <input id="agent_rera_no" name="agent_rera_no" className="input" defaultValue={v.agent_rera_no} />
          </Field>
        )}
      </div>

      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" name="consent" className="mt-0.5 h-4 w-4 accent-brand-green" />
        <span>
          I agree to the <Link href="/terms" className="font-semibold text-brand-green underline-offset-2 hover:underline">terms</Link> and to Real Growth
          processing my details as described in the <Link href="/privacy" className="font-semibold text-brand-green underline-offset-2 hover:underline">privacy policy</Link>.
        </span>
      </label>
      {e.consent && <p className="field-error -mt-4">{e.consent}</p>}

      <Turnstile action="signup" resetOn={state} />

      <SubmitButton className="btn btn-primary btn-lg w-full" pendingText="Creating your account…">
        Create free account <ArrowRight className="h-4 w-4" strokeWidth={2} />
      </SubmitButton>
    </form>
  );
}
