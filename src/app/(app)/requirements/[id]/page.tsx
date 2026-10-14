import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Handshake, MapPin, Pause, Pencil, Play, SearchX, Trash2, Wallet } from "lucide-react";
import { deleteRequirementAction, toggleRequirementAction } from "@/actions/requirements";
import { RespondButtons } from "@/components/requirement/contact-buttons";
import { MatchBadge, MatchBreakdown } from "@/components/requirement/match-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ListerBadge, VerifiedBadge } from "@/components/ui/chips";
import { FormAlert } from "@/components/ui/field";
import { requireBuyer } from "@/lib/auth";
import { formatPrice, timeAgo } from "@/lib/format";
import { describeRequirement, MATCH_THRESHOLD } from "@/lib/matching";
import { getRequirementDetail } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Matching properties" };

export default async function RequirementPage({ params, searchParams }: PageProps<"/requirements/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const user = await requireBuyer(`/requirements/${id}`);
  const detail = await getRequirementDetail(user.id, id);
  if (!detail) notFound();
  const { requirement: r, matches, contacts, ref } = detail;
  const d = describeRequirement(r, { areas: ref.allAreas, propertyTypes: ref.propertyTypes });
  const pending = contacts.filter((c) => c.status === "pending");

  return (
    <>
      <Link href="/requirements" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> My requirements
      </Link>
      {sp.saved === "new" && (
        <div className="mb-6"><FormAlert tone="success">Requirement posted. Here&apos;s how the live properties match. We&apos;ll notify you when a new one comes up.</FormAlert></div>
      )}
      {sp.saved === "updated" && <div className="mb-6"><FormAlert tone="success">Changes saved. Matches are updated.</FormAlert></div>}
      {!r.is_active && (
        <div className="mb-6"><FormAlert tone="info">This requirement is paused. Listers can&apos;t see it and you won&apos;t get new-match alerts.</FormAlert></div>
      )}

      <section className="card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Your requirement</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{d.title}</h1>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand-gold" /> {d.areas}</span>
              <span className="flex items-center gap-1.5"><Wallet className="h-4 w-4 text-brand-gold" /> {d.budget}</span>
              {r.min_carpet_sqft && <span>{r.min_carpet_sqft.toLocaleString("en-IN")}+ sq ft</span>}
              {d.categories && <span>{d.categories}</span>}
            </p>
            {r.note && <p className="mt-2 text-sm text-muted">“{r.note}”</p>}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href={`/requirements/${r.id}/edit`} className="btn btn-outline btn-sm"><Pencil className="h-3.5 w-3.5" /> Edit</Link>
            <form action={toggleRequirementAction}>
              <input type="hidden" name="id" value={r.id} />
              <button className="btn btn-ghost btn-sm">{r.is_active ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Resume</>}</button>
            </form>
            <form action={deleteRequirementAction}>
              <input type="hidden" name="id" value={r.id} />
              <button className="btn btn-ghost btn-sm text-clay"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
            </form>
          </div>
        </div>
      </section>

      {contacts.length > 0 && (
        <section id="requests" className="mt-8 scroll-mt-28">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Handshake className="h-5 w-5 text-brand-green" strokeWidth={1.8} /> Listers who want to connect
            {pending.length > 0 && <span className="chip bg-clay text-white">{pending.length} waiting</span>}
          </h2>
          <p className="text-sm text-muted">They can&apos;t see your name or number unless you choose to share it.</p>
          <ul className="mt-4 space-y-3">
            {contacts.map((c) => (
              <li key={c.id} className={`card flex flex-col gap-4 p-4 sm:flex-row sm:items-center ${c.status === "pending" ? "ring-2 ring-brand-gold/40" : ""}`}>
                <Link href={`/projects/${c.project.slug}`} className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-sand sm:w-32">
                  {c.project.cover && <Image src={c.project.cover} alt="" fill sizes="128px" className="object-cover" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <MatchBadge percent={c.match_percent} />
                    <ListerBadge role={c.project.lister.role} />
                    <span className="text-xs text-muted">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm">
                    <strong>{c.project.lister.company_name ?? c.project.lister.full_name}</strong> thinks{" "}
                    <Link href={`/projects/${c.project.slug}`} className="font-semibold text-brand-green hover:underline">{c.project.title}</Link> suits you.
                  </p>
                  <p className="text-xs text-muted">{c.project.area.name} · {formatPrice(c.project.price, c.project.purpose)}{c.project.purpose === "rent" ? "/mo" : ""}</p>
                </div>
                <div className="shrink-0">
                  {c.status === "pending" ? (
                    <RespondButtons contactId={c.id} />
                  ) : c.status === "accepted" ? (
                    <span className="chip bg-brand-green-50 text-brand-green">Number shared</span>
                  ) : (
                    <span className="chip bg-line-soft text-muted">Declined</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          {matches.length} matching {matches.length === 1 ? "property" : "properties"}
        </h2>
        <p className="text-sm text-muted">Best match first. Only properties matching {MATCH_THRESHOLD}% or more are shown.</p>
        <div className="mt-4">
          {matches.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No close matches yet"
              body="Nothing live matches well enough right now. We'll notify you as soon as a matching property is verified. Adding nearby areas or a little more budget can help."
              action={<Link href={`/requirements/${r.id}/edit`} className="btn btn-outline">Adjust requirement</Link>}
            />
          ) : (
            <ul className="space-y-4">
              {matches.map(({ project: p, match }) => (
                <li key={p.id} className="card flex flex-col gap-4 p-4 sm:flex-row">
                  <Link href={`/projects/${p.slug}`} className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-sand sm:w-48">
                    {p.cover && <Image src={p.cover} alt="" fill sizes="(min-width: 640px) 192px, 100vw" className="object-cover" />}
                    <span className="absolute left-2 top-2"><VerifiedBadge /></span>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/projects/${p.slug}`} className="block truncate text-lg font-semibold hover:text-brand-green">{p.title}</Link>
                        <p className="flex items-center gap-1.5 text-sm text-muted">
                          <MapPin className="h-3.5 w-3.5 text-brand-gold" /> {p.area.name} · {p.type.name}
                          {p.configuration !== "Not applicable" ? ` · ${p.configuration}` : ""}
                        </p>
                        <p className="mt-0.5 font-semibold text-brand-green">{formatPrice(p.price, p.purpose)}{p.purpose === "rent" ? "/mo" : ""}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-display text-3xl font-semibold leading-none text-brand-green">{match.percent}%</p>
                        <p className="text-xs text-muted">match</p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line-soft" aria-hidden>
                      <div className="h-full rounded-full bg-brand-green" style={{ width: `${match.percent}%` }} />
                    </div>
                    <div className="mt-3">
                      <MatchBreakdown parts={match.parts} />
                    </div>
                    <Link href={`/projects/${p.slug}`} className="btn btn-outline btn-sm mt-4">View and enquire</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
