import Link from "next/link";

/** Oval badge — a house held between two hands, as in the supplied logo. */
export function LogoMark({ className = "h-11 w-auto", line = "currentColor", accent = "#E5A913" }: { className?: string; line?: string; accent?: string }) {
  return (
    <svg viewBox="0 0 120 180" className={className} aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="60" cy="90" rx="55" ry="85" stroke={line} strokeWidth="3" />
      <ellipse cx="60" cy="90" rx="48" ry="77" stroke={line} strokeWidth="1.6" strokeDasharray="0 5" />
      <ellipse cx="60" cy="90" rx="43" ry="72" stroke={line} strokeWidth="1.6" />
      {/* side ticks */}
      <path d="M5 84v12M115 84v12" stroke={accent} strokeWidth="3" />
      <path d="M17 80h-8M17 100h-8M103 80h8M103 100h8" stroke={line} strokeWidth="1.4" />
      {/* upper hand */}
      <path d="M52 18h16v14H52z" stroke={line} strokeWidth="2" />
      <path d="M53 32c-1 14-12 22-14 34-1 8 3 13 9 16" stroke={line} strokeWidth="2" />
      <path d="M67 32c0 10 6 16 10 24" stroke={line} strokeWidth="2" />
      <path d="M77 56c3 6 4 12 0 17" stroke={line} strokeWidth="2" />
      {/* lower hand (mirrored) */}
      <g transform="rotate(180 60 90)">
        <path d="M52 18h16v14H52z" stroke={line} strokeWidth="2" />
        <path d="M53 32c-1 14-12 22-14 34-1 8 3 13 9 16" stroke={line} strokeWidth="2" />
        <path d="M67 32c0 10 6 16 10 24" stroke={line} strokeWidth="2" />
        <path d="M77 56c3 6 4 12 0 17" stroke={line} strokeWidth="2" />
      </g>
      {/* house */}
      <path d="M44 84 60 70l16 14" stroke={accent} strokeWidth="3" />
      <path d="M48 82v20h24V82" stroke={accent} strokeWidth="2.6" />
      <rect x="53" y="90" width="6" height="12" fill={accent} />
      <rect x="63" y="88" width="5" height="5" fill={accent} />
      {/* growth vines */}
      <g stroke={accent} strokeWidth="1.6">
        <path d="M30 60c6 4 8 10 6 16" />
        <path d="M90 120c-6-4-8-10-6-16" />
        <path d="M86 46c4 6 4 12 0 16" />
        <path d="M34 134c-4-6-4-12 0-16" />
      </g>
      <g fill={accent}>
        <circle cx="30" cy="60" r="2.4" />
        <circle cx="90" cy="120" r="2.4" />
        <circle cx="86" cy="46" r="2.4" />
        <circle cx="34" cy="134" r="2.4" />
        <path d="m64 40 3 6h-6zM56 140l-3-6h6zM70 116l3 6h-6zM50 64l-3-6h6z" />
      </g>
    </svg>
  );
}

export function Logo({ tone = "dark", compact = false }: { tone?: "dark" | "light"; compact?: boolean }) {
  const light = tone === "light";
  return (
    <Link href="/" className="group inline-flex items-center gap-3" aria-label="Real Growth — home">
      <span
        className={`grid h-12 w-10 shrink-0 place-items-center rounded-[50%] transition-transform duration-500 group-hover:-rotate-6 ${
          light ? "bg-white/5" : "bg-brand-green"
        }`}
      >
        <LogoMark className="h-11 w-auto" line={light ? "#FFDFA0" : "#ffffff"} />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className={`font-display text-[1.05rem] font-semibold tracking-[0.24em] ${light ? "text-brand-cream" : "text-brand-green"}`}>
            REAL GROWTH
          </span>
          <span className={`mt-1 flex items-center gap-1.5 text-[0.6rem] font-semibold tracking-[0.3em] ${light ? "text-white/70" : "text-muted"}`}>
            <span className="h-px w-3 bg-brand-gold" />
            REAL ESTATE AGENT
          </span>
        </span>
      )}
    </Link>
  );
}
