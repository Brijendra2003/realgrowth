import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, ClipboardCheck, Inbox, Repeat, Users } from "lucide-react";
import { ActivityList } from "@/components/admin/activity-list";
import { DailyBars, HBarList } from "@/components/admin/charts";
import { FormAlert } from "@/components/ui/field";
import { PageTitle, StatTile } from "@/components/ui/page-title";
import { requireStaff } from "@/lib/auth";
import { LEAD_STAGE_LABELS, ROLE_LABELS } from "@/lib/constants";
import { getAdminOverview } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Admin overview", robots: { index: false } };

export default async function AdminOverviewPage({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const user = await requireStaff();
  const d = await getAdminOverview();

  return (
    <>
      {sp.notice === "no-access" && <div className="mb-6"><FormAlert tone="info">That page is for super admins only.</FormAlert></div>}
      <PageTitle
        eyebrow="Overview"
        title={<>Good day, <span className="accent-serif text-brand-green">{user.full_name.split(" ")[0]}.</span></>}
        description="Everything happening on Real Growth, in one place."
        action={
          <Link href="/admin/verification" className="btn btn-primary">
            Review queue ({d.stats.queue}) <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Waiting for review" value={d.stats.queue} icon={ClipboardCheck} tone={d.stats.queue ? "gold" : "green"} hint="Oldest first" />
        <StatTile label="Live listings" value={d.stats.live} icon={Building2} />
        <StatTile label="Users" value={d.stats.users} icon={Users} tone="ink" hint="Buyers & listers" />
        <StatTile label="Leads" value={d.stats.leads} icon={Inbox} tone="gold" hint={`${d.stats.openLeads} open`} />
        <StatTile label="Repeat enquirers" value={d.stats.repeat} icon={Repeat} tone="clay" hint="2+ projects, same lister" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DailyBars title="New listings per day" total={d.days.reduce((s, x) => s + x.listings, 0)} data={d.days.map((x) => ({ date: x.date, value: x.listings }))} />
        <DailyBars title="New leads per day" total={d.days.reduce((s, x) => s + x.leads, 0)} data={d.days.map((x) => ({ date: x.date, value: x.leads }))} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <HBarList title="Leads by stage" rows={d.funnel.map((f) => ({ label: LEAD_STAGE_LABELS[f.stage], value: f.count }))} />
        <HBarList title="Leads per project (top 6)" rows={d.leadsPerProject.map((p) => ({ label: p.title, value: p.leads, sub: `· ${p.views} views` }))} />
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent activity</h2>
            <Link href="/admin/activity" className="text-xs font-semibold text-brand-green hover:underline">All activity</Link>
          </div>
          <ActivityList entries={d.recent.slice(0, 6)} compact />
        </section>
      </div>

      <section className="card mt-6 overflow-x-auto">
        <div className="px-5 pt-5">
          <h2 className="text-sm font-semibold">Lead-to-close conversion per lister</h2>
        </div>
        <table className="table-clean mt-3 min-w-[40rem]">
          <thead>
            <tr><th>Lister</th><th>Type</th><th className="text-right">Projects</th><th className="text-right">Leads</th><th className="text-right">Won</th><th className="text-right">Conversion</th></tr>
          </thead>
          <tbody>
            {d.listers.map((l) => (
              <tr key={l.id}>
                <td className="font-medium">{l.name}</td>
                <td className="text-muted">{ROLE_LABELS[l.role]}</td>
                <td className="text-right">{l.projects}</td>
                <td className="text-right">{l.leads}</td>
                <td className="text-right">{l.won}</td>
                <td className="text-right font-semibold text-brand-green">{l.conversion}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
