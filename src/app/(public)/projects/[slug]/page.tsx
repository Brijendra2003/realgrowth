import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  Compass,
  ExternalLink,
  Eye,
  Hash,
  Home,
  KeyRound,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Ruler,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { EnquiryForm } from "@/components/lead/enquiry-form";
import { EmiCalculator } from "@/components/project/emi-calculator";
import { Gallery } from "@/components/project/gallery";
import { ProjectCard } from "@/components/project/project-card";
import { SaveButton } from "@/components/project/save-button";
import { ViewTracker } from "@/components/project/view-tracker";
import { LeadStageChip, ListerBadge, ProjectStatusChip, VerifiedBadge } from "@/components/ui/chips";
import { getSessionUser } from "@/lib/auth";
import { CATEGORY_LABELS, CONSTRUCTION_LABELS, PURPOSE_LABELS, ROLE_LABELS, SEGMENT_LABELS, isStaff } from "@/lib/constants";
import { formatDate, formatMonthYear, formatPrice, formatPricePerSqft, initials, slugify } from "@/lib/format";
import { getProjectBySlug } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProjectBySlug(slug);
  if (!data) return { title: "Property not found" };
  const p = data.project;
  const title = `${p.title} — ${p.configuration !== "Not applicable" ? `${p.configuration} ` : ""}${p.type.name} in ${p.area.name}`;
  return {
    title,
    description: `${formatPrice(p.price, p.purpose)}${p.purpose === "rent" ? "/month" : ""} · ${p.carpet_area_sqft} sq ft · ${p.description.slice(0, 140)}`,
    openGraph: { title, images: p.cover ? [p.cover] : [] },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const user = await getSessionUser();
  const data = await getProjectBySlug(slug, user);
  if (!data) notFound();
  const { project: p, similar, listerLiveCount, myEnquiry, priorWithLister, isOwner, saved } = data;
  const listerName = p.lister.company_name ?? p.lister.full_name;
  const perSqft = p.purpose === "sale" ? formatPricePerSqft(p.price, p.carpet_area_sqft) : null;

  const facts = [
    { icon: LayoutGrid, label: "Size", value: p.configuration === "Not applicable" ? "—" : p.configuration },
    { icon: Ruler, label: "Carpet area", value: `${p.carpet_area_sqft.toLocaleString("en-IN")} sq ft` },
    { icon: Home, label: "Type", value: p.type.name },
    { icon: Building2, label: "Segment", value: SEGMENT_LABELS[p.segment] },
    { icon: Tag, label: "Category", value: CATEGORY_LABELS[p.category] },
    { icon: KeyRound, label: "Status", value: CONSTRUCTION_LABELS[p.construction_status] },
    ...(p.possession_date ? [{ icon: CalendarClock, label: "Possession", value: formatMonthYear(p.possession_date) }] : []),
    { icon: Hash, label: "Listing ID", value: p.code },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.title,
    description: p.description,
    image: p.media.filter((m) => m.kind === "image").map((m) => m.url),
    datePosted: p.verified_at ?? p.created_at,
    offers: { "@type": "Offer", price: p.price, priceCurrency: "INR" },
    address: { "@type": "PostalAddress", streetAddress: p.address_line, addressLocality: p.area.name, addressRegion: "Maharashtra", addressCountry: "IN" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {p.status === "verified" && <ViewTracker projectId={p.id} />}

      {p.status !== "verified" && (
        <div className="border-b border-brand-gold/30 bg-brand-gold-50">
          <div className="container-page flex flex-wrap items-center gap-3 py-3 text-sm text-[#7a5600]">
            <AlertTriangle className="h-4 w-4" strokeWidth={2} />
            <span>Preview — this listing is not public.</span>
            <ProjectStatusChip status={p.status} />
            {p.rejection_reason && <span className="font-medium">Reason: {p.rejection_reason}</span>}
            {isOwner && (
              <Link href={`/my-projects/${p.id}/edit`} className="ml-auto font-semibold underline">Edit listing</Link>
            )}
            {user && isStaff(user.role) && (
              <Link href={`/admin/verification/${p.id}`} className="ml-auto font-semibold underline">Open in review</Link>
            )}
          </div>
        </div>
      )}

      <div className="container-page py-8">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-ink">Home</Link> /
          <Link href={`/projects?purpose=${p.purpose}`} className="hover:text-ink">{p.purpose === "rent" ? "Rent" : "Buy"}</Link> /
          <Link href={`/projects?area=${slugify(p.area.name)}`} className="hover:text-ink">{p.area.name}</Link> /
          <span className="text-ink-soft">{p.title}</span>
        </nav>

        <Gallery media={p.media} title={p.title} />

        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="min-w-0 space-y-10">
            {/* Title block */}
            <header>
              <div className="flex flex-wrap items-center gap-2">
                {p.status === "verified" && <VerifiedBadge size="md" />}
                <ListerBadge role={p.lister.role} />
                <span className="chip bg-sand text-ink-soft">{PURPOSE_LABELS[p.purpose]}</span>
                {p.maharera_no && (
                  <span className="chip bg-brand-gold-50 text-[#8a6100] ring-1 ring-brand-gold/30">
                    <ShieldCheck className="h-3 w-3" strokeWidth={2} /> MahaRERA registered
                  </span>
                )}
              </div>
              <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-[2.6rem]">{p.title}</h1>
              <p className="mt-2 flex items-start gap-2 text-ink-soft">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-brand-gold" strokeWidth={1.8} />
                <span>
                  {p.address_line}, {p.area.name} · <span className="text-muted">{p.area.zone}</span>
                </span>
              </p>
              <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-3 border-y border-line py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">{p.purpose === "rent" ? "Monthly rent" : "Price"}</p>
                  <p className="font-display text-4xl font-semibold tracking-tight text-brand-green">
                    {formatPrice(p.price, p.purpose)}
                    {p.purpose === "rent" && <span className="text-lg text-muted">/month</span>}
                  </p>
                </div>
                {perSqft && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted">Rate</p>
                    <p className="text-lg font-semibold">{perSqft}</p>
                  </div>
                )}
                <p className="ml-auto flex items-center gap-1.5 text-sm text-muted">
                  <Eye className="h-4 w-4" strokeWidth={1.5} /> {p.views_count} views · Listed {formatDate(p.verified_at ?? p.created_at)}
                </p>
              </div>
            </header>

            {/* Key facts */}
            <section aria-labelledby="facts">
              <h2 id="facts" className="text-xl font-semibold">Key facts</h2>
              <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
                {facts.map((f) => (
                  <div key={f.label} className="bg-paper p-4">
                    <dt className="flex items-center gap-1.5 text-xs text-muted">
                      <f.icon className="h-3.5 w-3.5 text-brand-gold" strokeWidth={1.8} /> {f.label}
                    </dt>
                    <dd className="mt-1 font-semibold">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {p.maharera_no && (
              <section className="flex flex-col gap-4 rounded-2xl border border-brand-gold/30 bg-brand-gold-50/60 p-5 sm:flex-row sm:items-center">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-gold text-brand-green-900">
                  <ShieldCheck className="h-6 w-6" strokeWidth={1.6} />
                </span>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#8a6100]">MahaRERA registration</p>
                  <p className="font-display text-xl font-semibold tracking-wide">{p.maharera_no}</p>
                  <p className="text-sm text-ink-soft">Checked by our team. You can verify it yourself on the MahaRERA website.</p>
                </div>
                <a href="https://maharera.maharashtra.gov.in/" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm bg-paper">
                  Verify on MahaRERA <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </section>
            )}

            <section aria-labelledby="about">
              <h2 id="about" className="text-xl font-semibold">About this property</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink-soft">{p.description}</p>
            </section>

            {p.amenities.length > 0 && (
              <section aria-labelledby="amenities">
                <h2 id="amenities" className="text-xl font-semibold">Amenities & nearby</h2>
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {p.amenities.map((a) => (
                    <li key={a} className="flex items-center gap-2.5 rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-green-50 text-brand-green">
                        <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                      </span>
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="location" className="card overflow-hidden">
              <div className="grain relative h-44 bg-sage">
                <svg className="absolute inset-0 h-full w-full text-brand-green/20" aria-hidden="true">
                  <defs>
                    <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
                      <path d="M28 0H0v28" fill="none" stroke="currentColor" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  <path d="M-10 120 C 120 60, 260 160, 420 90 S 700 40, 1200 110" stroke="#E5A913" strokeWidth="5" fill="none" opacity="0.7" />
                </svg>
                <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-green text-white shadow-pop ring-8 ring-brand-green/20">
                  <MapPin className="h-6 w-6" strokeWidth={1.8} />
                </span>
              </div>
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="location" className="font-semibold">{p.area.name}</h2>
                  <p className="text-sm text-muted">{p.address_line} · {p.area.zone}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.address_line}, ${p.area.name}, Maharashtra`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  <Compass className="h-4 w-4" strokeWidth={1.8} /> Open in Google Maps
                </a>
              </div>
            </section>

            {p.purpose === "sale" && <EmiCalculator price={p.price} />}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <div className="card overflow-hidden">
              <div className="bg-brand-green px-6 py-5 text-brand-cream">
                <p className="text-xs uppercase tracking-[0.14em] text-brand-gold">Listed by</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-cream font-display font-bold text-brand-green">{initials(listerName)}</span>
                  <div>
                    <p className="font-semibold text-white">{listerName}</p>
                    <p className="text-xs text-brand-cream/75">
                      {ROLE_LABELS[p.lister.role]} · {listerLiveCount} live {listerLiveCount === 1 ? "listing" : "listings"}
                      {p.lister.agent_rera_no ? ` · RERA ${p.lister.agent_rera_no}` : ""}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {isOwner ? (
                  <div className="space-y-3 text-sm">
                    <p className="font-semibold">This is your listing.</p>
                    <p className="text-muted">Buyers see the enquiry form here. Manage enquiries from your leads inbox.</p>
                    <Link href="/leads" className="btn btn-primary w-full">Open my leads</Link>
                    <Link href={`/my-projects/${p.id}/edit`} className="btn btn-outline w-full">Edit listing</Link>
                  </div>
                ) : user && isStaff(user.role) ? (
                  <p className="text-sm text-muted">You&apos;re signed in as Real Growth staff. Enquiries are sent by buyers.</p>
                ) : p.status !== "verified" ? (
                  <p className="text-sm text-muted">Enquiries open once the listing is live.</p>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold">Interested? Get a call back</h2>
                    {myEnquiry ? (
                      <p className="mb-3 mt-1 flex items-center gap-2 text-sm text-muted">
                        Your enquiry: <LeadStageChip stage={myEnquiry.stage} />
                      </p>
                    ) : (
                      !user && <p className="mt-1.5 text-sm text-muted">No account needed. Your number goes only to this lister.</p>
                    )}
                    <div className="mt-4">
                      <EnquiryForm
                        projectId={p.id}
                        defaults={{ name: user?.full_name ?? "", phone: user?.phone ?? "" }}
                        priorWithLister={priorWithLister}
                        alreadyEnquired={!!myEnquiry}
                        listerName={listerName}
                        signedIn={!!user}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {!isOwner && p.status === "verified" && (
              <div className={`grid gap-3 ${user ? "grid-cols-2" : "grid-cols-1"}`}>
                {user && <SaveButton projectId={p.id} saved={saved} variant="button" />}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Have a look at ${p.title} on Real Growth`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.8} /> Share
                </a>
              </div>
            )}

            <div className="flex gap-3 rounded-2xl border border-line bg-paper p-4 text-sm">
              <BadgeCheck className="h-5 w-5 shrink-0 text-brand-green" strokeWidth={1.6} />
              <p className="text-ink-soft">
                <strong className="text-ink">Verified by Real Growth.</strong> Our team checked the lister and photos{p.maharera_no ? ", and the MahaRERA number" : ""} before publishing.
              </p>
            </div>
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-20" aria-labelledby="similar">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow">You may also like</p>
                <h2 id="similar" className="mt-2 text-2xl font-semibold sm:text-3xl">
                  Similar properties <span className="accent-serif text-brand-green">nearby.</span>
                </h2>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((s) => (
                <ProjectCard key={s.id} p={s} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
