import type { ReactNode } from "react";
import { LeafSprig } from "@/components/ui/decor";

export function PageHero({ eyebrow, title, accent, children }: { eyebrow: string; title: string; accent?: string; children?: ReactNode }) {
  return (
    <section className="grain relative overflow-hidden border-b border-line bg-sand/60">
      <LeafSprig className="absolute -right-2 top-4 h-48 rotate-12 text-brand-green/25" />
      <div className="container-page relative py-16 sm:py-20">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] sm:text-5xl">
          {title} {accent && <span className="accent-serif text-brand-green">{accent}</span>}
        </h1>
        {children && <div className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{children}</div>}
      </div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-14 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_li]:mt-1.5 [&_p]:mt-4 [&_p]:leading-relaxed [&_p]:text-ink-soft [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:text-ink-soft">
      {children}
    </div>
  );
}
