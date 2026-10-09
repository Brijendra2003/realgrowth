import Link from "next/link";
import { ChevronRight, MessageCircle, Phone } from "lucide-react";
import { LeadStageChip, PriorityBadge, RepeatBadge } from "@/components/ui/chips";
import { formatPrice, initials, timeAgo } from "@/lib/format";
import type { BuyerGroup } from "@/lib/queries";

/** One card per buyer — groups repeat enquiries across a lister's projects (Architecture §3.4). */
export function BuyerGroupCard({ g, extra }: { g: BuyerGroup; extra?: React.ReactNode }) {
  return (
    <article className={`card overflow-hidden ${g.priority === "high" ? "ring-2 ring-clay/30" : ""}`}>
      <div className="flex flex-wrap items-center gap-3 border-b border-line-soft p-4">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-sm font-bold ${g.isRepeat ? "bg-clay text-white" : "bg-brand-green-50 text-brand-green"}`}>
          {initials(g.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{g.name}</p>
            {g.isRepeat && <RepeatBadge count={g.leads.length} />}
            {g.priority === "high" && <PriorityBadge />}
          </div>
          <p className="text-xs text-muted">
            +91 {g.phone} · last enquiry {timeAgo(g.lastAt)}
            {extra}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`tel:+91${g.phone}`} className="btn btn-outline btn-sm" aria-label={`Call ${g.name}`}>
            <Phone className="h-4 w-4" strokeWidth={1.8} /> <span className="hidden sm:inline">Call</span>
          </a>
          <a href={`https://wa.me/91${g.phone}`} target="_blank" rel="noreferrer" className="btn btn-sm bg-[#25D366] text-white hover:bg-[#1fb257]" aria-label={`WhatsApp ${g.name}`}>
            <MessageCircle className="h-4 w-4" strokeWidth={1.8} /> <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </div>
      <ul className="divide-y divide-line-soft">
        {g.leads.map((l) => (
          <li key={l.id}>
            <Link href={`/leads/${l.id}`} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-canvas">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium group-hover:text-brand-green">{l.project.title}</p>
                <p className="truncate text-xs text-muted">
                  {l.project.area} · {formatPrice(l.project.price, l.project.purpose)} · {timeAgo(l.created_at)}
                  {l.message ? ` · “${l.message}”` : ""}
                </p>
              </div>
              <LeadStageChip stage={l.stage} />
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}
