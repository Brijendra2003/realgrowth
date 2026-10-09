import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, Compass, HeartHandshake, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Ornament } from "@/components/ui/decor";
import { AREA_ZONES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About us",
  description: "Real Growth is a verified property portal for the Mira Road to Dahanu Road corridor.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About Real Growth" title="A smaller portal," accent="on purpose.">
        We list property only along the Western line from Mira Road to Dahanu Road, and we check every listing before it goes live. Fewer
        listings, more trust.
      </PageHero>

      <section className="container-page grid grid-cols-1 gap-6 py-16 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Compass, t: "Focused", d: "One corridor, 39 areas. We know the stations, the societies and the builders." },
          { icon: ClipboardCheck, t: "Verified", d: "Our operations team reviews every listing and calls every lister." },
          { icon: ShieldCheck, t: "MahaRERA first", d: "Under-construction projects need a valid MahaRERA number — no exceptions." },
          { icon: HeartHandshake, t: "Direct", d: "Enquiries go to the person who listed the property, not a call centre." },
        ].map((v) => (
          <div key={v.t} className="card p-6">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-green-50 text-brand-green">
              <v.icon className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <h2 className="mt-4 text-lg font-semibold">{v.t}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{v.d}</p>
          </div>
        ))}
      </section>

      <section className="bg-paper py-16">
        <div className="container-page">
          <p className="eyebrow">Where we work</p>
          <h2 className="mt-2 text-3xl font-semibold">
            Mira Road <span className="accent-serif text-brand-green">to</span> Dahanu Road
          </h2>
          <Ornament className="mt-4" />
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {AREA_ZONES.map((z) => (
              <div key={z.zone} className="rounded-2xl border border-line bg-canvas p-6">
                <h3 className="font-semibold text-brand-green">{z.zone}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{z.areas.join(" · ")}</p>
              </div>
            ))}
          </div>
          <Link href="/projects" className="btn btn-primary mt-10">
            Browse verified properties <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
