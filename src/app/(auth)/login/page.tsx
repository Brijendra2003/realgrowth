import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser, homeFor } from "@/lib/auth";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : undefined;
  const user = await getSessionUser();
  if (user) redirect(next ?? homeFor(user.role));
  // Someone on their way to post a requirement is a buyer, so preselect that card on sign-up.
  const signupQuery = new URLSearchParams({ ...(next ? { next } : {}), ...(next?.startsWith("/requirements") ? { role: "buyer" } : {}) }).toString();

  return (
    <div className="w-full max-w-md animate-fade-up">
      <p className="eyebrow">Welcome back</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
        Sign in to <span className="accent-serif text-brand-green">Real Growth</span>
      </h1>
      <p className="mt-2 text-ink-soft">
        {next ? "Please sign in to continue — we'll bring you right back." : "Use your mobile number and password."}
      </p>
      <div className="mt-8">
        <LoginForm next={next} />
      </div>
      <p className="mt-6 text-center text-sm text-ink-soft">
        New to Real Growth?{" "}
        <Link href={`/signup${signupQuery ? `?${signupQuery}` : ""}`} className="font-semibold text-brand-green hover:underline">
          Create a free account
        </Link>
      </p>
    </div>
  );
}
