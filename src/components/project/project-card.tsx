import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BedDouble, Camera, MapPin, Ruler } from "lucide-react";
import { CATEGORY_SHORT } from "@/lib/constants";
import { formatPrice, formatPricePerSqft } from "@/lib/format";
import type { ProjectView } from "@/lib/queries";
import { ListerBadge, VerifiedBadge } from "@/components/ui/chips";
import { SaveButton } from "./save-button";

/** `saved` is only passed for signed-in viewers; without it the save button is hidden. */
export function ProjectCard({ p, saved, priority = false }: { p: ProjectView; saved?: boolean; priority?: boolean }) {
  const perSqft = p.purpose === "sale" ? formatPricePerSqft(p.price, p.carpet_area_sqft) : null;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[1.375rem] border border-line bg-paper shadow-card transition duration-500 ease-out-soft hover:-translate-y-1 hover:shadow-lift">
      <div className="relative aspect-[4/3] overflow-hidden bg-sand">
        {p.cover && (
          <Image
            src={p.cover}
            alt={p.title}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-700 ease-out-soft group-hover:scale-[1.04]"
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <VerifiedBadge />
          <span className="chip bg-white/90 text-ink backdrop-blur">{p.purpose === "rent" ? "For rent" : CATEGORY_SHORT[p.category]}</span>
        </div>
        {saved !== undefined && (
          <div className="absolute right-3 top-3 z-10">
            <SaveButton projectId={p.id} saved={saved} />
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
          <span className="flex items-center gap-1 text-xs font-medium opacity-90">
            <Camera className="h-3.5 w-3.5" strokeWidth={1.5} /> {p.media.length}
          </span>
          <span className="rounded-full bg-black/35 px-2 py-0.5 text-[0.7rem] font-medium tracking-wide backdrop-blur">{p.code}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-2xl font-semibold tracking-tight text-brand-green">
            {formatPrice(p.price, p.purpose)}
            {p.purpose === "rent" && <span className="text-sm font-medium text-muted">/month</span>}
          </p>
          {perSqft && <p className="text-xs text-muted">{perSqft}</p>}
        </div>
        <h3 className="mt-1.5 line-clamp-1 text-[1.05rem] font-semibold">
          <Link href={`/projects/${p.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {p.title}
          </Link>
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
          <MapPin className="h-4 w-4 shrink-0 text-brand-gold" strokeWidth={1.5} />
          <span className="line-clamp-1">
            {p.area.name}, <span className="text-muted">{p.area.zone}</span>
          </span>
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-canvas p-3 text-sm">
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-muted" strokeWidth={1.5} />
            <dt className="sr-only">Size</dt>
            <dd className="truncate font-medium">{p.configuration === "Not applicable" ? p.type.name : p.configuration}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-muted" strokeWidth={1.5} />
            <dt className="sr-only">Carpet area</dt>
            <dd className="font-medium">{p.carpet_area_sqft.toLocaleString("en-IN")} sq ft</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <div className="flex min-w-0 items-center gap-2">
            <ListerBadge role={p.lister.role} />
            <span className="truncate text-xs text-muted">{p.lister.company_name ?? p.lister.full_name}</span>
          </div>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-brand-green transition group-hover:border-brand-green group-hover:bg-brand-green group-hover:text-white">
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
          </span>
        </div>
      </div>
    </article>
  );
}
