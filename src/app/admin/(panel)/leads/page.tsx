import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { AutoSubmitGet } from "@/components/ui/auto-submit-get";
import { EmptyState } from "@/components/ui/empty-state";
import { LeadStageChip, PriorityBadge, RepeatBadge } from "@/components/ui/chips";
import { PageTitle } from "@/components/ui/page-title";
import { requireStaff } from "@/lib/auth";
import { LEAD_STAGE_LABELS, LEAD_STAGES } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { getAllLeadGroups } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "All leads" };

export default async function AdminLeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  const sp = await searchParams;
  const f = { stage: typeof sp.stage === "string" ? sp.stage : undefined, repeat: typeof sp.repeat === "string" ? sp.repeat : undefined };
  await requireStaff();
  const groups = await getAllLeadGroups(f);
  return (
    <>
      <PageTitle eyebrow="Moderation" title="All leads" description="Grouped by buyer and lister. Repeat enquirers are flagged." />
      <AutoSubmitGet action="/admin/leads" className="mb-5 flex flex-col gap-3 sm:flex-row">
        <select name="stage" defaultValue={f.stage ?? ""} className="input sm:max-w-[14rem]">
          <option value="">All stages</option>
          <option value="open">Open only</option>
          {LEAD_STAGES.map((s) => <option key={s} value={s}>{LEAD_STAGE_LABELS[s]}</option>)}
        </select>
        <select name="repeat" defaultValue={f.repeat ?? ""} className="input sm:max-w-[14rem]">
          <option value="">All buyers</option>
          <option value="1">Repeat enquirers only</option>
        </select>
      </AutoSubmitGet>
      {groups.length === 0 ? (
        <EmptyState icon={Inbox} title="No leads match" />
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <article key={`${g.lister.id}-${g.buyer_id}`} className={`card p-4 ${g.priority === "high" ? "ring-2 ring-clay/30" : ""}`}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{g.name}</p>
                <span className="text-xs text-muted">+91 {g.phone}</span>
                <span className="text-xs text-muted">→ {g.lister.company_name ?? g.lister.full_name}</span>
                {g.isRepeat && <RepeatBadge count={g.leads.length} />}
                {g.priority === "high" && <PriorityBadge />}
              </div>
              <ul className="mt-3 divide-y divide-line-soft rounded-xl border border-line-soft">
                {g.leads.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                    <Link href={`/admin/verification/${l.project_id}`} className="truncate hover:text-brand-green">{l.project.title}</Link>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-muted">{timeAgo(l.created_at)}</span>
                      <LeadStageChip stage={l.stage} />
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
