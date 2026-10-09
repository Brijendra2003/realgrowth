import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ListerBadge } from "@/components/ui/chips";
import { FormAlert } from "@/components/ui/field";
import { PageTitle } from "@/components/ui/page-title";
import { requireStaff } from "@/lib/auth";
import { CATEGORY_SHORT } from "@/lib/constants";
import { formatPrice, timeAgo } from "@/lib/format";
import { getVerificationQueue } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Verification queue" };

export default async function VerificationPage({ searchParams }: PageProps<"/admin/verification">) {
  const sp = await searchParams;
  await requireStaff();
  const queue = await getVerificationQueue();
  return (
    <>
      {sp.done === "verified" && <div className="mb-6"><FormAlert tone="success">Approved — the property is now live and the lister has been notified.</FormAlert></div>}
      {sp.done === "rejected" && <div className="mb-6"><FormAlert tone="info">Sent back to the lister with your reason.</FormAlert></div>}
      <PageTitle eyebrow="Moderation" title="Verification queue" description={`${queue.length} waiting · oldest first. Nothing goes public until it's approved here.`} />
      {queue.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="All caught up" body="New listings and edited live listings will appear here." />
      ) : (
        <ul className="space-y-3">
          {queue.map((p, i) => (
            <li key={p.id}>
              <Link href={`/admin/verification/${p.id}`} className="card group flex items-center gap-4 p-4 transition hover:shadow-lift">
                <span className="w-6 text-center font-display text-lg font-semibold text-muted">{i + 1}</span>
                <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-sand">
                  {p.cover && <Image src={p.cover} alt="" fill sizes="96px" className="object-cover" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-semibold group-hover:text-brand-green">{p.title}</p>
                    <ListerBadge role={p.lister.role} />
                    {p.maharera_no && <span className="chip bg-brand-gold-50 text-[#8a6100]"><ShieldCheck className="h-3 w-3" /> {p.maharera_no}</span>}
                  </div>
                  <p className="text-sm text-muted">
                    {p.code} · {CATEGORY_SHORT[p.category]} · {p.area.name} · {formatPrice(p.price, p.purpose)} · by {p.lister.company_name ?? p.lister.full_name}
                  </p>
                </div>
                <span className="hidden text-xs text-muted sm:block">waiting {timeAgo(p.updated_at).replace(" ago", "")}</span>
                <ArrowRight className="h-5 w-5 text-muted transition group-hover:translate-x-1 group-hover:text-brand-green" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
