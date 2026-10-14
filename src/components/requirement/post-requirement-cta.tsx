import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";

/**
 * "Didn't find it?" prompt on search. Visitors go through sign-up first;
 * `href` already carries the search filters so the form starts prefilled.
 */
export function PostRequirementCta({ href, compact = false }: { href: string; compact?: boolean }) {
  return (
    <div className={`flex flex-col gap-4 rounded-2xl border border-brand-gold/30 bg-brand-gold-50/70 sm:flex-row sm:items-center ${compact ? "p-4" : "p-5 sm:p-6"}`}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-green text-brand-cream">
        <ClipboardList className="h-5 w-5" strokeWidth={1.6} />
      </span>
      <div className="flex-1">
        <p className="font-semibold">Didn&apos;t find what you&apos;re looking for?</p>
        <p className="text-sm text-ink-soft">
          Post your requirement. We&apos;ll show how well every property matches, in percent, and tell you when a new one comes up.
        </p>
      </div>
      <Link href={href} className="btn btn-primary shrink-0">
        Post a requirement <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
