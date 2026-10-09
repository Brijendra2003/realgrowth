import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Phone, ShieldCheck } from "lucide-react";
import { ReviewForm } from "@/components/admin/review-form";
import { LeadStageChip, ProjectStatusChip, RoleChip } from "@/components/ui/chips";
import { requireStaff } from "@/lib/auth";
import { CATEGORY_LABELS, CONSTRUCTION_LABELS, PURPOSE_LABELS, SEGMENT_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime, formatMonthYear, formatPrice } from "@/lib/format";
import { getProjectForReview } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Review listing" };

export default async function ReviewPage({ params }: PageProps<"/admin/verification/[id]">) {
  const { id } = await params;
  await requireStaff();
  const data = await getProjectForReview(id);
  if (!data) notFound();
  const { project: p, listerProfile: l, reviews, leads } = data;

  const facts: [string, string][] = [
    ["Listing ID", p.code],
    ["Purpose", PURPOSE_LABELS[p.purpose]],
    ["Segment", SEGMENT_LABELS[p.segment]],
    ["Category", CATEGORY_LABELS[p.category]],
    ["Construction", CONSTRUCTION_LABELS[p.construction_status]],
    ["Type", p.type.name],
    ["Size", p.configuration],
    ["Carpet area", `${p.carpet_area_sqft} sq ft`],
    ["Price", `${formatPrice(p.price, p.purpose)}${p.purpose === "rent" ? "/month" : ""}`],
    ["Area", `${p.area.name} (${p.area.zone})`],
    ["Address", p.address_line],
    ["Possession", formatMonthYear(p.possession_date)],
    ["Submitted", formatDateTime(p.created_at)],
    ["Last updated", formatDateTime(p.updated_at)],
  ];

  return (
    <>
      <Link href="/admin/verification" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Verification queue
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold sm:text-3xl">{p.title}</h1>
        <ProjectStatusChip status={p.status} />
        <Link href={`/projects/${p.slug}`} className="ml-auto flex items-center gap-1 text-sm font-semibold text-brand-green hover:underline">
          Preview as buyer <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {p.media.map((m, i) => (
              <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className={`relative overflow-hidden rounded-xl bg-sand ${i === 0 ? "col-span-2 row-span-2 aspect-[4/3]" : "aspect-[4/3]"}`}>
                <Image src={m.url} alt={`Photo ${i + 1}`} fill sizes="(min-width:1280px) 30vw, 50vw" className="object-cover" />
              </a>
            ))}
          </div>

          {p.maharera_no && (
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand-gold/40 bg-brand-gold-50/70 p-4">
              <ShieldCheck className="h-6 w-6 text-[#8a6100]" />
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#8a6100]">MahaRERA number to verify</p>
                <p className="font-display text-xl font-semibold tracking-wider">{p.maharera_no}</p>
              </div>
              <a href="https://maharera.maharashtra.gov.in/" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm bg-paper">Open MahaRERA <ExternalLink className="h-3.5 w-3.5" /></a>
            </div>
          )}

          <section className="card overflow-hidden">
            <dl className="grid grid-cols-1 sm:grid-cols-2">
              {facts.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line-soft px-5 py-3 text-sm">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Description</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{p.description}</p>
              {p.amenities.length > 0 && <p className="mt-3 text-sm text-muted">Amenities: {p.amenities.join(", ")}</p>}
            </div>
          </section>

          {leads.length > 0 && (
            <section className="card p-5">
              <h2 className="text-sm font-semibold">Leads on this project ({leads.length})</h2>
              <ul className="mt-3 divide-y divide-line-soft text-sm">
                {leads.map((x) => (
                  <li key={x.id} className="flex items-center justify-between py-2.5">
                    <span>{x.name} · +91 {x.phone}{x.is_repeat ? " · repeat" : ""}</span>
                    <LeadStageChip stage={x.stage} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <section className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Lister</p>
            <div className="mt-2 flex items-center gap-2">
              <p className="font-semibold">{l.full_name}</p>
              <RoleChip role={l.role} />
            </div>
            {l.company_name && <p className="text-sm text-ink-soft">{l.company_name}</p>}
            {l.agent_rera_no && <p className="text-sm text-muted">Agent RERA: {l.agent_rera_no}</p>}
            <p className="text-sm text-muted">Member since {formatDate(l.created_at)}</p>
            <a href={`tel:+91${l.phone}`} className="btn btn-outline btn-sm mt-4 w-full"><Phone className="h-4 w-4" /> Call +91 {l.phone}</a>
          </section>

          {p.status === "unverified" ? (
            <section className="card p-5">
              <h2 className="mb-4 font-semibold">Your decision</h2>
              <ReviewForm projectId={p.id} needsRera={p.construction_status === "under_construction"} />
            </section>
          ) : (
            <section className="card p-5 text-sm text-muted">This listing is not waiting for review.</section>
          )}

          {reviews.length > 0 && (
            <section className="card p-5">
              <h2 className="text-sm font-semibold">Review history</h2>
              <ul className="mt-3 space-y-3 text-sm">
                {reviews.map((r) => (
                  <li key={r.id}>
                    <p><strong className={r.decision === "verified" ? "text-brand-green" : "text-clay"}>{r.decision === "verified" ? "Approved" : "Sent back"}</strong> by {r.reviewer}</p>
                    {r.reason && <p className="text-ink-soft">“{r.reason}”</p>}
                    <p className="text-xs text-muted">{formatDateTime(r.created_at)}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
