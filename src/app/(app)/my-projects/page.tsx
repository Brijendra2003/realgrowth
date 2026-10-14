import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Building2, Eye, Inbox, MapPin, Pencil, Plus, UsersRound } from "lucide-react";
import { setProjectStatusAction } from "@/actions/projects";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectStatusChip } from "@/components/ui/chips";
import { FormAlert } from "@/components/ui/field";
import { PageTitle } from "@/components/ui/page-title";
import { requireLister } from "@/lib/auth";
import { formatPrice, timeAgo } from "@/lib/format";
import { getListerProjects } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "My properties" };

export default async function MyProjectsPage({ searchParams }: PageProps<"/my-projects">) {
  const sp = await searchParams;
  const user = await requireLister("/my-projects");
  const projects = await getListerProjects(user.id);

  return (
    <>
      {sp.saved === "review" && (
        <div className="mb-6"><FormAlert tone="success">Thanks! Your property is with our team for a quick check. We&apos;ll notify you as soon as it&apos;s live.</FormAlert></div>
      )}
      {sp.saved === "live" && <div className="mb-6"><FormAlert tone="success">Changes saved and live.</FormAlert></div>}
      <PageTitle
        eyebrow="My properties"
        title="Your listings"
        description={`${projects.length} ${projects.length === 1 ? "property" : "properties"}`}
        action={<Link href="/list-project" className="btn btn-primary"><Plus className="h-4 w-4" /> Add a property</Link>}
      />

      {projects.length === 0 ? (
        <EmptyState icon={Building2} title="You haven't listed anything yet" body="Add your first property — it takes about five minutes." action={<Link href="/list-project" className="btn btn-primary">Add a property</Link>} />
      ) : (
        <ul className="space-y-4">
          {projects.map((p) => (
            <li key={p.id} className="card flex flex-col gap-4 p-4 sm:flex-row">
              <Link href={`/projects/${p.slug}`} className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-sand sm:w-44">
                {p.cover && <Image src={p.cover} alt="" fill sizes="180px" className="object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-center gap-2">
                  <ProjectStatusChip status={p.status} />
                  <span className="text-xs text-muted">{p.code} · updated {timeAgo(p.updated_at)}</span>
                </div>
                <Link href={`/projects/${p.slug}`} className="mt-1.5 truncate text-lg font-semibold hover:text-brand-green">{p.title}</Link>
                <p className="flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="h-3.5 w-3.5 text-brand-gold" /> {p.area.name} · {p.configuration !== "Not applicable" ? `${p.configuration} · ` : ""}
                  <span className="font-semibold text-brand-green">{formatPrice(p.price, p.purpose)}{p.purpose === "rent" ? "/mo" : ""}</span>
                </p>
                {p.status === "rejected" && p.rejection_reason && (
                  <p className="mt-2 rounded-lg bg-clay-50 px-3 py-2 text-sm text-clay">Needs changes: {p.rejection_reason}</p>
                )}
                {p.status === "unverified" && <p className="mt-2 text-sm text-[#8a6100]">Under review by our team.</p>}
                <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 text-sm">
                  <span className="flex items-center gap-1.5 text-muted"><Eye className="h-4 w-4" /> {p.views_count} views</span>
                  <Link href={`/leads?project=${p.id}`} className="flex items-center gap-1.5 font-medium text-brand-green hover:underline">
                    <Inbox className="h-4 w-4" /> {p.leadCount} leads{p.openLeads ? ` (${p.openLeads} open)` : ""}
                  </Link>
                  {p.matchingBuyers > 0 && (
                    <Link href={`/matching-buyers?project=${p.id}`} className="flex items-center gap-1.5 font-medium text-brand-green hover:underline">
                      <UsersRound className="h-4 w-4" /> {p.matchingBuyers} matching {p.matchingBuyers === 1 ? "buyer" : "buyers"}
                    </Link>
                  )}
                  <div className="ml-auto flex flex-wrap gap-2">
                    {p.status !== "sold" && p.status !== "withdrawn" && (
                      <>
                        <Link href={`/my-projects/${p.id}/edit`} className="btn btn-outline btn-sm"><Pencil className="h-3.5 w-3.5" /> {p.status === "rejected" ? "Fix & resubmit" : "Edit"}</Link>
                        {p.status === "verified" && (
                          <form action={setProjectStatusAction}>
                            <input type="hidden" name="project_id" value={p.id} />
                            <button name="status" value="sold" className="btn btn-ghost btn-sm">Mark sold</button>
                          </form>
                        )}
                        <form action={setProjectStatusAction}>
                          <input type="hidden" name="project_id" value={p.id} />
                          <button name="status" value="withdrawn" className="btn btn-ghost btn-sm text-muted">Withdraw</button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
