"use client";

import { useState, type ReactNode } from "react";
import { Building2, ChevronDown, Home, MapPin, Search, Wallet, type LucideIcon } from "lucide-react";
import { AREA_ZONES, BUDGETS_RENT, BUDGETS_SALE, PROPERTY_TYPES } from "@/lib/constants";
import { slugify } from "@/lib/format";

const INTENTS = [
  { key: "buy", label: "Buy a home", hidden: { purpose: "sale" } },
  { key: "rent", label: "Rent", hidden: { purpose: "rent" } },
  { key: "new", label: "New projects", hidden: { category: "new_project" } },
  { key: "commercial", label: "Commercial", hidden: { segment: "commercial" } },
] as const;

type IntentKey = (typeof INTENTS)[number]["key"];

/** One segment of the search bar: icon, bold label, and a borderless select underneath. */
function Field({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <label className="group/field relative flex min-w-0 cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-canvas focus-within:bg-canvas lg:after:absolute lg:after:-right-0.5 lg:after:top-1/4 lg:after:h-1/2 lg:after:w-px lg:after:bg-line">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-green-50 text-brand-green transition group-hover/field:bg-brand-green group-hover/field:text-white">
        <Icon className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.8rem] font-semibold text-ink">{label}</span>
        {children}
      </span>
      <ChevronDown className="pointer-events-none absolute bottom-4 right-4 h-3.5 w-3.5 text-muted" strokeWidth={2} />
    </label>
  );
}

const selectCls = "w-full cursor-pointer appearance-none truncate bg-transparent pr-5 text-[0.85rem] text-muted outline-none";

export function HeroSearch() {
  const [intent, setIntent] = useState<IntentKey>("buy");
  const current = INTENTS.find((t) => t.key === intent)!;
  const budgets = intent === "rent" ? BUDGETS_RENT : BUDGETS_SALE;
  const types = intent === "commercial" ? PROPERTY_TYPES.filter((t) => t.segment === "commercial") : PROPERTY_TYPES;

  return (
    <form
      action="/projects"
      method="get"
      className="grid grid-cols-1 gap-1 rounded-[1.6rem] border border-line bg-paper p-2 shadow-pop sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-center"
    >
      {Object.entries(current.hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      <Field icon={Home} label="Looking to">
        <select aria-label="Looking to" className={selectCls} value={intent} onChange={(e) => setIntent(e.target.value as IntentKey)}>
          {INTENTS.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <Field icon={MapPin} label="Where?">
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

      <Field icon={Building2} label="Property type">
        <select name="type" className={selectCls} defaultValue="" key={`type-${intent}`}>
          <option value="">Any type</option>
          {types.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>
      </Field>

      <Field icon={Wallet} label="Budget">
        <select name="budget" className={selectCls} defaultValue="" key={`budget-${intent}`}>
          <option value="">Any budget</option>
          {budgets.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </Field>

      <button
        type="submit"
        className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-brand-green-900 px-8 text-[0.95rem] font-semibold text-white transition hover:bg-brand-green focus-visible:bg-brand-green sm:col-span-2 lg:col-span-1 lg:ml-1"
      >
        <Search className="h-4 w-4" strokeWidth={2.2} />
        Search
      </button>
    </form>
  );
}
