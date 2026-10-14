import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BellRing, ClipboardList, MapPin, Pause, Pencil, Play, Plus, Wallet } from "lucide-react";
import { toggleRequirementAction } from "@/actions/requirements";
import { MatchBadge } from "@/components/requirement/match-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { FormAlert } from "@/components/ui/field";
import { PageTitle } from "@/components/ui/page-title";
import { requireBuyer } from "@/lib/auth";
import { MAX_REQUIREMENTS } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { describeRequirement, MATCH_THRESHOLD } from "@/lib/matching";
import { getBuyerRequirements, getReferenceData } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "My requirements" };

export default async function RequirementsPage({ searchParams }: PageProps<"/requirements">) {
  const sp = await searchParams;
  const user = await requireBuyer("/requirements");
  const [items, ref] = await Promise.all([getBuyerRequirements(user.id), getReferenceData()]);
  const canAdd = items.length < MAX_REQUIREMENTS;

  return (
    <>
      {sp.deleted && <div className="mb-6"><FormAlert tone="success">Requirement deleted.</FormAlert></div>}
      <PageTitle
        eyebrow="My requirements"
        title="What you're looking for"
        description={`Matches of ${MATCH_THRESHOLD}% or more are shown. You can keep up to ${MAX_REQUIREMENTS} requirements.`}
        action={canAdd ? <Link href="/requirements/new" className="btn btn-primary"><Plus className="h-4 w-4" /> Post a requirement</Link> : undefined}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No requirements yet"
          body="Tell us the area, budget and size you want. We'll show how well every verified property matches, and tell you when a new one comes up."
          action={<Link href="/requirements/new" className="btn btn-primary">Post a requirement</Link>}
        />
      ) : (
        <ul className="space-y-4">
          {items.map((r) => {
            const d = describeRequirement(r, { areas: ref.allAreas, propertyTypes: ref.propertyTypes });
            return (
              <li key={r.id} className={`card p-5 ${r.is_active ? "" : "opacity-75"}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.is_active ? (
                        <span className="chip bg-brand-green-50 text-brand-green"><span className="h-1.5 w-1.5 rounded-full bg-current" /> Active</span>
                      ) : (
                        <span className="chip bg-line-soft text-muted">Paused</span>
                      )}
                      {r.pendingContacts > 0 && (
                        <span className="chip bg-clay text-white"><BellRing className="h-3 w-3" strokeWidth={2.2} /> {r.pendingContacts} {r.pendingContacts === 1 ? "lister wants" : "listers want"} to connect</span>
                      )}
                      <span className="text-xs text-muted">posted {timeAgo(r.created_at)}</span>
                    </div>
                    <Link href={`/requirements/${r.id}`} className="mt-1.5 block text-lg font-semibold hover:text-brand-green">{d.title}</Link>
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                      <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-brand-gold" /> {d.areas}</span>
                      <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-brand-gold" /> {d.budget}</span>
                    </p>
                  </div>
                  <div className="shrink-0 sm:text-right">
                    <p className="font-display text-3xl font-semibold text-brand-green">{r.matchCount}</p>
                    <p className="text-xs text-muted">{r.matchCount === 1 ? "matching property" : "matching properties"}</p>
                    {r.best > 0 && <div className="mt-1.5"><MatchBadge percent={r.best} /></div>}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line-soft pt-4">
                  <Link href={`/requirements/${r.id}`} className="btn btn-primary btn-sm">See matches <ArrowRight className="h-4 w-4" /></Link>
                  <Link href={`/requirements/${r.id}/edit`} className="btn btn-outline btn-sm"><Pencil className="h-3.5 w-3.5" /> Edit</Link>
                  <form action={toggleRequirementAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="btn btn-ghost btn-sm">
                      {r.is_active ? <><Pause className="h-3.5 w-3.5" /> Pause</> : <><Play className="h-3.5 w-3.5" /> Resume</>}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
