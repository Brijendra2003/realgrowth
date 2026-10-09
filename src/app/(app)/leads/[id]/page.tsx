import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Check, MessageCircle, MessageSquareText, Phone, PhoneCall, Repeat, StickyNote, Sparkles } from "lucide-react";
import { logCallAction, setFollowupAction } from "@/actions/leads";
import { LeadStageForm } from "@/components/lead/lead-stage-form";
import { LeadStageChip, PriorityBadge, RepeatBadge } from "@/components/ui/chips";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireLister } from "@/lib/auth";
import { LEAD_STAGE_LABELS, OPEN_STAGES, type LeadStage } from "@/lib/constants";
import { formatDateTime, formatPrice, initials, toDatetimeLocal } from "@/lib/format";
import { getLeadDetail } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Lead" };

const STEPS: LeadStage[] = ["new", "contacted", "site_visit_scheduled", "site_visit_done", "negotiation", "closed_won"];
const ICON = { created: Sparkles, stage_change: Check, note: StickyNote, call: PhoneCall, site_visit: CalendarClock, followup: CalendarClock };

export default async function LeadPage({ params }: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const user = await requireLister(`/leads/${id}`);
  const data = await getLeadDetail(id, user);
  if (!data) notFound();
  const { lead, activities, related } = data;
  const isRepeat = related.length > 0;
  const stepIndex = STEPS.indexOf(lead.stage);

  return (
    <>
      <Link href="/leads" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Leads inbox
      </Link>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-full font-display text-xl font-bold ${isRepeat ? "bg-clay text-white" : "bg-brand-green text-brand-cream"}`}>
            {initials(lead.name)}
          </span>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">{lead.name}</h1>
              <LeadStageChip stage={lead.stage} />
              {isRepeat && <RepeatBadge count={related.length + 1} />}
              {isRepeat && OPEN_STAGES.includes(lead.stage) && <PriorityBadge />}
            </div>
            <p className="mt-1 text-sm text-muted">
              +91 {lead.phone}{lead.email ? ` · ${lead.email}` : ""} · enquired {formatDateTime(lead.created_at)}
            </p>
          </div>
          <div className="flex gap-2">
            <a href={`tel:+91${lead.phone}`} className="btn btn-primary"><Phone className="h-4 w-4" /> Call</a>
            <a href={`https://wa.me/91${lead.phone}?text=${encodeURIComponent(`Hello ${lead.name}, this is regarding your enquiry for ${lead.project.title} on Real Growth.`)}`} target="_blank" rel="noreferrer" className="btn bg-[#25D366] text-white hover:bg-[#1fb257]">
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </div>

        {/* Stage stepper */}
        <div className="no-scrollbar overflow-x-auto border-t border-line-soft bg-canvas/60 px-6 py-5">
          {lead.stage === "closed_lost" ? (
            <p className="text-sm font-medium text-muted">Lost{lead.lost_reason ? ` — ${lead.lost_reason}` : ""}</p>
          ) : (
            <ol className="flex min-w-[40rem] items-center">
              {STEPS.map((s, i) => (
                <li key={s} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1.5">
                    <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${i <= stepIndex ? "bg-brand-green text-white" : "border-2 border-line bg-paper text-muted"}`}>
                      {i < stepIndex ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className={`whitespace-nowrap text-[0.7rem] font-medium ${i <= stepIndex ? "text-ink" : "text-muted"}`}>{LEAD_STAGE_LABELS[s]}</span>
                  </div>
                  {i < STEPS.length - 1 && <span className={`mx-2 mb-5 h-0.5 flex-1 rounded ${i < stepIndex ? "bg-brand-green" : "bg-line"}`} />}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Link href={`/projects/${lead.project.slug}`} className="card flex items-center gap-4 p-4 hover:shadow-lift">
            <span className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-sand">
              {lead.project.cover && <Image src={lead.project.cover} alt="" fill sizes="96px" className="object-cover" />}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted">Enquired about · {lead.project.code}</p>
              <p className="truncate font-semibold">{lead.project.title}</p>
              <p className="text-sm text-muted">{lead.project.area} · {formatPrice(lead.project.price, lead.project.purpose)}</p>
            </div>
          </Link>

          {lead.message && (
            <div className="rounded-2xl border border-line bg-paper p-5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted"><MessageSquareText className="h-4 w-4" /> Buyer&apos;s message</p>
              <p className="mt-2 text-ink-soft">“{lead.message}”</p>
            </div>
          )}

          {isRepeat && (
            <section className="rounded-2xl border border-clay/25 bg-clay-50/60 p-5">
              <h2 className="flex items-center gap-2 font-semibold text-clay"><Repeat className="h-4 w-4" /> Also interested in {related.length} more of your properties</h2>
              <ul className="mt-3 space-y-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link href={`/leads/${r.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-paper px-4 py-3 text-sm hover:shadow-card">
                      <span className="truncate font-medium">{r.project.title}</span>
                      <LeadStageChip stage={r.stage} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-6">
            <h2 className="text-lg font-semibold">Timeline</h2>
            <ol className="relative mt-5 space-y-5 border-l-2 border-line-soft pl-6">
              {activities.map((a) => {
                const Icon = ICON[a.type];
                return (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[2.15rem] grid h-7 w-7 place-items-center rounded-full border-2 border-paper bg-brand-green-50 text-brand-green">
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <p className="text-sm font-medium">
                      {a.type === "created" && "Enquiry received"}
                      {a.type === "stage_change" && <>Moved to {LEAD_STAGE_LABELS[a.to_stage!]}</>}
                      {a.type === "note" && "Note"}
                      {a.type === "call" && "Call logged"}
                      {a.type === "site_visit" && "Site visit"}
                      {a.type === "followup" && "Follow-up"}
                    </p>
                    {a.note && <p className="mt-0.5 text-sm text-ink-soft">{a.note}</p>}
                    <p className="mt-0.5 text-xs text-muted">{a.actor} · {formatDateTime(a.created_at)}</p>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Update this lead</h2>
            <LeadStageForm leadId={lead.id} stage={lead.stage} siteVisitAt={toDatetimeLocal(lead.site_visit_at)} />
          </section>
          <section className="card p-6">
            <h2 className="text-lg font-semibold">Next follow-up</h2>
            <p className="mt-1 text-sm text-muted">{lead.next_followup_at ? formatDateTime(lead.next_followup_at) : "Not set"}</p>
            <form action={setFollowupAction} className="mt-4 flex gap-2">
              <input type="hidden" name="lead_id" value={lead.id} />
              <input type="datetime-local" name="next_followup_at" className="input flex-1" defaultValue={toDatetimeLocal(lead.next_followup_at)} aria-label="Follow-up date and time" />
              <SubmitButton className="btn btn-outline" pendingText="…">Set</SubmitButton>
            </form>
            <form action={logCallAction} className="mt-3">
              <input type="hidden" name="lead_id" value={lead.id} />
              <SubmitButton className="btn btn-ghost btn-sm w-full" pendingText="Logging…"><PhoneCall className="h-4 w-4" /> Log a call</SubmitButton>
            </form>
          </section>
        </aside>
      </div>
    </>
  );
}
