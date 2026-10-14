"use client";

import { useActionState, useState } from "react";
import { Check, Save } from "lucide-react";
import { saveRequirementAction } from "@/actions/requirements";
import { Field, FormAlert } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { AREA_ZONES, CATEGORIES, CATEGORY_SHORT, CONFIGURATIONS, type ListingCategory, type Purpose, type Segment } from "@/lib/constants";
import type { ActionState, Area, PropertyType } from "@/lib/types";

/** Form values as typed: budgets in lakh for a purchase, in rupees a month for rent. */
export type RequirementDraft = {
  purpose: Purpose;
  segment: Segment;
  area_ids: number[];
  property_type_ids: number[];
  configurations: string[];
  categories: ListingCategory[];
  budget_min: string;
  budget_max: string;
  min_carpet_sqft: string;
  note: string;
};

const SIZES = CONFIGURATIONS.filter((c) => c !== "Not applicable");

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function Toggle<T extends string>({ name, value, onChange, options }: { name: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="grid gap-1 rounded-2xl bg-canvas p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(([v, l]) => (
        <label key={v} className="cursor-pointer">
          <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} className="peer sr-only" />
          <span className="block rounded-xl py-2.5 text-center text-sm font-semibold text-ink-soft transition peer-checked:bg-paper peer-checked:text-brand-green peer-checked:shadow-card peer-focus-visible:ring-2 peer-focus-visible:ring-brand-gold">
            {l}
          </span>
        </label>
      ))}
    </div>
  );
}

/** A checkbox styled as a pill. */
function Pill({ name, value, checked, onChange, children }: { name: string; value: string; checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="cursor-pointer">
      <input type="checkbox" name={name} value={value} checked={checked} onChange={onChange} className="peer sr-only" />
      <span className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-line bg-paper px-3 py-1.5 text-sm text-ink-soft transition hover:border-brand-green/40 peer-checked:border-brand-green peer-checked:bg-brand-green-50 peer-checked:font-medium peer-checked:text-brand-green peer-focus-visible:ring-2 peer-focus-visible:ring-brand-gold">
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={2.6} />}
        {children}
      </span>
    </label>
  );
}

function Section({ title, hint, error, children }: { title: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <section className="card p-6 sm:p-8">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      <div className="mt-5">{children}</div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </section>
  );
}

