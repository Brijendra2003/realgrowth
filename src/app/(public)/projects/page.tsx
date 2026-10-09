import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, SearchX, SlidersHorizontal, X } from "lucide-react";
import { AutoSubmitForm } from "@/components/project/filter-form";
import { ProjectCard } from "@/components/project/project-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getSessionUser } from "@/lib/auth";
import {
  ALL_BUDGETS,
  AREA_ZONES,
  BUDGETS_RENT,
  BUDGETS_SALE,
  CATEGORY_SHORT,
  CONFIGURATIONS,
  PROPERTY_TYPES,
  SORTS,
  type ListingCategory,
} from "@/lib/constants";
import { slugify } from "@/lib/format";
import { getSavedProjects, searchProjects, type SearchFilters } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = {
  title: "Search properties",
  description: "Search verified flats, villas, shops and offices from Mira Road to Dahanu Road.",
};

const KEYS = ["q", "segment", "category", "purpose", "area", "zone", "type", "budget", "config", "sort", "page"] as const;

function pick(sp: Record<string, string | string[] | undefined>): SearchFilters {
  const f: SearchFilters = {};
  for (const k of KEYS) {
    const v = sp[k];
    const s = Array.isArray(v) ? v[0] : v;
    if (s) f[k] = s;
  }
  return f;
}

function href(f: SearchFilters, patch: Partial<SearchFilters>) {
  const next = { ...f, ...patch };
  if (!("page" in patch)) delete next.page;
  const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]);
  const s = qs.toString();
  return s ? `/projects?${s}` : "/projects";
}

