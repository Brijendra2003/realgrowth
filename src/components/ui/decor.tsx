import type { ReactNode } from "react";

/** Hand-drawn leaf sprig, echoing the botanical accents in the design references. */
export function LeafSprig({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 80 160" className={className} aria-hidden="true" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round">
      <path d="M40 158C38 120 42 80 52 6" />
      {[
        [44, 132, -1], [45, 112, 1], [46, 92, -1], [48, 72, 1], [50, 52, -1], [51, 34, 1], [52, 18, -1],
      ].map(([x, y, dir], i) => (
        <path
          key={i}
          d={`M${x} ${y}c${dir * 10} -2 ${dir * 20} -10 ${dir * 24} -22c${dir * -12} 0 ${dir * -22} 8 ${dir * -24} 22z`}
          fill={color}
          fillOpacity={0.14}
        />
      ))}
    </svg>
  );
}

export function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" />
    </svg>
  );
}

/** Small ornamental divider like the one under the wordmark. */
export function Ornament({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 text-brand-gold ${className}`} aria-hidden="true">
      <span className="h-px w-10 bg-current opacity-70" />
      <svg viewBox="0 0 20 20" className="h-3 w-3" fill="currentColor">
        <path d="M10 0l2.5 7.5L20 10l-7.5 2.5L10 20l-2.5-7.5L0 10l7.5-2.5z" />
      </svg>
      <span className="h-px w-10 bg-current opacity-70" />
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  align = "left",
  action,
}: {
  eyebrow?: string;
  title: ReactNode;
  accent?: string;
  description?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  const center = align === "center";
  return (
    <div className={`flex flex-col gap-4 ${center ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}>
      <div className={center ? "max-w-2xl" : "max-w-2xl"}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="mt-2 text-3xl font-semibold leading-[1.1] sm:text-4xl">
          {title} {accent && <span className="accent-serif text-brand-green">{accent}</span>}
        </h2>
        {description && <p className="mt-3 text-[0.975rem] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  );
}
