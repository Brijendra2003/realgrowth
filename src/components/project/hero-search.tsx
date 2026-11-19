"use client";

import { useState, type ReactNode } from "react";
import { Building, ChevronDown, Home, KeyRound, Search, Sparkles } from "lucide-react";
import { AREA_ZONES, BUDGETS_RENT, BUDGETS_SALE, PROPERTY_TYPES } from "@/lib/constants";
import { slugify } from "@/lib/format";

const TABS = [
  { key: "buy", label: "Buy", icon: Home, hidden: { purpose: "sale" } },
  { key: "rent", label: "Rent", icon: KeyRound, hidden: { purpose: "rent" } },
  { key: "new", label: "New projects", icon: Sparkles, hidden: { category: "new_project" } },
  { key: "commercial", label: "Commercial", icon: Building, hidden: { segment: "commercial" } },
] as const;

/** Segmented field: small caps label over a borderless select. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="relative block min-w-0 cursor-pointer px-5 py-2.5 transition hover:bg-canvas/70 focus-within:bg-canvas/70">
      <span className="block text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted">{label}</span>
      {children}
      <ChevronDown className="pointer-events-none absolute bottom-3.5 right-4 h-4 w-4 text-muted" strokeWidth={1.8} />
    </label>
  );
}

const selectCls = "mt-0.5 w-full cursor-pointer appearance-none truncate bg-transparent pr-6 text-[0.95rem] font-medium text-ink outline-none";

export function HeroSearch() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("buy");
  const current = TABS.find((t) => t.key === tab)!;
  const budgets = tab === "rent" ? BUDGETS_RENT : BUDGETS_SALE;
  const types = tab === "commercial" ? PROPERTY_TYPES.filter((t) => t.segment === "commercial") : PROPERTY_TYPES;

  return (
    <div className="glass rounded-[1.75rem] p-1.5">
      <div role="tablist" aria-label="What are you looking for" className="no-scrollbar flex gap-1 overflow-x-auto px-1 pb-1.5 pt-0.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.82rem] font-semibold transition ${
              tab === t.key ? "bg-brand-green-900 text-white shadow-sm" : "text-ink-soft hover:bg-white/70 hover:text-ink"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" strokeWidth={1.9} />
            {t.label}
          </button>
        ))}
      </div>

      <form
        action="/projects"
        method="get"
        className="grid grid-cols-1 divide-y divide-line-soft overflow-hidden rounded-[1.35rem] bg-white shadow-card sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:divide-x sm:divide-y-0"
      >
        {Object.entries(current.hidden).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <Field label="Location">
          <select name="area" className={selectCls} defaultValue="">
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
        </Field>
        <Field label="Property type">
          <select name="type" className={selectCls} defaultValue="">
            <option value="">Any type</option>
            {types.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Budget">
          <select name="budget" className={selectCls} defaultValue="" key={tab}>
            <option value="">Any budget</option>
            {budgets.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>
        <div className="p-1.5 !border-0 sm:pl-0">
          <button
            type="submit"
            className="flex h-full min-h-12 w-full items-center justify-center gap-2 rounded-[1.1rem] bg-brand-green-900 px-6 text-[0.95rem] font-semibold text-white transition hover:bg-brand-green focus-visible:bg-brand-green sm:rounded-full"
          >
            <Search className="h-4 w-4" strokeWidth={2.2} />
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
