import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Lock, MapPin, MessageCircle, Phone, UsersRound, Wallet } from "lucide-react";
import { RequestContactButton } from "@/components/requirement/contact-buttons";
import { MatchBadge, MatchBreakdown } from "@/components/requirement/match-badge";
import { AutoSubmitGet } from "@/components/ui/auto-submit-get";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/page-title";
import { requireLister } from "@/lib/auth";
import { formatPrice, timeAgo } from "@/lib/format";
import { describeRequirement, MATCH_THRESHOLD } from "@/lib/matching";
import { getListerMatches } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Matching buyers" };

export default async function MatchingBuyersPage({ searchParams }: PageProps<"/matching-buyers">) {
  const sp = await searchParams;
  const only = typeof sp.project === "string" ? sp.project : undefined;
  const user = await requireLister("/matching-buyers");
  const { projects, ref, total } = await getListerMatches(user.id);
  const shown = projects.filter((p) => (!only || p.project.id === only) && (only || p.buyers.length > 0));

  return (
    <>
      <PageTitle
        eyebrow="Matching buyers"
        title="Buyers looking for what you have"
        description={`${total} ${total === 1 ? "buyer" : "buyers"} with a requirement matching your live properties ${MATCH_THRESHOLD}% or more. Their details stay private until they accept your request.`}
      />

      {projects.length > 1 && (
        <AutoSubmitGet action="/matching-buyers" className="mb-6">
          <select name="project" defaultValue={only ?? ""} className="input sm:max-w-sm" aria-label="Property">
            <option value="">All properties with matches</option>
            {projects.map((p) => (
              <option key={p.project.id} value={p.project.id}>{p.project.title} ({p.buyers.length})</option>
            ))}
          </select>
        </AutoSubmitGet>
      )}

      {projects.length === 0 ? (
        <EmptyState icon={UsersRound} title="No live properties yet" body="Once a property of yours is verified, buyers whose requirement matches it show up here." action={<Link href="/my-projects" className="btn btn-primary">My properties</Link>} />
      ) : shown.length === 0 || shown.every((p) => p.buyers.length === 0) ? (
        <EmptyState icon={UsersRound} title="No matching buyers yet" body="We'll notify you when a buyer posts a requirement that matches one of your properties." />
      ) : (
        <div className="space-y-10">
          {shown.map(({ project: p, buyers }) => (
            <section key={p.id}>
              <div className="flex items-center gap-3">
                <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-sand">
                  {p.cover && <Image src={p.cover} alt="" fill sizes="64px" className="object-cover" />}
                </span>
                <div className="min-w-0">
                  <Link href={`/projects/${p.slug}`} className="block truncate font-semibold hover:text-brand-green">{p.title}</Link>
                  <p className="text-xs text-muted">
                    {p.area.name} · {formatPrice(p.price, p.purpose)}{p.purpose === "rent" ? "/mo" : ""} · {buyers.length} matching {buyers.length === 1 ? "buyer" : "buyers"}
                  </p>
                </div>
              </div>
              {buyers.length === 0 ? (
                <p className="mt-3 rounded-xl border border-dashed border-line p-4 text-sm text-muted">No matching buyers for this property yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {buyers.map(({ requirement: r, match, contact, buyer }) => {
                    const d = describeRequirement(r, { areas: ref.allAreas, propertyTypes: ref.propertyTypes });
                    return (
                      <li key={r.id} className="card p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <MatchBadge percent={match.percent} size="md" />
                              <span className="text-xs text-muted">posted {timeAgo(r.created_at)}</span>
                            </div>
                            <p className="mt-2 font-semibold">
                              {buyer ? buyer.name : <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-muted" /> Buyer</span>} · {d.title}
                            </p>
                            <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-brand-gold" /> {d.areas}</span>
                              <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-brand-gold" /> {d.budget}</span>
                            </p>
                            {r.note && <p className="mt-1 text-sm text-ink-soft">“{r.note}”</p>}
                            <div className="mt-3">
                              <MatchBreakdown parts={match.parts} />
                            </div>
                          </div>
                          <div className="shrink-0 sm:text-right">
                            {buyer ? (
                              <div className="flex flex-wrap gap-2 sm:justify-end">
                                <a href={`tel:+91${buyer.phone}`} className="btn btn-primary btn-sm"><Phone className="h-4 w-4" /> +91 {buyer.phone}</a>
                                <a href={`https://wa.me/91${buyer.phone}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                                {contact?.lead_id && <Link href={`/leads/${contact.lead_id}`} className="btn btn-ghost btn-sm">Open lead</Link>}
                              </div>
                            ) : contact?.status === "pending" ? (
                              <span className="chip bg-brand-gold-50 text-[#8a6100]">Request sent, waiting for buyer</span>
                            ) : contact?.status === "declined" ? (
                              <span className="chip bg-line-soft text-muted">Buyer declined</span>
                            ) : (
                              <RequestContactButton requirementId={r.id} projectId={p.id} />
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
