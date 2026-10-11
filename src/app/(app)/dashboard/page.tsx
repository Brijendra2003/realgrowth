import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarClock,
  Eye,
  Heart,
  Inbox,
  MessageSquareText,
  Plus,
  Repeat,
  Search,
  Trophy,
} from "lucide-react";
import { BuyerGroupCard } from "@/components/lead/buyer-group-card";
import { EmptyState } from "@/components/ui/empty-state";
import { LeadStageChip, ProjectStatusChip } from "@/components/ui/chips";
import { FormAlert } from "@/components/ui/field";
import { PageTitle, StatTile } from "@/components/ui/page-title";
import { requireUser } from "@/lib/auth";
import { isLister } from "@/lib/constants";
import { formatDateTime, formatPrice, timeAgo } from "@/lib/format";
import { getBuyerEnquiries, getListerDashboard, getSavedProjects } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const sp = await searchParams;
  const user = await requireUser("/dashboard");
  const first = user.full_name.split(" ")[0];

  const notices = (
    <>
      {sp.welcome && <div className="mb-6"><FormAlert tone="success">Welcome to Real Growth, {first}! Your account is ready.</FormAlert></div>}
      {sp.notice === "lister-only" && (
        <div className="mb-6"><FormAlert tone="info">Listing properties is for owners, developers and brokers. Your account is set up for buying or renting.</FormAlert></div>
      )}
    </>
  );

  if (!isLister(user.role)) {
    const [enquiries, saved] = await Promise.all([getBuyerEnquiries(user.id), getSavedProjects(user.id)]);
    return (
      <>
        {notices}
        <PageTitle
          eyebrow="Dashboard"
          title={<>Hello, <span className="accent-serif text-brand-green">{first}.</span></>}
          description="Track your enquiries and the homes you've saved."
          action={<Link href="/projects" className="btn btn-primary"><Search className="h-4 w-4" /> Browse properties</Link>}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Enquiries sent" value={enquiries.length} icon={MessageSquareText} />
          <StatTile label="Lister replied" value={enquiries.filter((e) => e.lead.stage !== "new").length} icon={Inbox} tone="gold" />
          <StatTile label="Saved homes" value={saved.length} icon={Heart} tone="clay" />
        </div>
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent enquiries</h2>
            <Link href="/my-enquiries" className="text-sm font-semibold text-brand-green hover:underline">See all</Link>
          </div>
          <div className="mt-4">
            {enquiries.length === 0 ? (
              <EmptyState icon={MessageSquareText} title="No enquiries yet" body="Found something you like? Send an enquiry and the lister will call you." action={<Link href="/projects" className="btn btn-primary">Find a home</Link>} />
            ) : (
              <ul className="card divide-y divide-line-soft">
                {enquiries.slice(0, 5).map(({ lead, project }) => (
                  <li key={lead.id}>
                    <Link href={`/projects/${project.slug}`} className="flex items-center gap-4 p-4 hover:bg-canvas">
                      <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-sand">
                        {project.cover && <Image src={project.cover} alt="" fill sizes="80px" className="object-cover" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{project.title}</p>
                        <p className="text-xs text-muted">{project.area.name} · {formatPrice(project.price, project.purpose)} · {timeAgo(lead.created_at)}</p>
                      </div>
                      <LeadStageChip stage={lead.stage} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </>
    );
  }

  const d = await getListerDashboard(user.id);
  return (
    <>
      {notices}
      <PageTitle
        eyebrow="Dashboard"
        title={<>Good to see you, <span className="accent-serif text-brand-green">{first}.</span></>}
        description="Here's how your properties and leads are doing."
        action={<Link href="/list-project" className="btn btn-primary"><Plus className="h-4 w-4" /> Add a property</Link>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Live properties" value={d.stats.live} icon={Building2} hint={d.stats.review ? `${d.stats.review} under review` : "All checked"} />
        <StatTile label="New leads" value={d.stats.newLeads} icon={Inbox} tone="gold" hint={`${d.stats.totalLeads} leads in total`} />
        <StatTile label="Repeat buyers" value={d.stats.repeatBuyers} icon={Repeat} tone="clay" hint="Enquired on 2+ of your properties" />
        <StatTile label="Deals won" value={d.stats.won} icon={Trophy} tone="ink" hint={<><Eye className="inline h-3 w-3" /> {d.stats.views.toLocaleString("en-IN")} listing views</>} />
      </div>

      {d.attention.length > 0 && (
        <section className="mt-8 space-y-3">
          {d.attention.map((p) => (
            <div key={p.id} className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center ${p.status === "rejected" ? "border-clay/25 bg-clay-50" : "border-brand-gold/30 bg-brand-gold-50/70"}`}>
              <AlertCircle className={`h-5 w-5 shrink-0 ${p.status === "rejected" ? "text-clay" : "text-[#8a6100]"}`} strokeWidth={1.8} />
              <div className="flex-1 text-sm">
                <p className="font-semibold">
                  {p.title} <ProjectStatusChip status={p.status} />
                </p>
                <p className="text-ink-soft">
                  {p.status === "rejected" ? `Our team asked for changes: ${p.rejection_reason}` : "Under review by our team. We usually finish within one working day."}
                </p>
              </div>
              {p.status === "rejected" && <Link href={`/my-projects/${p.id}/edit`} className="btn btn-primary btn-sm">Fix and resubmit</Link>}
            </div>
          ))}
        </section>
      )}

      <div className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Latest buyers</h2>
            <Link href="/leads" className="flex items-center gap-1 text-sm font-semibold text-brand-green hover:underline">
              Open leads inbox <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 space-y-4">
            {d.recentGroups.length === 0 ? (
              <EmptyState icon={Inbox} title="No leads yet" body="Once your property is live, buyer enquiries show up here." />
            ) : (
              d.recentGroups.slice(0, 3).map((g) => <BuyerGroupCard key={g.key} g={g} />)
            )}
          </div>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Coming up</h2>
          <div className="card mt-4 p-2">
            {d.upcoming.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">No site visits or follow-ups scheduled.</p>
            ) : (
              <ul>
                {d.upcoming.map((u) => (
                  <li key={u.id}>
                    <Link href={`/leads/${u.id}`} className="flex gap-3 rounded-xl p-3 hover:bg-canvas">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${u.kind === "Site visit" ? "bg-[#efe9fb] text-[#5b4a99]" : "bg-brand-gold-50 text-[#8a6100]"}`}>
                        <CalendarClock className="h-5 w-5" strokeWidth={1.6} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{u.kind} · {formatDateTime(u.when)}</p>
                        <p className="truncate text-xs text-muted">{u.name} — {u.project.title}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
