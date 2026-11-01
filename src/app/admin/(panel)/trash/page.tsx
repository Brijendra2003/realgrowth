import type { Metadata } from "next";
import Link from "next/link";
import { after } from "next/server";
import { Trash2 } from "lucide-react";
import { daysLeft, ProjectActions } from "@/components/admin/project-actions";
import { AutoSubmitGet } from "@/components/ui/auto-submit-get";
import { ListerBadge, ProjectStatusChip } from "@/components/ui/chips";
import { PageTitle } from "@/components/ui/page-title";
import { requireStaff } from "@/lib/auth";
import { TRASH_DAYS } from "@/lib/constants";
import { formatPrice, timeAgo } from "@/lib/format";
import { getAllProjects } from "@/lib/queries";
import { purgeTrashedProjects } from "@/lib/trash";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Trash" };

export default async function TrashPage({ searchParams }: PageProps<"/admin/trash">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  await requireStaff();
  // Backup for the daily cron: clear out anything past its 30 days once the page is sent.
  after(() => purgeTrashedProjects().catch((err) => console.error("[trash] purge failed", err)));
  // Soonest to be deleted first.
  const items = (await getAllProjects({ status: "trashed", q })).sort((a, b) => (a.trashed_at ?? "").localeCompare(b.trashed_at ?? ""));
  return (
    <>
      <PageTitle
        eyebrow="System"
        title="Trash"
        description={`Hidden from buyers and listers. Each listing is deleted for good — with its photos and leads — ${TRASH_DAYS} days after it was trashed. Restore puts it back the way it was.`}
      />
      <AutoSubmitGet action="/admin/trash" className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input name="q" defaultValue={q} placeholder="Search title, code, lister or area…" className="input sm:max-w-sm" />
        <button className="btn btn-outline">Search</button>
      </AutoSubmitGet>
      <div className="card overflow-x-auto">
        <table className="table-clean min-w-[60rem]">
          <thead>
            <tr><th>Project</th><th>Lister</th><th>Area</th><th className="text-right">Price</th><th>Was</th><th>Trashed</th><th>Deleted in</th><th className="text-right">Actions</th></tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="py-14 text-center">
                  <Trash2 className="mx-auto h-8 w-8 text-line" strokeWidth={1.4} />
                  <p className="mt-2 text-sm text-muted">{q ? "Nothing in the trash matches this search." : "The trash is empty."}</p>
                </td>
              </tr>
            )}
            {items.map((p) => {
              const left = daysLeft(p.trashed_at);
              return (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/verification/${p.id}`} className="font-medium hover:text-brand-green">{p.title}</Link>
                    <p className="text-xs text-muted">{p.code}</p>
                  </td>
                  <td><p className="text-sm">{p.lister.company_name ?? p.lister.full_name}</p><ListerBadge role={p.lister.role} /></td>
                  <td className="text-muted">{p.area.name}</td>
                  <td className="text-right font-medium">{formatPrice(p.price, p.purpose)}</td>
                  <td>{p.status_before_trash ? <ProjectStatusChip status={p.status_before_trash} /> : <span className="text-muted">—</span>}</td>
                  <td className="text-xs text-muted">{p.trashed_at ? timeAgo(p.trashed_at) : "—"}</td>
                  <td>
                    <span className={`text-sm font-medium ${left <= 7 ? "text-danger" : "text-ink-soft"}`}>
                      {left === 0 ? "Today" : `${left} ${left === 1 ? "day" : "days"}`}
                    </span>
                  </td>
                  <td><ProjectActions id={p.id} status={p.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
