import { Check, Minus, X } from "lucide-react";
import { matchTone, type MatchPart } from "@/lib/matching";

const TONE = {
  high: "bg-brand-green text-white",
  good: "bg-brand-green-50 text-brand-green ring-1 ring-brand-green/20",
  fair: "bg-brand-gold-50 text-[#8a6100] ring-1 ring-brand-gold/30",
};

export function MatchBadge({ percent, size = "sm" }: { percent: number; size?: "sm" | "md" }) {
  return (
    <span className={`chip font-semibold ${TONE[matchTone(percent)]} ${size === "md" ? "px-3 py-1 text-sm" : ""}`}>
      {percent}% match
    </span>
  );
}

/** One line per scoring rule: full, partial or no credit. */
export function MatchBreakdown({ parts }: { parts: MatchPart[] }) {
  return (
    <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
      {parts.map((p) => {
        const full = p.score >= p.max;
        const none = p.score === 0;
        const Icon = full ? Check : none ? X : Minus;
        return (
          <li key={p.key} className="flex items-start gap-1.5">
            <Icon
              className={`mt-px h-3.5 w-3.5 shrink-0 ${full ? "text-brand-green" : none ? "text-clay" : "text-[#8a6100]"}`}
              strokeWidth={2.4}
              aria-label={full ? "Matches" : none ? "Doesn't match" : "Partly matches"}
            />
            <span className="text-ink-soft">
              <span className="font-medium text-ink">{p.label}:</span> {p.detail}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
