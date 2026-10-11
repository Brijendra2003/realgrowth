import Link from "next/link";
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { LeafSprig, Ornament } from "@/components/ui/decor";
import { SITE } from "@/lib/constants";
import { CurrentYear } from "./current-year";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "/projects?purpose=sale", label: "Buy property" },
      { href: "/projects?purpose=rent", label: "Rent property" },
      { href: "/projects?category=new_project", label: "New projects" },
      { href: "/projects?category=ready_to_move", label: "Ready to move" },
      { href: "/projects?segment=commercial", label: "Commercial spaces" },
    ],
  },
  {
    title: "Popular areas",
    links: [
      { href: "/projects?area=mira-road-east", label: "Mira Road East" },
      { href: "/projects?area=bhayandar-west", label: "Bhayandar West" },
      { href: "/projects?area=vasai-road-west", label: "Vasai Road West" },
      { href: "/projects?area=virar-west", label: "Virar West" },
      { href: "/projects?area=palghar-west", label: "Palghar West" },
    ],
  },
  {
    title: "For partners",
    links: [
      { href: "/list-project", label: "List your property" },
      { href: "/signup?role=developer", label: "Developers" },
      { href: "/signup?role=broker", label: "Brokers & channel partners" },
      { href: "/signup?role=owner", label: "Property owners" },
      { href: "/admin/login", label: "Team sign-in" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Real Growth" },
      { href: "/contact", label: "Contact us" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of use" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto">
      {/* CTA band */}
      <section className="relative overflow-hidden bg-sage">
        <LeafSprig className="absolute -left-4 bottom-0 hidden h-48 text-brand-green/40 md:block" />
        <LeafSprig className="absolute right-6 top-2 hidden h-40 -scale-x-100 text-brand-green/30 md:block" />
        <div className="container-page relative grid grid-cols-1 items-center gap-8 py-14 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div>
            <p className="eyebrow">Own a property on the Western line?</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight sm:text-[2.6rem]">
              Have a home to sell <span className="accent-serif text-brand-green">or rent out?</span>
            </h2>
            <p className="mt-3 max-w-lg text-ink-soft">
              List it free in about five minutes. Our team checks it, puts it live, and every enquiry comes straight to your phone — no call centre in between.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:justify-end">
            <Link href="/list-project" className="btn btn-primary btn-lg">
              List your property <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </Link>
            <a href={`https://wa.me/${SITE.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-lg bg-paper/60">
              <MessageCircle className="h-4 w-4" strokeWidth={1.8} /> Talk to us
            </a>
          </div>
        </div>
      </section>

      <div className="relative overflow-hidden bg-brand-green-900 text-brand-cream/80">
        <LogoMark className="pointer-events-none absolute -right-16 -top-10 h-[26rem] w-auto opacity-[0.05]" sizes="416px" />
        <div className="container-page relative grid grid-cols-1 gap-10 py-14 lg:grid-cols-[minmax(0,1.3fr)_repeat(4,minmax(0,1fr))]">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark className="h-14 w-auto" sizes="112px" />
              <div>
                <p className="font-display text-lg font-semibold tracking-[0.24em] text-brand-cream">REAL GROWTH</p>
                <p className="text-[0.62rem] font-semibold tracking-[0.3em] text-white/60">REAL ESTATE AGENT</p>
              </div>
            </div>
            <Ornament className="mt-4" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed">
              Verified homes, shops and offices from Mira Road to Dahanu Road. One corridor, done properly.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" strokeWidth={1.5} /> {SITE.address}
              </li>
              <li>
                <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="flex items-center gap-2.5 hover:text-white">
                  <Phone className="h-4 w-4 text-brand-gold" strokeWidth={1.5} /> {SITE.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="flex items-center gap-2.5 hover:text-white">
                  <Mail className="h-4 w-4 text-brand-gold" strokeWidth={1.5} /> {SITE.email}
                </a>
              </li>
            </ul>
          </div>
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold">{c.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="link-underline hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="border-t border-white/10">
          <div className="container-page flex flex-col gap-2 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © <CurrentYear /> Real Growth. All rights reserved.
            </p>
            <p>Under-construction projects are listed only with a valid MahaRERA registration · maharera.maharashtra.gov.in</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
