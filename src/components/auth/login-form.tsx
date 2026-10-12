"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { Field, FormAlert } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Turnstile } from "@/components/ui/turnstile";
import type { ActionState } from "@/lib/types";

export function LoginForm({ next, staff = false }: { next?: string; staff?: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(loginAction, {});
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
      {staff && <input type="hidden" name="staff" value="1" />}

      {e.form && <FormAlert>{e.form}</FormAlert>}

      <Field label="Mobile number" htmlFor="phone" error={e.phone}>
        <div className="flex">
          <span className="grid place-items-center rounded-l-[0.85rem] border-[1.5px] border-r-0 border-line bg-canvas px-3 text-sm text-muted">+91</span>
          <input
            id="phone"
            name="phone"
            inputMode="numeric"
            autoComplete="tel-national"
            className="input !rounded-l-none"
            defaultValue={state.values?.phone}
            aria-invalid={!!e.phone}
          />
        </div>
      </Field>

      <Field label="Password" htmlFor="password" error={e.password}>
        <PasswordInput id="password" name="password" autoComplete="current-password" aria-invalid={!!e.password} />
      </Field>

      <Turnstile action={staff ? "staff-login" : "login"} resetOn={state} />

      <SubmitButton className="btn btn-primary btn-lg w-full" pendingText="Signing you in…">
        Sign in <ArrowRight className="h-4 w-4" strokeWidth={2} />
      </SubmitButton>
    </form>
  );
}
