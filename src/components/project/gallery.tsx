"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import type { ProjectMedia } from "@/lib/types";

export function Gallery({ media, title }: { media: ProjectMedia[]; title: string }) {
  const images = [...media].sort((a, b) => a.sort_order - b.sort_order);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const go = useCallback((d: number) => setIndex((i) => (i + d + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, go]);

  if (!images.length) return <div className="aspect-[16/9] rounded-3xl bg-sand" />;
  const side = images.slice(1, 3);

  return (
    <>
      <div className={`grid gap-3 ${side.length ? "md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : ""}`}>
        <button type="button" onClick={() => setOpen(true)} className="group relative aspect-[16/10] overflow-hidden rounded-3xl bg-sand md:aspect-auto md:min-h-[26rem]">
          <Image src={images[index]!.url} alt={`${title} — photo ${index + 1}`} fill priority sizes="(min-width:768px) 60vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.02]" />
          <span className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
            <Expand className="h-3.5 w-3.5" strokeWidth={2} /> View all {images.length} photos
          </span>
        </button>
        {side.length > 0 && (
          <div className="hidden grid-rows-2 gap-3 md:grid">
            {side.map((m, i) => (
              <button key={m.id} type="button" onClick={() => { setIndex(i + 1); setOpen(true); }} className="relative overflow-hidden rounded-3xl bg-sand">
                <Image src={m.url} alt={`${title} — photo ${i + 2}`} fill sizes="25vw" className="object-cover transition duration-700 hover:scale-105" />
                {i === side.length - 1 && images.length > 3 && (
                  <span className="absolute inset-0 grid place-items-center bg-brand-green-900/55 font-display text-2xl font-semibold text-white">+{images.length - 3}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto md:hidden">
          {images.map((m, i) => (
            <button key={m.id} type="button" onClick={() => setIndex(i)} className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl ring-2 ${i === index ? "ring-brand-green" : "ring-transparent"}`}>
              <Image src={m.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Photo gallery">
          <div className="flex items-center justify-between p-4 text-white">
            <p className="text-sm">{index + 1} / {images.length}</p>
            <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label="Close gallery">
              <X className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>
          <div className="relative flex-1">
            <Image src={images[index]!.url} alt={`${title} — photo ${index + 1}`} fill sizes="100vw" className="object-contain" />
            {images.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Previous photo">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button type="button" onClick={() => go(1)} className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Next photo">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
          <div className="no-scrollbar flex justify-center gap-2 overflow-x-auto p-4">
            {images.map((m, i) => (
              <button key={m.id} type="button" onClick={() => setIndex(i)} className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg ring-2 ${i === index ? "ring-brand-gold" : "ring-transparent opacity-60"}`}>
                <Image src={m.url} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
