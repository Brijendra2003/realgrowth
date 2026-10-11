import "server-only";
import { clientIp } from "./rate-limit";

/**
 * Cloudflare Turnstile — bot check on sign-in, sign-up and the public enquiry form.
 * The widget (src/components/ui/turnstile.tsx) adds a `cf-turnstile-response`
 * field to the form; this verifies it with Cloudflare.
 */

const SECRET = process.env.TURNSTILE_SECRET_KEY;
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
let warned = false;

export const CAPTCHA_FAILED = "We couldn't confirm you're not a robot. Please try again.";

export async function verifyCaptcha(fd: FormData): Promise<boolean> {
  if (!SECRET || !SITE_KEY) {
    if (!warned && process.env.NODE_ENV === "production") {
      warned = true;
      console.warn("[captcha] Turnstile keys are not set — forms are NOT protected against bots. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY.");
    }
    return true;
  }
  const token = fd.get("cf-turnstile-response");
  if (typeof token !== "string" || !token) return false;
  try {
    const body = new URLSearchParams({ secret: SECRET, response: token });
    const ip = await clientIp();
    if (ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body, cache: "no-store" });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[captcha] verification request failed", err);
    return false;
  }
}
