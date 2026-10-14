import { CATEGORY_SHORT, CONFIGURATIONS } from "./constants";
import { formatPrice } from "./format";
import type { Area, Project, Requirement } from "./types";

// Scores a live listing against a buyer's requirement (Architecture §3.5).
// Buy vs rent and residential vs commercial must agree; everything else earns
// points, with partial credit for near misses, out of 100.

/** Matches below this are not shown to anyone. */
export const MATCH_THRESHOLD = 50;

export const MATCH_WEIGHTS = { area: 30, budget: 30, type: 20, size: 10, carpet: 5, category: 5 } as const;

export type MatchPart = {
  key: keyof typeof MATCH_WEIGHTS;
  label: string;
  score: number;
  max: number;
  detail: string;
};

export type Match = { percent: number; parts: MatchPart[] };

export type MatchableProject = Pick<
  Project,
  "purpose" | "segment" | "area_id" | "property_type_id" | "configuration" | "price" | "carpet_area_sqft" | "category"
>;

export type MatchableRequirement = Pick<
  Requirement,
  "purpose" | "segment" | "area_ids" | "property_type_ids" | "configurations" | "categories" | "budget_min" | "budget_max" | "min_carpet_sqft"
>;

const SIZES = CONFIGURATIONS.filter((c) => c !== "Not applicable");

/** null when the listing can never suit the buyer (wrong purpose or segment). */
export function scoreMatch(r: MatchableRequirement, p: MatchableProject, areas: Pick<Area, "id" | "zone" | "name">[]): Match | null {
  if (r.purpose !== p.purpose || r.segment !== p.segment) return null;
  const price = Number(p.price);
  const carpet = Number(p.carpet_area_sqft);
  const money = (n: number) => formatPrice(n, p.purpose);
  const parts: MatchPart[] = [];

  // Area: exact area, or another area in the same zone.
  const area = areas.find((a) => a.id === p.area_id);
  const wantedZones = new Set(areas.filter((a) => r.area_ids.includes(a.id)).map((a) => a.zone));
  if (r.area_ids.includes(p.area_id)) {
    parts.push({ key: "area", label: "Location", score: MATCH_WEIGHTS.area, max: MATCH_WEIGHTS.area, detail: `In ${area?.name ?? "a wanted area"}` });
  } else if (area && wantedZones.has(area.zone)) {
    parts.push({ key: "area", label: "Location", score: MATCH_WEIGHTS.area / 2, max: MATCH_WEIGHTS.area, detail: `Nearby: ${area.name} (${area.zone})` });
  } else {
    parts.push({ key: "area", label: "Location", score: 0, max: MATCH_WEIGHTS.area, detail: `${area?.name ?? "Another area"}, outside the areas wanted` });
  }

  // Budget: inside the range is full marks; a little over still counts.
  const max = Number(r.budget_max);
  const min = r.budget_min === null ? null : Number(r.budget_min);
  let budget: number;
  let budgetDetail: string;
  if (price <= max && (min === null || price >= min)) {
    budget = MATCH_WEIGHTS.budget;
    budgetDetail = `${money(price)}, within budget`;
  } else if (price < (min ?? 0)) {
    budget = 25;
    budgetDetail = `${money(price)}, below the budget range`;
  } else {
    const over = (price - max) / max;
    budget = over <= 0.05 ? 25 : over <= 0.1 ? 20 : over <= 0.2 ? 10 : 0;
    budgetDetail = `${money(price)}, ${Math.max(1, Math.round(over * 100))}% over budget`;
  }
  parts.push({ key: "budget", label: "Budget", score: budget, max: MATCH_WEIGHTS.budget, detail: budgetDetail });

  // Property type
  const typeOk = r.property_type_ids.length === 0 || r.property_type_ids.includes(p.property_type_id);
  parts.push({
    key: "type",
    label: "Property type",
    score: typeOk ? MATCH_WEIGHTS.type : 0,
    max: MATCH_WEIGHTS.type,
    detail: typeOk ? "Type wanted" : "A different property type",
  });

  // Size (BHK): one step away earns half.
  let size: number = MATCH_WEIGHTS.size;
  let sizeDetail = p.configuration === "Not applicable" ? "Any size" : p.configuration;
  if (r.configurations.length && !r.configurations.includes(p.configuration)) {
    const i = SIZES.indexOf(p.configuration);
    const near = i >= 0 && r.configurations.some((c) => Math.abs(SIZES.indexOf(c) - i) === 1);
    size = near ? MATCH_WEIGHTS.size / 2 : 0;
    sizeDetail = near ? `${p.configuration}, one size off` : `${p.configuration === "Not applicable" ? "Size not given" : p.configuration}, not the size wanted`;
  }
  parts.push({ key: "size", label: "Size", score: size, max: MATCH_WEIGHTS.size, detail: sizeDetail });

  // Carpet area
  const minCarpet = r.min_carpet_sqft === null ? null : Number(r.min_carpet_sqft);
  const carpetScore = minCarpet === null || carpet >= minCarpet ? MATCH_WEIGHTS.carpet : carpet >= minCarpet * 0.9 ? 3 : 0;
  parts.push({
    key: "carpet",
    label: "Carpet area",
    score: carpetScore,
    max: MATCH_WEIGHTS.carpet,
    detail: `${carpet.toLocaleString("en-IN")} sq ft${minCarpet !== null && carpet < minCarpet ? ` (wanted ${minCarpet.toLocaleString("en-IN")}+)` : ""}`,
  });

  // Category (new project / ready to move / resale)
  const catOk = r.categories.length === 0 || r.categories.includes(p.category);
  parts.push({
    key: "category",
    label: "Category",
    score: catOk ? MATCH_WEIGHTS.category : 0,
    max: MATCH_WEIGHTS.category,
    detail: CATEGORY_SHORT[p.category],
  });

  return { percent: Math.round(parts.reduce((s, x) => s + x.score, 0)), parts };
}

/** Plain-language summary of a requirement, e.g. "2 BHK flat to buy in Virar East, Virar West · up to ₹70 L". */
export function describeRequirement(
  r: MatchableRequirement,
  ref: { areas: Pick<Area, "id" | "name">[]; propertyTypes: { id: number; name: string }[] },
) {
  const types = r.property_type_ids.map((id) => ref.propertyTypes.find((t) => t.id === id)?.name).filter(Boolean);
  const areaNames = r.area_ids.map((id) => ref.areas.find((a) => a.id === id)?.name).filter(Boolean) as string[];
  const what = [r.configurations.join(" / "), types.length ? types.join(" / ") : r.segment === "commercial" ? "Commercial property" : "Home"]
    .filter(Boolean)
    .join(" ");
  const budget = r.budget_min
    ? `${formatPrice(Number(r.budget_min), r.purpose)} – ${formatPrice(Number(r.budget_max), r.purpose)}`
    : `up to ${formatPrice(Number(r.budget_max), r.purpose)}`;
  return {
    title: `${what} to ${r.purpose === "rent" ? "rent" : "buy"}`,
    areas: areaNames.length > 3 ? `${areaNames.slice(0, 3).join(", ")} +${areaNames.length - 3} more` : areaNames.join(", "),
    budget: `${budget}${r.purpose === "rent" ? "/mo" : ""}`,
    categories: r.categories.map((c) => CATEGORY_SHORT[c]).join(", "),
  };
}

/** Colour band for a percentage chip. */
export const matchTone = (percent: number) => (percent >= 85 ? "high" : percent >= 70 ? "good" : "fair");
