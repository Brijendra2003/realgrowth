import type { Metadata } from "next";
import Link from "next/link";
import { AutoSubmitGet } from "@/components/ui/auto-submit-get";
import { ListerBadge, ProjectStatusChip } from "@/components/ui/chips";
import { PageTitle } from "@/components/ui/page-title";
import { requireStaff } from "@/lib/auth";
import { PROJECT_STATUS_LABELS, PROJECT_STATUSES } from "@/lib/constants";
import { formatPrice, timeAgo } from "@/lib/format";
import { getAllProjects } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "All projects" };

export default async function AdminProjectsPage({ searchParams }: PageProps<"/admin/projects">) {
  const sp = await searchParams;
  const f = { status: typeof sp.status === "string" ? sp.status : undefined, q: typeof sp.q === "string" ? sp.q : undefined };
  await requireStaff();
  const items = await getAllProjects(f);
  return (
    <>
      <PageTitle eyebrow="Moderation" title="All projects" description={`${items.length} listings`} />
      <AutoSubmitGet action="/admin/projects" className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input name="q" defaultValue={f.q} placeholder="Search title, code, lister or area…" className="input sm:max-w-sm" />
        <select name="status" defaultValue={f.status ?? ""} className="input sm:max-w-[14rem]">
          <option value="">All statuses</option>
          {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>)}
        </select>
        <button className="btn btn-outline">Search</button>
      </AutoSubmitGet>
      <div className="card overflow-x-auto">
        <table className="table-clean min-w-[56rem]">
          <thead>
            <tr><th>Project</th><th>Lister</th><th>Area</th><th className="text-right">Price</th><th className="text-right">Leads</th><th>Status</th><th>Updated</th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/verification/${p.id}`} className="font-medium hover:text-brand-green">{p.title}</Link>
                  <p className="text-xs text-muted">{p.code}</p>
                </td>
                <td><p className="text-sm">{p.lister.company_name ?? p.lister.full_name}</p><ListerBadge role={p.lister.role} /></td>
                <td className="text-muted">{p.area.name}</td>
                <td className="text-right font-medium">{formatPrice(p.price, p.purpose)}</td>
                <td className="text-right">{p.leadCount}</td>
                <td><ProjectStatusChip status={p.status} /></td>
                <td className="text-xs text-muted">{timeAgo(p.updated_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
