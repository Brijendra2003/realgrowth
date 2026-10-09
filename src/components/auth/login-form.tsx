"use client";

import { useActionState, useState, useTransition } from "react";
import { ArrowRight, KeyRound, MessageSquareText } from "lucide-react";
import { loginAction, requestOtpAction } from "@/actions/auth";
import { Field, FormAlert } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ActionState } from "@/lib/types";

export function LoginForm({ next, staff = false }: { next?: string; staff?: boolean }) {
  const [state, action] = useActionState<ActionState, FormData>(loginAction, {});
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [phone, setPhone] = useState(state.values?.phone ?? "");
  const [otpMsg, setOtpMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [sending, startSending] = useTransition();
  const e = state.errors ?? {};

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="mode" value={mode} />
      {next && <input type="hidden" name="next" value={next} />}
      {staff && <input type="hidden" name="staff" value="1" />}

      {!staff && (
        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-full border border-line bg-paper p-1">
          {[
            { k: "password", l: "Password", i: KeyRound },
            { k: "otp", l: "One-time code", i: MessageSquareText },
          ].map((t) => (
            <button
              key={t.k}
              type="button"
              role="tab"
              aria-selected={mode === t.k}
              onClick={() => setMode(t.k as "password" | "otp")}
              className={`flex items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold transition ${
                mode === t.k ? "bg-brand-green text-white shadow" : "text-ink-soft hover:bg-sand"
              }`}
            >
              <t.i className="h-4 w-4" strokeWidth={1.8} /> {t.l}
            </button>
          ))}
        </div>
      )}

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
            value={phone}
            onChange={(ev) => setPhone(ev.target.value)}
            aria-invalid={!!e.phone}
          />
        </div>
      </Field>

      {mode === "password" ? (
        <Field label="Password" htmlFor="password" error={e.password}>
          <input id="password" name="password" type="password" autoComplete="current-password" className="input" aria-invalid={!!e.password} />
        </Field>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            disabled={sending}
            onClick={() => startSending(async () => setOtpMsg(await requestOtpAction(phone)))}
            className="btn btn-outline w-full"
          >
            {sending ? "Sending…" : otpMsg?.ok ? "Send the code again" : "Send me a code"}
          </button>
          {otpMsg && <FormAlert tone={otpMsg.ok ? "info" : "error"}>{otpMsg.message}</FormAlert>}
          <Field label="6-digit code" htmlFor="otp" error={e.otp}>
            <input id="otp" name="otp" inputMode="numeric" maxLength={6} autoComplete="one-time-code" className="input text-center text-lg tracking-[0.5em]" />
          </Field>
        </div>
      )}

      <SubmitButton className="btn btn-primary btn-lg w-full" pendingText="Signing you in…">
        Sign in <ArrowRight className="h-4 w-4" strokeWidth={2} />
      </SubmitButton>
    </form>
  );
}
