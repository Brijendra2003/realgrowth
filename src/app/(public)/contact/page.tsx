import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHero } from "@/components/layout/page-hero";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = { title: "Contact us", description: "Talk to the Real Growth team." };

export default function ContactPage() {
  const items = [
    { icon: Phone, t: "Call us", v: SITE.phone, href: `tel:${SITE.phone.replace(/\s/g, "")}` },
    { icon: MessageCircle, t: "WhatsApp", v: "Chat with our team", href: `https://wa.me/${SITE.whatsapp}` },
    { icon: Mail, t: "Email", v: SITE.email, href: `mailto:${SITE.email}` },
    { icon: MapPin, t: "Visit", v: SITE.address, href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.address)}` },
  ];
  return (
    <>
      <PageHero eyebrow="Contact" title="We're a call" accent="away.">
        Questions about a listing, verification or your account? Our team answers in plain language — in English, Hindi or Marathi.
      </PageHero>
      <section className="container-page grid grid-cols-1 gap-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <a key={i.t} href={i.href} target={i.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="card group p-6 transition hover:-translate-y-1 hover:shadow-lift">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gold-50 text-[#8a6100] transition group-hover:bg-brand-green group-hover:text-white">
              <i.icon className="h-6 w-6" strokeWidth={1.5} />
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">{i.t}</p>
            <p className="mt-1 font-semibold">{i.v}</p>
          </a>
        ))}
      </section>
      <p className="container-page -mt-8 flex items-center gap-2 pb-16 text-sm text-muted">
        <Clock className="h-4 w-4" strokeWidth={1.5} /> Monday to Saturday, 10 am – 7 pm
      </p>
    </>
  );
}
