import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, FileCheck2, HeartHandshake, Route, UserRoundCheck } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { Ornament } from "@/components/ui/decor";
import { AREA_ZONES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About us",
  description:
    "RealGrowth is your trusted real estate partner — helping you buy, sell or rent homes, commercial spaces and plots with the right guidance.",
};

const REASONS = [
  { icon: UserRoundCheck, t: "Personalized Property Consultation", d: "Recommendations based on your needs, preferences, and budget." },
  { icon: Building2, t: "Residential & Commercial Properties", d: "Homes, flats, villas, plots, offices, shops, and warehouses." },
  {
    icon: FileCheck2,
    t: "Property Verification Guidance",
    d: "Assistance with reviewing relevant property documents and legal compliance, with verification by qualified professionals where required.",
  },
  { icon: Route, t: "End-to-End Support", d: "Guidance throughout your property search, negotiations, and transaction process." },
  { icon: HeartHandshake, t: "Customer-First Approach", d: "Transparent communication and informed decision-making at every step." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="RealGrowth – Your Trusted Real Estate Partner" title="Find the Right Property." accent="Make the Right Move.">
        At RealGrowth, we believe that finding the right property is more than just a transaction — it’s about making the right decision for
        your future.
      </PageHero>

      <section className="container-page max-w-3xl space-y-5 py-16 text-lg leading-relaxed text-ink-soft">
        <p>
          Whether you’re looking to buy, sell, or rent a home, flat, commercial space, warehouse, villa, or plot, we help you navigate the
          real estate market with the right guidance, suitable property options, and a customer-first approach.
        </p>
        <p>
          Our goal is to simplify your property journey by understanding your requirements, budget, and long-term objectives. We guide you in
          exploring suitable properties, evaluating your options, and checking relevant legal documentation and compliance requirements
          before you make a decision.
        </p>
        <p>
          From finding your dream home to identifying the right commercial space or a promising property investment, RealGrowth is here to
          help you move forward with greater clarity and confidence.
        </p>
      </section>

      <section className="container-page pb-16">
        <p className="eyebrow">Why choose us</p>
        <h2 className="mt-2 text-3xl font-semibold">
          Why choose <span className="accent-serif text-brand-green">RealGrowth?</span>
        </h2>
        <Ornament className="mt-4" />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((v) => (
            <div key={v.t} className="card p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-green-50 text-brand-green">
                <v.icon className="h-6 w-6" strokeWidth={1.5} />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{v.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{v.d}</p>
            </div>
          ))}
        </div>
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
        </div>
      </section>

      <section className="container-page py-16 text-center">
        <p className="eyebrow">Explore. Evaluate. Invest. Grow with RealGrowth.</p>
        <h2 className="mt-2 text-3xl font-semibold">
          Your property journey <span className="accent-serif text-brand-green">starts here!</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-ink-soft">
          Whether you are a first-time homebuyer, a property owner looking to sell or rent, or an investor exploring new opportunities,
          RealGrowth is ready to assist you. Let’s find the right property for you.
        </p>
        <p className="mt-2 text-sm text-muted">Connect with us today for personalized real estate consultation.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="btn btn-primary">
            Connect with us <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/projects" className="btn btn-outline">
            Browse properties
          </Link>
        </div>
      </section>
    </>
  );
}