export function RequirementForm({ id, draft, areas, propertyTypes }: { id?: string; draft: RequirementDraft; areas: Area[]; propertyTypes: PropertyType[] }) {
  const [state, action] = useActionState<ActionState, FormData>(saveRequirementAction, {});
  const v = state.values ?? {};
  const e = state.errors ?? {};
  const [purpose, setPurpose] = useState<Purpose>(draft.purpose);
  const [segment, setSegment] = useState<Segment>(draft.segment);
  const [areaIds, setAreaIds] = useState<number[]>(draft.area_ids);
  const [typeIds, setTypeIds] = useState<number[]>(draft.property_type_ids);
  const [sizes, setSizes] = useState<string[]>(draft.configurations);
  const [categories, setCategories] = useState<ListingCategory[]>(draft.categories);

  const live = areas.filter((a) => a.is_active);
  const zones = [...AREA_ZONES.map((z) => z.zone), ...new Set(live.map((a) => a.zone).filter((z) => !AREA_ZONES.some((x) => x.zone === z)))];
  const types = propertyTypes.filter((t) => t.segment === segment);
  const unit = purpose === "sale" ? "₹ lakh" : "₹ per month";

  return (
    <form action={action} className="space-y-6" noValidate>
      {id && <input type="hidden" name="id" value={id} />}
      {e.form && <FormAlert>{e.form}</FormAlert>}

      <Section title="What are you looking for?">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="label">I want to</p>
            <Toggle name="purpose" value={purpose} onChange={setPurpose} options={[["sale", "Buy"], ["rent", "Rent"]]} />
          </div>
          <div>
            <p className="label">Property</p>
            <Toggle
              name="segment"
              value={segment}
              onChange={(s) => {
                setSegment(s);
                setTypeIds([]);
              }}
              options={[["residential", "Residential"], ["commercial", "Commercial"]]}
            />
          </div>
        </div>
        <div className="mt-5">
          <p className="label">
            Property type <span className="ml-1.5 text-xs font-normal text-muted">(leave empty for any)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {types.map((t) => (
              <Pill key={t.id} name="property_type_ids" value={String(t.id)} checked={typeIds.includes(t.id)} onChange={() => setTypeIds(toggle(typeIds, t.id))}>
                {t.name}
              </Pill>
            ))}
          </div>
          {e.property_type_ids && <p className="field-error">{e.property_type_ids}</p>}
        </div>
        {segment === "residential" && (
          <div className="mt-5">
            <p className="label">
              Size <span className="ml-1.5 text-xs font-normal text-muted">(leave empty for any)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((c) => (
                <Pill key={c} name="configurations" value={c} checked={sizes.includes(c)} onChange={() => setSizes(toggle(sizes, c))}>
                  {c}
                </Pill>
              ))}
            </div>
          </div>
        )}
        <div className="mt-5">
          <p className="label">
            Category <span className="ml-1.5 text-xs font-normal text-muted">(leave empty for any)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Pill key={c} name="categories" value={c} checked={categories.includes(c)} onChange={() => setCategories(toggle(categories, c))}>
                {CATEGORY_SHORT[c]}
              </Pill>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Where?" hint="Pick every area you'd be happy with. Places nearby in the same zone still count as a partial match." error={e.area_ids}>
        <div className="space-y-5">
          {zones.map((zone) => {
            const inZone = live.filter((a) => a.zone === zone);
            if (!inZone.length) return null;
            const all = inZone.every((a) => areaIds.includes(a.id));
            return (
              <div key={zone}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{zone}</p>
                  <button
                    type="button"
                    className="text-xs font-semibold text-brand-green hover:underline"
                    onClick={() =>
                      setAreaIds(all ? areaIds.filter((x) => !inZone.some((a) => a.id === x)) : [...new Set([...areaIds, ...inZone.map((a) => a.id)])])
                    }
                  >
                    {all ? "Clear zone" : "Select whole zone"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {inZone.map((a) => (
                    <Pill key={a.id} name="area_ids" value={String(a.id)} checked={areaIds.includes(a.id)} onChange={() => setAreaIds(toggle(areaIds, a.id))}>
                      {a.name}
                    </Pill>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Budget and size">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label={`Lowest budget (${unit})`} htmlFor="budget_min" optional error={e.budget_min}>
            <input id="budget_min" name="budget_min" inputMode="decimal" className="input" defaultValue={v.budget_min ?? draft.budget_min} placeholder={purpose === "sale" ? "e.g. 40" : "e.g. 10000"} />
          </Field>
          <Field label={`Highest budget (${unit})`} htmlFor="budget_max" error={e.budget_max} hint={purpose === "sale" ? "1 crore = 100 lakh" : undefined}>
            <input id="budget_max" name="budget_max" inputMode="decimal" className="input" defaultValue={v.budget_max ?? draft.budget_max} placeholder={purpose === "sale" ? "e.g. 70" : "e.g. 20000"} aria-invalid={!!e.budget_max} />
          </Field>
          <Field label="Smallest carpet area (sq ft)" htmlFor="min_carpet_sqft" optional error={e.min_carpet_sqft}>
            <input id="min_carpet_sqft" name="min_carpet_sqft" inputMode="numeric" className="input" defaultValue={v.min_carpet_sqft ?? draft.min_carpet_sqft} placeholder="e.g. 550" />
          </Field>
        </div>
        <Field label="Anything else?" htmlFor="note" optional className="mt-4" hint="For example: near the station, east-facing, need parking.">
          <textarea id="note" name="note" rows={3} className="input !min-h-24" defaultValue={v.note ?? draft.note} maxLength={1000} />
        </Field>
      </Section>

      <p className="text-sm text-muted">
        Listers only see what you&apos;re looking for, never your name or number. If one asks to connect, you decide whether to share your number.
      </p>
      <SubmitButton className="btn btn-primary btn-lg w-full sm:w-auto" pendingText="Saving…">
        <Save className="h-4 w-4" strokeWidth={2} /> {id ? "Save changes" : "Post requirement and see matches"}
      </SubmitButton>
    </form>
  );
}
