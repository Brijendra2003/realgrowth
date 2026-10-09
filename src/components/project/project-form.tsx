"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Info, ShieldCheck, Trash2, Undo2 } from "lucide-react";
import { saveProjectAction } from "@/actions/projects";
import { Field, FormAlert } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  AMENITIES,
  AREA_ZONES,
  CATEGORY_LABELS,
  CONFIGURATIONS,
  MAX_PHOTOS,
  type ConstructionStatus,
  type ListingCategory,
  type Purpose,
  type Segment,
} from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import type { ActionState, Area, Project, PropertyType } from "@/lib/types";

type Props = {
  areas: Area[];
  propertyTypes: PropertyType[];
  project?: Project;
};

const CATEGORY_TO_STATUS: Record<ListingCategory, ConstructionStatus> = {
  new_project: "under_construction",
  ready_to_move: "ready",
  resale: "resale",
};

function Section({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={`step-${n}`} className="card scroll-mt-28 p-6 sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-green font-display font-bold text-brand-cream">{n}</span>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {hint && <p className="text-sm text-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
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

export function ProjectForm({ areas, propertyTypes, project }: Props) {
  const [state, action] = useActionState<ActionState, FormData>(saveProjectAction, {});
  const e = state.errors ?? {};
  const v = state.values ?? {};
  const pick = <K extends keyof Project>(k: K, fallback = "") => v[k as string] ?? (project ? String(project[k] ?? "") : fallback);

  const [purpose, setPurpose] = useState<Purpose>((pick("purpose", "sale") as Purpose) || "sale");
  const [segment, setSegment] = useState<Segment>((pick("segment", "residential") as Segment) || "residential");
  const [category, setCategory] = useState<ListingCategory>((pick("category", "new_project") as ListingCategory) || "new_project");
  const [status, setStatus] = useState<ConstructionStatus>((pick("construction_status", "under_construction") as ConstructionStatus) || "under_construction");
  const [price, setPrice] = useState(pick("price"));
  const [amenities, setAmenities] = useState<string[]>(project?.amenities ?? []);
  const [keep, setKeep] = useState<string[]>(project?.media.map((m) => m.id) ?? []);
  const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
  const [clientError, setClientError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Keep the real <input type=file> in sync with our preview list
  // (also after React resets the form when the action returns errors).
  useEffect(() => {
    if (!fileInput.current) return;
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f.file));
    fileInput.current.files = dt.files;
  }, [files, state]);

  const types = propertyTypes.filter((t) => t.segment === segment);
  const needsRera = status === "under_construction";
  const photoCount = keep.length + files.length;
  const priceNum = Number(price);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = [...list].filter((f) => f.type.startsWith("image/"));
    setFiles((cur) => [...cur, ...incoming.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, MAX_PHOTOS - keep.length));
  };

  return (
    <form
      action={action}
      className="space-y-6"
      onSubmit={(ev) => {
        if (photoCount === 0) {
          ev.preventDefault();
          setClientError("Add at least one photo — listings with photos get far more enquiries.");
          document.getElementById("step-4")?.scrollIntoView({ behavior: "smooth" });
        } else setClientError(null);
      }}
    >
      {project && <input type="hidden" name="project_id" value={project.id} />}
      {keep.map((id) => (
        <input key={id} type="hidden" name="keep_media" value={id} />
      ))}

      {(state.message || clientError) && <FormAlert>{clientError ?? state.message}</FormAlert>}
      {project?.status === "verified" && (
        <FormAlert tone="info">
          This property is live. Changing the price, location, type or MahaRERA number will send it back to our team for a quick check. Description and photo changes go live straight away.
        </FormAlert>
      )}
      {project?.status === "rejected" && project.rejection_reason && (
        <FormAlert>Our team asked for changes: {project.rejection_reason}</FormAlert>
      )}

      <Section n={1} title="What are you listing?" hint="Pick the options that fit best.">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="I want to">
            <Toggle name="purpose" value={purpose} onChange={setPurpose} options={[["sale", "Sell"], ["rent", "Rent out"]]} />
          </Field>
          <Field label="Property is">
            <Toggle name="segment" value={segment} onChange={setSegment} options={[["residential", "Residential"], ["commercial", "Commercial"]]} />
          </Field>
          <Field label="Category" htmlFor="category" error={e.category}>
            <select
              id="category"
              name="category"
              className="input"
              value={category}
              onChange={(ev) => {
                const c = ev.target.value as ListingCategory;
                setCategory(c);
                setStatus(CATEGORY_TO_STATUS[c]);
              }}
            >
              {(Object.keys(CATEGORY_LABELS) as ListingCategory[]).map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </Field>
          <Field label="Construction status" htmlFor="construction_status" error={e.construction_status} hint="We fill this from the category — change it if needed.">
            <select id="construction_status" name="construction_status" className="input" value={status} onChange={(ev) => setStatus(ev.target.value as ConstructionStatus)}>
              <option value="under_construction">Under construction</option>
              <option value="ready">Ready</option>
              <option value="resale">Resale</option>
            </select>
          </Field>
          <Field label="Property type" htmlFor="property_type_id" error={e.property_type_id}>
            <select id="property_type_id" name="property_type_id" className="input" defaultValue={pick("property_type_id")} key={segment} required aria-invalid={!!e.property_type_id}>
              <option value="">Choose a type</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Name of the property" htmlFor="title" error={e.title} hint="e.g. “Sunrise Residency” or “2 BHK near Virar station”">
            <input id="title" name="title" className="input" defaultValue={pick("title")} required minLength={5} aria-invalid={!!e.title} />
          </Field>
        </div>
      </Section>

      <Section n={2} title="Where is it?" hint="We only list between Mira Road and Dahanu Road.">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="Area" htmlFor="area_id" error={e.area_id}>
            <select id="area_id" name="area_id" className="input" defaultValue={pick("area_id")} required aria-invalid={!!e.area_id}>
              <option value="">Choose an area</option>
              {AREA_ZONES.map((z) => (
                <optgroup key={z.zone} label={z.zone}>
                  {areas.filter((a) => a.zone === z.zone && a.is_active).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </optgroup>
              ))}
              {areas.filter((a) => !AREA_ZONES.some((z) => z.zone === a.zone) && a.is_active).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Street or landmark" htmlFor="address_line" error={e.address_line} hint="Buyers see this. No flat number needed.">
            <input id="address_line" name="address_line" className="input" defaultValue={pick("address_line")} required minLength={5} placeholder="e.g. Near Hatkesh Udyog Nagar" aria-invalid={!!e.address_line} />
          </Field>
        </div>
      </Section>

      <Section n={3} title="Size and price">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Field label="Size" htmlFor="configuration" error={e.configuration}>
            <select id="configuration" name="configuration" className="input" defaultValue={pick("configuration", segment === "commercial" ? "Not applicable" : "")} required>
              <option value="">Choose</option>
              {CONFIGURATIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Carpet area (sq ft)" htmlFor="carpet_area_sqft" error={e.carpet_area_sqft}>
            <input id="carpet_area_sqft" name="carpet_area_sqft" type="number" min={1} inputMode="numeric" className="input" defaultValue={pick("carpet_area_sqft")} required aria-invalid={!!e.carpet_area_sqft} />
          </Field>
          <Field
            label={purpose === "rent" ? "Monthly rent (₹)" : "Total price (₹)"}
            htmlFor="price"
            error={e.price}
            hint={priceNum > 0 ? <span className="font-semibold text-brand-green">= {formatPrice(priceNum, purpose)}{purpose === "rent" ? " a month" : ""}</span> : "Type the full amount, e.g. 8500000"}
          >
            <input id="price" name="price" type="number" min={1} inputMode="numeric" className="input" value={price} onChange={(ev) => setPrice(ev.target.value)} required aria-invalid={!!e.price} />
          </Field>
        </div>

        {needsRera && (
          <div className="mt-6 grid grid-cols-1 animate-fade-up gap-5 rounded-2xl border border-brand-gold/40 bg-brand-gold-50/60 p-5 md:grid-cols-2">
            <div className="flex gap-3 md:col-span-2">
              <ShieldCheck className="h-5 w-5 shrink-0 text-[#8a6100]" strokeWidth={1.8} />
              <p className="text-sm text-[#6b4c00]">
                <strong>MahaRERA number is required</strong> for under-construction projects. We show it on your listing so buyers can trust it.
              </p>
            </div>
            <Field label="MahaRERA registration number" htmlFor="maharera_no" error={e.maharera_no} hint="Starts with P99000… (P99 followed by 9 digits)">
              <input
                id="maharera_no"
                name="maharera_no"
                className="input uppercase tracking-wider"
                defaultValue={pick("maharera_no")}
                required
                pattern="[Pp]99[0-9]{9}"
                title="P99 followed by 9 digits, e.g. P99000012345"
                placeholder="P99000012345"
                aria-invalid={!!e.maharera_no}
              />
            </Field>
            <Field label="Expected possession" htmlFor="possession_date" optional error={e.possession_date}>
              <input id="possession_date" name="possession_date" type="date" className="input" defaultValue={pick("possession_date")} />
            </Field>
          </div>
        )}
      </Section>

      <Section n={4} title="Photos" hint={`Add 1 to ${MAX_PHOTOS} clear photos. The first one is the cover.`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {project?.media.map((m) => {
            const kept = keep.includes(m.id);
            return (
              <div key={m.id} className={`group relative aspect-[4/3] overflow-hidden rounded-xl bg-sand ${kept ? "" : "opacity-40 grayscale"}`}>
                <Image src={m.url} alt="" fill sizes="200px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => setKeep((k) => (kept ? k.filter((x) => x !== m.id) : [...k, m.id]))}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink shadow"
                  aria-label={kept ? "Remove photo" : "Keep photo"}
                >
                  {kept ? <Trash2 className="h-4 w-4" strokeWidth={1.8} /> : <Undo2 className="h-4 w-4" strokeWidth={1.8} />}
                </button>
              </div>
            );
          })}
          {files.map((f, i) => (
            <div key={f.url} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-sand">
              {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
              <img src={f.url} alt="" className="h-full w-full object-cover" />
              {i === 0 && keep.length === 0 && <span className="chip absolute bottom-2 left-2 bg-brand-green text-white">Cover</span>}
              <button
                type="button"
                onClick={() => setFiles((cur) => cur.filter((x) => x.url !== f.url))}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink shadow"
                aria-label="Remove photo"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
          ))}
          {photoCount < MAX_PHOTOS && (
            <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-green/30 bg-brand-green-50/50 text-sm font-semibold text-brand-green transition hover:border-brand-green hover:bg-brand-green-50">
              <ImagePlus className="h-7 w-7" strokeWidth={1.4} />
              Add photos
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(ev) => { addFiles(ev.target.files); ev.target.value = ""; }} />
            </label>
          )}
        </div>
        <input ref={fileInput} type="file" name="photos" multiple className="hidden" tabIndex={-1} aria-hidden="true" />
        <p className={e.photos ? "field-error" : "hint"}>{e.photos ?? `${photoCount} of ${MAX_PHOTOS} photos · JPG, PNG or WebP, up to 5 MB each`}</p>
      </Section>

      <Section n={5} title="Describe it" hint="A few honest lines help buyers decide to call.">
        <Field label="Description" htmlFor="description" error={e.description}>
          <textarea
            id="description"
            name="description"
            rows={5}
            className="input"
            defaultValue={pick("description")}
            required
            minLength={30}
            placeholder="What makes it special? Floor, view, distance to station, society facilities…"
            aria-invalid={!!e.description}
          />
        </Field>
        <fieldset className="mt-6">
          <legend className="label">Amenities & nearby <span className="font-normal text-muted">(tap all that apply)</span></legend>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => {
              const on = amenities.includes(a);
              return (
                <label key={a} className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition ${on ? "border-brand-green bg-brand-green text-white" : "border-line bg-paper text-ink-soft hover:border-brand-green/40"}`}>
                  <input type="checkbox" name="amenities" value={a} checked={on} onChange={() => setAmenities((cur) => (on ? cur.filter((x) => x !== a) : [...cur, a]))} className="sr-only" />
                  {on && <Check className="h-3.5 w-3.5" strokeWidth={2.6} />}
                  {a}
                </label>
              );
            })}
          </div>
        </fieldset>
      </Section>

      <div className="sticky bottom-4 z-10 flex flex-col items-center gap-3 rounded-2xl border border-line bg-paper/95 p-4 shadow-pop backdrop-blur sm:flex-row sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <Info className="h-4 w-4 text-brand-gold" strokeWidth={1.8} />
          {project?.status === "verified" ? "Minor edits go live right away." : "Our team will check it before it goes live — usually within a day."}
        </p>
        <SubmitButton className="btn btn-primary btn-lg w-full sm:w-auto" pendingText="Saving…">
          {project ? "Save changes" : "Submit for review"}
        </SubmitButton>
      </div>
    </form>
  );
}
