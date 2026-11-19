"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";

export type FeaturedItem = {
  slug: string;
  title: string;
  cover: string | null;
  location: string;
  price: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Glass "featured listing" card for the home hero; cycles through the newest verified listings. */
export function FeaturedListings({ items }: { items: FeaturedItem[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const id = setInterval(() => setI((n) => (n + 1) % count), 6000);
    return () => clearInterval(id);
  }, [count, paused]);

  const p = items[i];
  const go = (d: number) => setI((n) => (n + d + count) % count);

  return (
    <div
      className="glass flex h-full gap-4 rounded-[1.6rem] p-3"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Link href={`/projects/${p.slug}`} className="relative aspect-[4/3.4] w-[42%] shrink-0 overflow-hidden rounded-[1.15rem] bg-sand">
        {items.map((it, n) =>
          it.cover ? (
            <Image
              key={it.slug}
              src={it.cover}
              alt={n === i ? it.title : ""}
              fill
              sizes="12rem"
              className={`object-cover transition duration-700 ease-out-soft ${n === i ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
            />
          ) : null,
        )}
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-ink backdrop-blur">
          Featured
        </span>
      </Link>

      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        <div className="flex items-center justify-between gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted">
          <span>Newest listing</span>
          <span className="tabular-nums" aria-live="polite">
            {pad(i + 1)} / {pad(count)}
          </span>
        </div>
        <p className="mt-2 line-clamp-1 font-display text-lg font-semibold leading-snug text-ink">{p.title}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-gold-600" strokeWidth={1.8} />
          <span className="truncate">{p.location}</span>
        </p>
        <p className="mt-1.5 font-display text-[0.95rem] font-semibold text-brand-green">{p.price}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <Link href={`/projects/${p.slug}`} className="inline-flex items-center gap-1 text-[0.8rem] font-semibold text-ink hover:text-brand-green">
            View listing <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Link>
          {count > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous listing"
                className="grid h-8 w-8 place-items-center rounded-full bg-white/80 text-ink ring-1 ring-black/5 transition hover:bg-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next listing"
                className="grid h-8 w-8 place-items-center rounded-full bg-brand-green-900 text-white transition hover:bg-brand-green"
              >
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
