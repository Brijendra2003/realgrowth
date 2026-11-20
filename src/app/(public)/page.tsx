import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Building,
  Building2,
  Check,
  ClipboardCheck,
  Handshake,
  Heart,
  Home as HomeIcon,
  KeyRound,
  LandPlot,
  LayoutGrid,
  MessageSquareText,
  Phone,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { HeroSearch } from "@/components/project/hero-search";
import { ProjectCard } from "@/components/project/project-card";
import { LeafSprig, Ornament, SectionHeading } from "@/components/ui/decor";
import { EmptyState } from "@/components/ui/empty-state";
import { getSessionUser } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { slugify } from "@/lib/format";
import { getHomeStats, getNewestProjects, getSavedProjects } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

const HERO_IMG = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2400&q=80&auto=format&fit=crop";

const PROMISES = [
  "Verified listings",
  "Direct to owner",
  "MahaRERA checked",
  "Local to the Western line",
  "Free to list",
  "Mira Road → Dahanu Road",
];

const RAIL = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/projects", label: "All listings", icon: LayoutGrid },
  { href: "/projects?purpose=rent", label: "Rent", icon: KeyRound },
  { href: "/projects?category=new_project", label: "New projects", icon: Sparkles },
  { href: "/projects?segment=commercial", label: "Commercial", icon: Building },
  { href: "/saved", label: "Saved homes", icon: Heart },
];

const STATIONS = [
  "Mira Road", "Bhayandar", "Naigaon", "Vasai Road", "Nalasopara", "Virar", "Vaitarna",
  "Saphale", "Kelve Road", "Palghar", "Umroli", "Boisar", "Vangaon", "Dahanu Road",
];

