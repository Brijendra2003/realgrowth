import type { Metadata } from "next";
import { ActivityList } from "@/components/admin/activity-list";
import { AutoSubmitGet } from "@/components/ui/auto-submit-get";
import { PageTitle } from "@/components/ui/page-title";
import { requireStaff } from "@/lib/auth";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/constants";
import { getActivity } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  const sp = await searchParams;
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const f = { role: s("role"), action: s("action"), q: s("q"), range: s("range") };
  await requireStaff();
  const { entries, total, actions } = await getActivity(f);

  return (
    <>
      <PageTitle eyebrow="Oversight" title="Activity feed" description={`Every sign-up, listing, edit, verification, enquiry and lead change · ${total} events`} />
      <AutoSubmitGet action="/admin/activity" className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input name="q" defaultValue={f.q} placeholder="Search person or detail…" className="input lg:col-span-2" />
        <select name="role" defaultValue={f.role ?? ""} className="input">
          <option value="">All roles</option>
          {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <select name="action" defaultValue={f.action ?? ""} className="input">
          <option value="">All actions</option>
          {actions.map((a) => <option key={a} value={a}>{a[0]!.toUpperCase() + a.slice(1)}</option>)}
        </select>
        <select name="range" defaultValue={f.range ?? ""} className="input">
          <option value="">Any date</option>
          <option value="1">Last 24 hours</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </AutoSubmitGet>
      <section className="card px-5 py-2">
        {entries.length === 0 ? <p className="py-10 text-center text-sm text-muted">No activity matches.</p> : <ActivityList entries={entries} />}
      </section>
    </>
  );
}
