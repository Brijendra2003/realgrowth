"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: { sitekey: string; theme?: "light" | "dark" | "auto"; size?: "normal" | "flexible" | "compact"; action?: string }) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Cloudflare Turnstile bot check. Put it inside a <form>: it adds a hidden
 * `cf-turnstile-response` field that the server action verifies (src/lib/captcha.ts).
 * A token works once, so pass the action state as `resetOn` to get a fresh one
 * after every submit. Renders nothing until the site key is configured.
 */
export function Turnstile({ action, resetOn }: { action: string; resetOn?: unknown }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [ready, setReady] = useState(() => typeof window !== "undefined" && !!window.turnstile);

  useEffect(() => {
    if (!ready || !SITE_KEY || !box.current || !window.turnstile || widget.current) return;
    const api = window.turnstile;
    const id = api.render(box.current, { sitekey: SITE_KEY, theme: "light", size: "flexible", action });
    widget.current = id;
    return () => {
      api.remove(id);
      widget.current = null;
    };
  }, [ready, action]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (widget.current) window.turnstile?.reset(widget.current);
  }, [resetOn]);

  if (!SITE_KEY) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setReady(true)} />
      <div ref={box} className="min-h-[65px]" />
    </>
  );
}