const areaName = (slug: string) => AREA_ZONES.flatMap((z) => z.areas).find((a) => slugify(a) === slug);
const zoneName = (slug: string) => AREA_ZONES.find((z) => slugify(z.zone) === slug)?.zone;

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const f = pick(await searchParams);
  const [{ items, total, page, pages }, user] = await Promise.all([searchProjects(f), getSessionUser()]);
  const savedIds = new Set(user ? (await getSavedProjects(user.id)).map((p) => p.id) : []);

  const place = f.area ? areaName(f.area) : f.zone ? zoneName(f.zone) : null;
  const heading = [
    f.category ? CATEGORY_SHORT[f.category as ListingCategory] : f.segment === "commercial" ? "Commercial properties" : "Properties",
    f.purpose === "rent" ? "for rent" : f.purpose === "sale" ? "for sale" : null,
    place ? `in ${place}` : "from Mira Road to Dahanu Road",
  ]
    .filter(Boolean)
    .join(" ");

  const chips: { label: string; key: keyof SearchFilters }[] = [];
  if (f.q) chips.push({ label: `“${f.q}”`, key: "q" });
  if (f.purpose) chips.push({ label: f.purpose === "rent" ? "Rent" : "Buy", key: "purpose" });
  if (f.segment) chips.push({ label: f.segment === "commercial" ? "Commercial" : "Residential", key: "segment" });
  if (f.category) chips.push({ label: CATEGORY_SHORT[f.category as ListingCategory] ?? f.category, key: "category" });
  if (f.zone) chips.push({ label: zoneName(f.zone) ?? f.zone, key: "zone" });
  if (f.area) chips.push({ label: areaName(f.area) ?? f.area, key: "area" });
  if (f.type) chips.push({ label: PROPERTY_TYPES.find((t) => t.slug === f.type)?.name ?? f.type, key: "type" });
  if (f.budget) chips.push({ label: ALL_BUDGETS.find((b) => b.value === f.budget)?.label ?? f.budget, key: "budget" });
  if (f.config) chips.push({ label: f.config, key: "config" });

  const budgets = f.purpose === "rent" ? BUDGETS_RENT : f.purpose === "sale" ? BUDGETS_SALE : ALL_BUDGETS;

  return (
    <>
      <section className="grain border-b border-line bg-sand/60">
        <div className="container-page py-10">
          <nav aria-label="Breadcrumb" className="text-xs text-muted">
            <Link href="/" className="hover:text-ink">Home</Link> <span className="mx-1.5">/</span> Search
          </nav>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{heading}</h1>
          <p className="mt-2 text-ink-soft">
            <strong className="text-brand-green">{total}</strong> verified {total === 1 ? "listing" : "listings"} · every one checked by our team
          </p>

          <form action="/projects" method="get" className="mt-6 flex max-w-2xl gap-2">
            {Object.entries(f)
              .filter(([k]) => k !== "q" && k !== "page")
              .map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
            <label className="sr-only" htmlFor="q">Search</label>
            <input id="q" name="q" defaultValue={f.q} placeholder="Search by project, builder, area or RG code…" className="input flex-1 !bg-paper" />
            <button className="btn btn-primary">Search</button>
          </form>
        </div>
      </section>

      <div className="container-page grid grid-cols-1 gap-8 py-10 lg:grid-cols-[17rem_minmax(0,1fr)]">
        {/* Filters */}
        <aside aria-label="Filters">
          <details className="group lg:open:block" open>
            <summary className="btn btn-outline mb-4 w-full lg:hidden">
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} /> Filters
            </summary>
            <AutoSubmitForm className="card space-y-6 p-5 lg:sticky lg:top-28">
              {f.q && <input type="hidden" name="q" value={f.q} />}
              {f.sort && <input type="hidden" name="sort" value={f.sort} />}

              <fieldset>
                <legend className="label">I want to</legend>
                <div className="grid grid-cols-3 gap-1 rounded-full bg-canvas p-1">
                  {[
                    ["", "Any"],
                    ["sale", "Buy"],
                    ["rent", "Rent"],
                  ].map(([v, l]) => (
                    <label key={v} className="cursor-pointer">
                      <input type="radio" name="purpose" value={v} defaultChecked={(f.purpose ?? "") === v} className="peer sr-only" />
                      <span className="block rounded-full py-1.5 text-center text-sm font-medium text-ink-soft peer-checked:bg-brand-green peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-gold">
                        {l}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="label">Looking for</legend>
                <div className="space-y-1.5">
                  {[
                    ["", "All"],
                    ["residential", "Residential"],
                    ["commercial", "Commercial"],
                  ].map(([v, l]) => (
                    <label key={v} className="flex cursor-pointer items-center gap-2.5 text-sm">
                      <input type="radio" name="segment" value={v} defaultChecked={(f.segment ?? "") === v} className="h-4 w-4 accent-brand-green" />
                      {l}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label className="label" htmlFor="f-category">Category</label>
                <select id="f-category" name="category" defaultValue={f.category ?? ""} className="input">
                  <option value="">Any category</option>
                  <option value="new_project">New project (under construction)</option>
                  <option value="ready_to_move">Ready to move</option>
                  <option value="resale">Resale</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="f-area">Station area</label>
                <select id="f-area" name="area" defaultValue={f.area ?? ""} className="input">
                  <option value="">All areas</option>
                  {AREA_ZONES.map((z) => (
                    <optgroup key={z.zone} label={z.zone}>
                      {z.areas.map((a) => (
                        <option key={a} value={slugify(a)}>{a}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {f.zone && <input type="hidden" name="zone" value={f.zone} />}
              </div>

              <div>
                <label className="label" htmlFor="f-type">Property type</label>
                <select id="f-type" name="type" defaultValue={f.type ?? ""} className="input">
                  <option value="">Any type</option>
                  <optgroup label="Residential">
                    {PROPERTY_TYPES.filter((t) => t.segment === "residential").map((t) => (
                      <option key={t.slug} value={t.slug}>{t.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Commercial">
                    {PROPERTY_TYPES.filter((t) => t.segment === "commercial").map((t) => (
                      <option key={t.slug} value={t.slug}>{t.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="f-budget">Budget</label>
                <select id="f-budget" name="budget" defaultValue={f.budget ?? ""} className="input">
                  <option value="">Any budget</option>
                  {budgets.map((b) => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="f-config">Size</label>
                <select id="f-config" name="config" defaultValue={f.config ?? ""} className="input">
                  <option value="">Any size</option>
                  {CONFIGURATIONS.filter((c) => c !== "Not applicable").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <noscript>
                <button className="btn btn-primary w-full">Apply filters</button>
              </noscript>
              {chips.length > 0 && (
                <Link href="/projects" className="btn btn-ghost btn-sm w-full">Clear all filters</Link>
              )}
            </AutoSubmitForm>
          </details>
        </aside>

        {/* Results */}
        <section aria-label="Results">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <Link
                  key={c.key}
                  href={href(f, { [c.key]: undefined })}
                  className="chip border border-brand-green/20 bg-brand-green-50 py-1 text-brand-green hover:bg-brand-green-100"
                  aria-label={`Remove filter ${c.label}`}
                >
                  {c.label} <X className="h-3 w-3" strokeWidth={2.4} />
                </Link>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-full border border-line bg-paper p-1 text-sm">
              {SORTS.map((s) => (
                <Link
                  key={s.value}
                  href={href(f, { sort: s.value === "newest" ? undefined : s.value })}
                  className={`rounded-full px-3 py-1.5 ${(f.sort ?? "newest") === s.value ? "bg-ink font-semibold text-white" : "text-ink-soft hover:bg-sand"}`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={SearchX}
                title="No properties match these filters"
                body="Try a nearby area or a wider budget. New listings are added every day."
                action={<Link href="/projects" className="btn btn-primary">See all properties</Link>}
              />
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((p, i) => (
                <ProjectCard key={p.id} p={p} saved={savedIds.has(p.id)} priority={i < 3} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
              <Link
                aria-disabled={page <= 1}
                href={href(f, { page: String(page - 1) })}
                className={`btn btn-outline btn-sm ${page <= 1 ? "pointer-events-none opacity-40" : ""}`}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={href(f, { page: String(n) })}
                  aria-current={n === page ? "page" : undefined}
                  className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ${n === page ? "bg-brand-green text-white" : "hover:bg-sand"}`}
                >
                  {n}
                </Link>
              ))}
              <Link
                aria-disabled={page >= pages}
                href={href(f, { page: String(page + 1) })}
                className={`btn btn-outline btn-sm ${page >= pages ? "pointer-events-none opacity-40" : ""}`}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            </nav>
          )}
        </section>
      </div>
    </>
  );
}
