import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { MatchBadge } from "@/components/requirement/match-badge";
import { AutoSubmitGet } from "@/components/ui/auto-submit-get";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/page-title";
import { requireStaff } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { describeRequirement, MATCH_THRESHOLD } from "@/lib/matching";
import { getAllRequirements } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Buyer requirements" };

export default async function AdminRequirementsPage({ searchParams }: PageProps<"/admin/requirements">) {
  const sp = await searchParams;
  const f = { status: typeof sp.status === "string" ? sp.status : undefined, q: typeof sp.q === "string" ? sp.q : undefined };
  await requireStaff();
  const { items, ref } = await getAllRequirements(f);

  return (
    <>
      <PageTitle
        eyebrow="Moderation"
        title="Buyer requirements"
        description={`What registered buyers are looking for, with how many live listings match ${MATCH_THRESHOLD}% or more.`}
      />
      <AutoSubmitGet action="/admin/requirements" className="mb-5 flex flex-col gap-3 sm:flex-row">
        <input name="q" defaultValue={f.q} placeholder="Search buyer name, phone or note…" className="input sm:max-w-xs" />
        <select name="status" defaultValue={f.status ?? ""} className="input sm:max-w-[12rem]">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
      </AutoSubmitGet>

      {items.length === 0 ? (
        f.q || f.status ? (
          <EmptyState icon={ClipboardList} title="No requirements match" body="Try clearing the filters." action={<Link href="/admin/requirements" className="btn btn-outline">Clear filters</Link>} />
        ) : (
          <EmptyState icon={ClipboardList} title="No requirements yet" body="Requirements posted by buyers show up here." />
        )
      ) : (
        <div className="space-y-4">
          {items.map((r) => {
            const d = describeRequirement(r, { areas: ref.allAreas, propertyTypes: ref.propertyTypes });
            return (
              <article key={r.id} className="card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{r.buyer.full_name}</p>
                      {r.buyer.phone && <span className="text-xs text-muted">+91 {r.buyer.phone}</span>}
                      {!r.is_active && <span className="chip bg-line-soft text-muted">Paused</span>}
                      <span className="text-xs text-muted">{timeAgo(r.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm">{d.title} · {d.areas} · {d.budget}</p>
                    {r.note && <p className="mt-0.5 text-xs text-muted">“{r.note}”</p>}
                  </div>
                  <div className="shrink-0 text-sm sm:text-right">
                    <p><strong className="text-brand-green">{r.matchCount}</strong> matching listings</p>
                    <p className="text-xs text-muted">{r.contactsSent} contact requests · {r.contactsAccepted} accepted</p>
                  </div>
                </div>
                {r.top.length > 0 && (
                  <ul className="mt-3 divide-y divide-line-soft rounded-xl border border-line-soft">
                    {r.top.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        <Link href={`/admin/verification/${t.id}`} className="truncate hover:text-brand-green">{t.title}</Link>
                        <MatchBadge percent={t.percent} />
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
