import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { AutoSubmitGet } from "@/components/ui/auto-submit-get";
import { BuyerGroupCard } from "@/components/lead/buyer-group-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/page-title";
import { requireLister } from "@/lib/auth";
import { LEAD_STAGE_LABELS, LEAD_STAGES } from "@/lib/constants";
import { getListerLeads } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Leads" };

const PIPE = ["new", "contacted", "site_visit_scheduled", "site_visit_done", "negotiation", "closed_won"] as const;

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const sp = await searchParams;
  const f = {
    project: typeof sp.project === "string" ? sp.project : undefined,
    stage: typeof sp.stage === "string" ? sp.stage : undefined,
    range: typeof sp.range === "string" ? sp.range : undefined,
  };
  const user = await requireLister("/leads");
  const { groups, projects, counts, total } = await getListerLeads(user.id, f);
  const max = Math.max(1, ...PIPE.map((s) => counts[s]));

  return (
    <>
      <PageTitle eyebrow="Leads inbox" title="Your buyers" description={`${total} enquiries across ${projects.length} properties. Buyers who enquired on 2+ of your properties are grouped and shown first.`} />

      {/* Pipeline */}
      <div className="card mb-6 grid grid-cols-3 gap-px overflow-hidden bg-line sm:grid-cols-6">
        {PIPE.map((s) => (
          <Link key={s} href={`/leads?stage=${s}`} className={`bg-paper p-4 transition hover:bg-canvas ${f.stage === s ? "!bg-brand-green-50" : ""}`}>
            <p className="font-display text-2xl font-semibold">{counts[s]}</p>
            <p className="truncate text-xs text-muted">{LEAD_STAGE_LABELS[s]}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line-soft">
              <div className="h-full rounded-full bg-brand-green" style={{ width: `${(counts[s] / max) * 100}%` }} />
            </div>
          </Link>
        ))}
      </div>

      <AutoSubmitGet action="/leads" className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="sr-only">Property</span>
          <select name="project" defaultValue={f.project ?? ""} className="input">
            <option value="">All properties</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Stage</span>
          <select name="stage" defaultValue={f.stage ?? ""} className="input">
            <option value="">All stages</option>
            <option value="open">Open leads only</option>
            {LEAD_STAGES.map((s) => (
              <option key={s} value={s}>{LEAD_STAGE_LABELS[s]}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Date</span>
          <select name="range" defaultValue={f.range ?? ""} className="input">
            <option value="">Any time</option>
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </label>
      </AutoSubmitGet>

      {groups.length === 0 ? (
        <EmptyState icon={Inbox} title="No leads match" body="Try clearing the filters." action={<Link href="/leads" className="btn btn-outline">Clear filters</Link>} />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <BuyerGroupCard key={g.buyer_id} g={g} />
          ))}
        </div>
      )}
    </>
  );
}
