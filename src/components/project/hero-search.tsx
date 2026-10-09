"use client";

import { useState } from "react";
import { Building, Home, KeyRound, MapPin, Search, Sparkles, Wallet } from "lucide-react";
import { AREA_ZONES, BUDGETS_RENT, BUDGETS_SALE, PROPERTY_TYPES } from "@/lib/constants";
import { slugify } from "@/lib/format";

const TABS = [
  { key: "buy", label: "Buy", icon: Home, hidden: { purpose: "sale" } },
  { key: "rent", label: "Rent", icon: KeyRound, hidden: { purpose: "rent" } },
  { key: "new", label: "New projects", icon: Sparkles, hidden: { category: "new_project" } },
  { key: "commercial", label: "Commercial", icon: Building, hidden: { segment: "commercial" } },
] as const;

export function HeroSearch() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("buy");
  const current = TABS.find((t) => t.key === tab)!;
  const budgets = tab === "rent" ? BUDGETS_RENT : BUDGETS_SALE;
  const types = tab === "commercial" ? PROPERTY_TYPES.filter((t) => t.segment === "commercial") : PROPERTY_TYPES;

  return (
    <div className="relative rounded-[1.6rem] border border-line bg-paper/95 p-2 shadow-pop backdrop-blur">
      <div role="tablist" aria-label="What are you looking for" className="no-scrollbar flex gap-1 overflow-x-auto p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.key ? "bg-brand-green text-white shadow" : "text-ink-soft hover:bg-sand"
            }`}
          >
            <t.icon className="h-4 w-4" strokeWidth={1.8} />
            {t.label}
          </button>
        ))}
      </div>

      <form action="/projects" method="get" className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        {Object.entries(current.hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <label className="relative block sm:col-span-3">
          <span className="sr-only">Area</span>
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gold" strokeWidth={1.8} />
          <select name="area" className="input !pl-10" defaultValue="">
            <option value="">All areas, Mira Road → Dahanu</option>
            {AREA_ZONES.map((z) => (
              <optgroup key={z.zone} label={z.zone}>
                {z.areas.map((a) => (
                  <option key={a} value={slugify(a)}>
                    {a}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="relative block">
          <span className="sr-only">Property type</span>
          <Home className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gold" strokeWidth={1.8} />
          <select name="type" className="input !pl-10" defaultValue="">
            <option value="">Any type</option>
            {types.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="relative block">
          <span className="sr-only">Budget</span>
          <Wallet className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gold" strokeWidth={1.8} />
          <select name="budget" className="input !pl-10" defaultValue="" key={tab}>
            <option value="">Any budget</option>
            {budgets.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn-primary btn-lg">
          <Search className="h-4 w-4" strokeWidth={2} />
          Search
        </button>
      </form>
    </div>
  );
}
