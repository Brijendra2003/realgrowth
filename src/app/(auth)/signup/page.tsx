import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { getSessionUser, homeFor } from "@/lib/auth";
import { LISTER_ROLES, type ListerRole } from "@/lib/constants";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") && !sp.next.startsWith("//") ? sp.next : undefined;
  const role = (LISTER_ROLES as readonly string[]).includes(String(sp.role)) ? (sp.role as ListerRole) : undefined;
  const user = await getSessionUser();
  if (user) redirect(homeFor(user.role));

  return (
    <div className="w-full max-w-xl animate-fade-up">
      <p className="eyebrow">Free to list</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
        Create your <span className="accent-serif text-brand-green">account</span>
      </h1>
      <p className="mt-2 text-ink-soft">Takes about a minute, then you can list a property. Looking to buy or rent? You don&apos;t need an account. Just send an enquiry from any property.</p>
      <div className="mt-8">
        <SignupForm defaultRole={role} next={next} />
      </div>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-green hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