export default async function HomePage() {
  const [stats, newest, user] = await Promise.all([getHomeStats(), getNewestProjects(6), getSessionUser()]);
  const savedIds = new Set(user ? (await getSavedProjects(user.id)).map((p) => p.id) : []);

  const categories = [
    { href: "/projects?category=new_project", label: "New projects", body: "Under construction, MahaRERA checked", count: stats.newProjects, icon: Sparkles, tone: "bg-brand-green-50 text-brand-green" },
    { href: "/projects?category=ready_to_move", label: "Ready to move", body: "Move in this month", count: stats.readyToMove, icon: KeyRound, tone: "bg-clay-50 text-clay" },
    { href: "/projects?category=resale", label: "Resale homes", body: "Owner and broker listings", count: stats.resale, icon: HomeIcon, tone: "bg-brand-gold-50 text-[#8a6100]" },
    { href: "/projects?purpose=rent", label: "For rent", body: "Flats, shops and offices", count: stats.rent, icon: Building2, tone: "bg-sage text-brand-green" },
    { href: "/projects?segment=commercial", label: "Commercial", body: "Offices, shops, warehouses", count: stats.commercial, icon: Building, tone: "bg-[#ece8f7] text-[#5b4a99]" },
    { href: "/projects?type=residential-plot", label: "Plots & land", body: "NA plots and orchards", count: undefined, icon: LandPlot, tone: "bg-sand text-ink-soft" },
  ];

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      {/* Quick-browse rail — fixed to the left edge, vertically centred, stays while scrolling.
          Shown from 1440px, where the page container leaves enough margin that it never covers content. */}
      <nav
        aria-label="Quick browse"
        className="glass fixed left-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-1 rounded-full p-1.5 min-[1440px]:flex"
      >
            {RAIL.map((r, i) => (
              <Link
                key={r.label}
                href={r.href}
                aria-label={r.label}
                aria-current={i === 0 ? "page" : undefined}
                className={`group/rail relative grid h-11 w-11 place-items-center rounded-full transition ${
                  i === 0 ? "bg-brand-green-900 text-white" : "text-ink-soft hover:bg-white hover:text-brand-green"
                }`}
              >
                <r.icon className="h-[1.1rem] w-[1.1rem]" strokeWidth={1.7} />
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-full bg-brand-green-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-card transition group-hover/rail:opacity-100 group-focus-visible/rail:opacity-100">
                  {r.label}
                </span>
              </Link>
            ))}
            <span className="my-1.5 h-px w-6 bg-ink/15" aria-hidden="true" />
            <a
              href={`tel:${SITE.phone.replace(/\s/g, "")}`}
              aria-label={`Call us on ${SITE.phone}`}
              className="group/rail relative grid h-11 w-11 place-items-center rounded-full bg-brand-gold text-brand-green-900 transition hover:bg-[#f0b623]"
            >
              <Phone className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.8} />
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-full bg-brand-green-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-card transition group-hover/rail:opacity-100 group-focus-visible/rail:opacity-100">
                Call {SITE.phone}
              </span>
            </a>
          </nav>

      <section className="relative isolate overflow-hidden bg-paper">
        {/* Photo on the right, melting into the paper background on the left so the copy stays on a clean surface */}
        <div className="absolute inset-y-0 right-0 -z-10 w-full lg:w-[64%]" aria-hidden="true">
          <Image src={HERO_IMG} alt="" fill preload sizes="(min-width: 1024px) 64vw, 100vw" className="object-cover object-[60%_center]" />
          <div className="absolute inset-0 bg-[rgb(255_253_248/0.86)] lg:bg-transparent lg:bg-[linear-gradient(90deg,var(--color-paper)_0%,rgb(255_253_248/0.92)_14%,rgb(255_253_248/0.35)_38%,rgb(255_253_248/0)_58%)]" />
          <div className="absolute inset-x-0 top-0 hidden h-24 bg-gradient-to-b from-paper/60 to-transparent lg:block" />
        </div>

        <div className="container-page flex flex-col pb-8 pt-12 sm:pb-10 sm:pt-16 lg:min-h-[clamp(40rem,calc(100svh-6.75rem),54rem)] lg:pb-12 lg:pt-16">
          <div className="flex flex-1 flex-col justify-center">
            <div className="max-w-[36rem] animate-fade-up">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-green/15 bg-brand-green-50 px-3 py-1 text-[0.75rem] font-semibold text-brand-green">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                Verified homes, Mira Road → Dahanu Road
              </p>
              <h1 className="mt-5 text-[2.75rem] font-bold leading-[1.02] tracking-[-0.04em] text-ink sm:text-6xl lg:text-[4.5rem]">
                Homes that
                <br />
                <span className="text-brand-green">grow with you</span>
              </h1>
              <p className="mt-6 max-w-[30rem] text-[1.05rem] leading-relaxed text-ink-soft">
                Flats, villas, shops and offices along the Western line. Every listing is <strong className="font-semibold text-ink">checked by our team</strong>, and
                your enquiry goes <strong className="font-semibold text-ink">straight to the owner</strong>.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/projects" className="btn btn-primary btn-lg">
                  Browse listings <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
                <Link href="/list-project" className="btn btn-outline btn-lg bg-paper/80">
                  <HomeIcon className="h-4 w-4" strokeWidth={1.9} /> List your property
                </Link>
              </div>

              <p className="mt-6 inline-flex items-center gap-2 text-[0.8rem] font-medium text-muted">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-gold opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-gold" />
                </span>
                {stats.liveCount > 0
                  ? `${stats.liveCount} verified ${stats.liveCount === 1 ? "listing" : "listings"} live today`
                  : "Every listing verified before it goes live"}
              </p>
            </div>
          </div>

          <div className="mt-10 animate-fade-up [animation-delay:160ms] lg:mt-12">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* ───────────── Promise strip (full width) ───────────── */}
      <div className="group relative overflow-hidden bg-brand-green-900 py-4 text-brand-cream">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-brand-green-900 to-transparent sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-brand-green-900 to-transparent sm:w-32" />
        <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center">
              {PROMISES.map((t) => (
                <li key={t} className="flex items-center gap-8 pr-8 text-[0.78rem] font-semibold uppercase tracking-[0.24em] whitespace-nowrap">
                  {t}
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-gold" fill="currentColor" aria-hidden="true">
                    <path d="M12 0c.6 6.4 5.6 11.4 12 12-6.4.6-11.4 5.6-12 12-.6-6.4-5.6-11.4-12-12C6.4 11.4 11.4 6.4 12 0z" />
                  </svg>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* ───────────── Categories ───────────── */}
      <section className="border-y border-line bg-paper py-16">
        <div className="container-page">
          <SectionHeading eyebrow="What are you looking for" title="Start with" accent="what matters to you." align="center" />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="group flex flex-col items-center rounded-2xl border border-transparent p-4 text-center transition duration-300 hover:-translate-y-1 hover:border-line hover:bg-canvas hover:shadow-card"
              >
                <span className={`grid h-16 w-16 place-items-center rounded-[44%_56%_52%_48%/52%_44%_56%_48%] transition duration-500 group-hover:rounded-[56%_44%_48%_52%/44%_56%_44%_56%] ${c.tone}`}>
                  <c.icon className="h-7 w-7" strokeWidth={1.5} />
                </span>
                <p className="mt-3 font-display font-semibold">{c.label}</p>
                <p className="mt-0.5 text-xs text-muted">{c.body}</p>
                {!!c.count && <p className="mt-2 text-xs font-semibold text-brand-green">{c.count} live</p>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Newest listings ───────────── */}
      <section className="py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Fresh on Real Growth"
            title="Newest verified"
            accent="properties."
            description={newest.length ? "Approved by our team in the last few days. Newest first." : "Each property appears here as soon as our team has checked it."}
            action={
              newest.length > 0 && (
                <Link href="/projects" className="btn btn-outline shrink-0">
                  View all {stats.liveCount} <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              )
            }
          />
          {newest.length === 0 ? (
            <div className="mt-10">
              <EmptyState
                icon={HomeIcon}
                title="The first listings are being verified"
                body="Have a flat, shop or plot between Mira Road and Dahanu Road? List it free and be among the first homes buyers see."
                action={<Link href="/list-project" className="btn btn-primary">List your property <ArrowRight className="h-4 w-4" strokeWidth={2} /></Link>}
              />
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {newest.map((p, i) => (
                <ProjectCard key={p.id} p={p} saved={user ? savedIds.has(p.id) : undefined} priority={i < 3} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ───────────── Corridor ───────────── */}
      <section className="relative overflow-hidden bg-brand-green py-20 text-brand-cream">
        <LeafSprig className="absolute -left-6 bottom-0 h-64 text-brand-cream/15" />
        <LeafSprig className="absolute -right-4 top-0 h-56 rotate-180 text-brand-cream/15" />
        <div className="container-page relative">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.6fr)] lg:items-end">
            <div>
              <p className="eyebrow !text-brand-gold">Our corridor</p>
              <h2 className="mt-2 text-3xl font-semibold leading-tight text-white sm:text-4xl">
                One line. <span className="accent-serif text-brand-cream">Done properly.</span>
              </h2>
              <p className="mt-4 max-w-md text-brand-cream/80">
                We only list property along the Western line from Mira Road to Dahanu Road — {stats.areaCount} areas we know street by street.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {stats.zones.map((z) => (
                <Link
                  key={z.zone}
                  href={`/projects?zone=${slugify(z.zone)}`}
                  className="group rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition hover:border-brand-gold/50 hover:bg-white/10"
                >
                  <p className="font-display text-3xl font-semibold text-white">{z.count || z.areaNames.length}</p>
                  <p className="text-xs uppercase tracking-wider text-brand-cream/70">
                    {z.count ? (z.count === 1 ? "live listing" : "live listings") : "areas covered"}
                  </p>
                  <p className="mt-3 font-semibold text-brand-gold">{z.zone}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-brand-cream/70">
                    {(z.topAreas.length ? z.topAreas.map((a) => a.name) : z.areaNames.slice(0, 4)).join(" · ")}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-white">
                    Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" strokeWidth={2} />
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Western line strip */}
          <div className="no-scrollbar mt-14 overflow-x-auto pb-2">
            <ol className="relative flex min-w-[56rem] justify-between">
              <span className="absolute left-2 right-2 top-[0.6rem] h-[3px] rounded-full bg-gradient-to-r from-brand-gold via-brand-cream/60 to-brand-gold" aria-hidden="true" />
              {STATIONS.map((s, i) => (
                <li key={s} className="relative flex w-16 flex-col items-center text-center">
                  <span className={`relative z-10 grid h-5 w-5 place-items-center rounded-full border-[3px] ${i === 0 || i === STATIONS.length - 1 ? "border-brand-gold bg-brand-gold" : "border-brand-gold bg-brand-green"}`} />
                  <span className="mt-3 text-[0.72rem] font-medium leading-tight text-brand-cream/85">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ───────────── How it works ───────────── */}
      <section className="py-20">
        <div className="container-page">
          <SectionHeading eyebrow="How it works" title="From first search" accent="to keys in hand." align="center" />
          <ol className="relative mt-14 grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-6">
            <span className="absolute left-[12.5%] right-[12.5%] top-8 hidden border-t-2 border-dashed border-brand-gold/50 md:block" aria-hidden="true" />
            {[
              { icon: Search, title: "Search", body: "Filter by station area, type and budget. Only verified listings show up." },
              { icon: MessageSquareText, title: "Enquire once", body: "Send a short enquiry. It goes straight to the person who listed it." },
              { icon: PhoneCall, title: "Get a call", body: "The developer, owner or broker calls you to answer questions." },
              { icon: Handshake, title: "Visit & close", body: "Book a site visit, negotiate, and close — we track every step." },
            ].map((s, i) => (
              <li key={s.title} className="relative flex flex-col items-center text-center">
                <span className="relative z-10 grid h-16 w-16 place-items-center rounded-full bg-paper shadow-lift ring-1 ring-line">
                  <s.icon className="h-7 w-7 text-brand-green" strokeWidth={1.5} />
                  <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-brand-gold font-display text-xs font-bold text-brand-green-900">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1.5 max-w-[15rem] text-sm leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───────────── Trust ───────────── */}
      <section className="bg-sand/70 py-20">
        <div className="container-page grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <div>
            <p className="eyebrow">Why Real Growth</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
              Nothing goes live <span className="accent-serif text-brand-green">until we check it.</span>
            </h2>
            <Ornament className="mt-5" />
            <p className="mt-5 max-w-xl leading-relaxed text-ink-soft">
              Big portals list everything. We&apos;d rather list less and be sure. Our operations team calls every lister, checks the photos and
              location, and confirms the MahaRERA registration of every under-construction project before buyers ever see it.
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { icon: ClipboardCheck, t: "Manual verification", d: "A real person reviews every listing" },
                { icon: BadgeCheck, t: "MahaRERA required", d: "For all under-construction projects" },
                { icon: UserRound, t: "Direct leads", d: "Your enquiry reaches the lister, not a call centre" },
                { icon: ShieldCheck, t: "Your data, protected", d: "Phone shared only with the lister you contact" },
              ].map((f) => (
                <li key={f.t} className="flex gap-3 rounded-2xl bg-paper p-4 shadow-card">
                  <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-gold" strokeWidth={1.5} />
                  <div>
                    <p className="font-semibold">{f.t}</p>
                    <p className="text-sm text-muted">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="card relative grid grid-cols-2 overflow-hidden p-2">
            {[
              stats.liveCount > 0 ? { v: stats.liveCount, l: "Verified listings" } : { v: STATIONS.length, l: "Stations on our line" },
              { v: stats.areaCount, l: "Areas covered" },
              { v: "100%", l: "Projects MahaRERA checked" },
              stats.listerCount > 0 ? { v: stats.listerCount, l: "Developers, owners & brokers" } : { v: "₹0", l: "Cost to list a property" },
            ].map((s, i) => (
              <div key={s.l} className={`p-8 text-center ${i < 2 ? "border-b border-line" : ""} ${i % 2 === 0 ? "border-r border-line" : ""}`}>
                <p className="font-display text-5xl font-semibold tracking-tight text-brand-green">{s.v}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Partners ───────────── */}
      <section className="py-20">
        <div className="container-page">
          <SectionHeading eyebrow="For owners, brokers & developers" title="List free." accent="Get real enquiries." align="center" description="Short form, plain language. You'll be live as soon as our team has checked your listing." />
          <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {[
              { role: "owner", title: "Property owners", tag: "Sell or rent your own place", points: ["List in about 5 minutes", "No brokerage on direct deals", "Calls come straight to you"] },
              { role: "broker", title: "Brokers & channel partners", tag: "Grow your client base", points: ["List for multiple clients", "Track every lead to closure", "WhatsApp & call in one tap"] },
              { role: "developer", title: "Developers", tag: "Launch new projects", points: ["MahaRERA badge on every project", "Lead inbox with stages & site visits", "Repeat-buyer insights across projects"], featured: true },
            ].map((c) => (
              <div
                key={c.role}
                className={`relative flex flex-col rounded-[1.6rem] p-8 ${c.featured ? "bg-brand-green text-brand-cream shadow-pop lg:-translate-y-3" : "card"}`}
              >
                {c.featured && (
                  <span className="absolute right-6 top-6 rounded-full bg-brand-gold px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-brand-green-900">
                    Most popular
                  </span>
                )}
                <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${c.featured ? "text-brand-gold" : "text-clay"}`}>{c.tag}</p>
                <h3 className={`mt-2 text-2xl font-semibold ${c.featured ? "!text-white" : ""}`}>{c.title}</h3>
                <ul className="mt-6 space-y-3 text-sm">
                  {c.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${c.featured ? "text-brand-gold" : "text-brand-green"}`} strokeWidth={2.4} />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link href={`/signup?role=${c.role}`} className={`btn mt-8 ${c.featured ? "btn-gold" : "btn-primary"}`}>
                  Get started free <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="border-t border-line bg-paper py-20">
        <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div>
            <p className="eyebrow">Questions</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
              Good to <span className="accent-serif text-brand-green">know.</span>
            </h2>
            <p className="mt-4 text-ink-soft">
              Can&apos;t find your answer?{" "}
              <Link href="/contact" className="font-semibold text-brand-green underline-offset-4 hover:underline">
                Talk to our team
              </Link>
              .
            </p>
          </div>
          <div className="divide-y divide-line rounded-2xl border border-line bg-canvas/60">
            {[
              ["Is it free to list a property?", "Yes. Owners, developers and brokers can list for free. You only need an account so buyers can reach you."],
              ["How long does verification take?", "Usually within one working day. Our team may call you to confirm details. You'll see “Under review” on your dashboard until it's live."],
              ["Why do new projects need a MahaRERA number?", "Maharashtra law requires every under-construction project to be registered with MahaRERA. We show the number on the listing so buyers can check it themselves."],
              ["Who sees my phone number when I enquire?", "Only the person who listed that property, and our team. Never other buyers or advertisers."],
              ["Do you cover areas beyond Dahanu or south of Mira Road?", "Not yet. We focus on the Mira Road → Dahanu Road corridor so we can verify every listing properly."],
            ].map(([q, a]) => (
              <details key={q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {q}
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line text-brand-green transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
