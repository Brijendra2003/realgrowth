import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
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
  MapPin,
  MessageSquareText,
  Phone,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  TrainFront,
  UserRound,
} from "lucide-react";
import { FeaturedListings, type FeaturedItem } from "@/components/project/featured-listings";
import { HeroSearch } from "@/components/project/hero-search";
import { ProjectCard } from "@/components/project/project-card";
import { LeafSprig, Ornament, SectionHeading } from "@/components/ui/decor";
import { EmptyState } from "@/components/ui/empty-state";
import { getSessionUser } from "@/lib/auth";
import { SITE } from "@/lib/constants";
import { formatPrice, slugify } from "@/lib/format";
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
  const featured: FeaturedItem[] = newest.map((p) => ({
    slug: p.slug,
    title: p.title,
    cover: p.cover ?? null,
    location: `${p.area.name}, ${p.area.zone}`,
    price: `${formatPrice(p.price, p.purpose)}${p.purpose === "rent" ? "/month" : ""}`,
  }));

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

      <section data-hero-overlay className="-mt-[4.5rem]">
        <div className="relative isolate overflow-hidden bg-brand-green-900">
          {/* Photo: building on the right stays clear; a dark fade on the left carries the copy */}
          <Image src={HERO_IMG} alt="Modern home with a pool" fill preload sizes="100vw" className="-z-10 object-cover object-[68%_center]" />
          <div
            className="absolute inset-0 -z-10 bg-[rgb(8_12_10/0.55)] lg:bg-transparent lg:bg-[linear-gradient(90deg,rgb(8_12_10/0.8)_0%,rgb(8_12_10/0.6)_28%,rgb(8_12_10/0.12)_50%,rgb(8_12_10/0)_62%)]"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-black/35 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-black/40 to-transparent" aria-hidden="true" />

          <div className="container-page relative flex flex-col pb-6 pt-[calc(4.5rem+2.5rem)] sm:pb-8 sm:pt-[calc(4.5rem+3rem)] lg:min-h-[max(48rem,calc(100svh-2.25rem))] lg:pb-10">
            {/* Copy + search on the left, vertically centred in the space above the cards */}
            <div className="flex flex-1 flex-col justify-center">
              <div className="max-w-[40rem] animate-fade-up [text-shadow:0_2px_24px_rgb(0_0_0/0.25)]">
                <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-white/85">
                  Homes <span className="h-px w-5 bg-white/50" aria-hidden="true" /> Commercial <span className="h-px w-5 bg-white/50" aria-hidden="true" /> Plots
                </p>
                <h1 className="mt-5 text-[2.8rem] font-light leading-[1] tracking-[-0.045em] text-white sm:text-7xl lg:text-[5.4rem]">
                  Homes that
                  <br />
                  <span className="font-normal text-brand-cream">grow with you</span>
                </h1>
                <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-white/85">
                  Verified flats, villas, shops and offices from Mira Road to Dahanu Road. Every listing is checked by our team, and your enquiry
                  goes straight to the owner.
                </p>
                <p className="mt-4 inline-flex items-center gap-2 text-[0.8rem] font-medium text-white/80">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-gold opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-gold" />
                  </span>
                  {stats.liveCount > 0
                    ? `${stats.liveCount} verified ${stats.liveCount === 1 ? "listing" : "listings"} live today`
                    : "Every listing verified before it goes live"}
                </p>
              </div>

              <div className="mt-8 w-full max-w-[46rem] animate-fade-up [animation-delay:120ms]">
                <HeroSearch />
              </div>
            </div>

            {/* Bottom glass cards */}
            <div className="mt-10 grid grid-cols-1 gap-3 animate-fade-up [animation-delay:240ms] sm:grid-cols-2 lg:mt-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1.1fr)_minmax(0,0.8fr)] lg:gap-4 lg:pt-14">
              <div className="sm:col-span-2 lg:col-span-1">
                {featured.length > 0 ? (
                  <FeaturedListings items={featured} />
                ) : (
                  <Link href="/projects" className="glass flex h-full items-center gap-4 rounded-[1.6rem] p-4">
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-green-50 text-brand-green">
                      <Sparkles className="h-6 w-6" strokeWidth={1.5} />
                    </span>
                    <span>
                      <span className="block font-display text-lg font-semibold leading-snug">The first listings are being verified</span>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-sm font-semibold text-brand-green">
                        Browse the corridor <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                      </span>
                    </span>
                  </Link>
                )}
              </div>

              <div className="glass grid grid-cols-3 items-center divide-x divide-ink/10 rounded-[1.6rem] px-1 py-5">
                {[
                  stats.liveCount > 0
                    ? { icon: ShieldCheck, v: `${stats.liveCount}`, l: "Verified listings" }
                    : { icon: ShieldCheck, v: "100%", l: "Listings checked" },
                  { icon: MapPin, v: `${stats.areaCount}`, l: "Areas covered" },
                  { icon: TrainFront, v: `${STATIONS.length}`, l: "Stations on our line" },
                ].map((s) => (
                  <div key={s.l} className="px-3 sm:px-4">
                    <s.icon className="h-5 w-5 text-brand-green" strokeWidth={1.5} />
                    <p className="mt-2.5 font-display text-[1.65rem] font-semibold leading-none tracking-tight text-ink">{s.v}</p>
                    <p className="mt-1.5 text-[0.7rem] leading-tight text-muted">{s.l}</p>
                  </div>
                ))}
              </div>

              <Link href="/list-project" className="glass-dark group flex min-h-40 flex-col justify-between rounded-[1.6rem] p-5 text-white">
                <span className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-gold text-brand-green-900">
                    <HomeIcon className="h-5 w-5" strokeWidth={1.7} />
                  </span>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-brand-green-900 transition duration-300 group-hover:rotate-45">
                    <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                  </span>
                </span>
                <span className="mt-6 block">
                  <span className="block font-display text-lg font-semibold leading-tight">List your property free</span>
                  <span className="mt-1 block text-xs leading-relaxed text-white/70">Checked within a day. Buyers call you directly.</span>
                </span>
              </Link>
            </div>
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
