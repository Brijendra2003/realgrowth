import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { DemoAccounts } from "@/components/auth/demo-accounts";
import { LoginForm } from "@/components/auth/login-form";
import { LeafSprig } from "@/components/ui/decor";
import { getSessionUser } from "@/lib/auth";
import { isStaff } from "@/lib/constants";

export const metadata: Metadata = { title: "Team sign-in", robots: { index: false } };
export const instant = false;

export default async function AdminLoginPage() {
  const user = await getSessionUser();
  if (user && isStaff(user.role)) redirect("/admin");

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-brand-green-900 px-4 py-12">
      <LeafSprig className="absolute bottom-0 left-6 h-72 text-brand-cream/10" />
      <LeafSprig className="absolute right-6 top-0 h-64 rotate-180 text-brand-cream/10" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center text-brand-cream">
          <LogoMark className="mx-auto h-20 w-auto" line="#FFDFA0" />
          <p className="mt-4 font-display text-lg font-semibold tracking-[0.24em]">REAL GROWTH</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-brand-gold">
            <ShieldCheck className="h-3.5 w-3.5" /> Team console
          </p>
        </div>
        <div className="rounded-3xl bg-paper p-8 shadow-pop">
          <h1 className="text-2xl font-semibold">Team sign-in</h1>
          <p className="mt-1 text-sm text-muted">For Real Growth operations, admin and super admin accounts.</p>
          <div className="mt-6">
            <LoginForm staff />
          </div>
          <DemoAccounts staff />
        </div>
        <p className="mt-6 text-center text-sm text-brand-cream/70">
          Not on the team? <Link href="/login" className="font-semibold text-brand-cream hover:underline">Customer sign-in</Link>
        </p>
      </div>
    </main>
  );
}
