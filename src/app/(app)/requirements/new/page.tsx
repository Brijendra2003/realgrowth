import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { RequirementForm, type RequirementDraft } from "@/components/requirement/requirement-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/page-title";
import { requireBuyer } from "@/lib/auth";
import { ALL_BUDGETS, CONFIGURATIONS, MAX_REQUIREMENTS, type Purpose } from "@/lib/constants";
import { slugify } from "@/lib/format";
import { getBuyerRequirements, getReferenceData } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Post a requirement" };

export default async function NewRequirementPage({ searchParams }: PageProps<"/requirements/new">) {
  const sp = await searchParams;
  const s = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][]).toString();
  const user = await requireBuyer(`/requirements/new${qs ? `?${qs}` : ""}`);
  const [{ allAreas, propertyTypes }, existing] = await Promise.all([getReferenceData(), getBuyerRequirements(user.id)]);

  if (existing.length >= MAX_REQUIREMENTS) {
    return (
      <EmptyState
        icon={ClipboardList}
        title={`You already have ${MAX_REQUIREMENTS} requirements`}
        body="Delete one you no longer need, or edit an existing one."
        action={<Link href="/requirements" className="btn btn-primary">My requirements</Link>}
      />
    );
  }

  // Start from the search the buyer just ran, when there was one.
  const budget = ALL_BUDGETS.find((b) => b.value === s("budget"));
  const type = propertyTypes.find((t) => t.slug === s("type"));
  const purpose: Purpose = budget ? (budget.value.startsWith("r-") ? "rent" : "sale") : s("purpose") === "rent" ? "rent" : "sale";
  const unit = purpose === "sale" ? 1_00_000 : 1;
  const draft: RequirementDraft = {
    purpose,
    segment: type?.segment ?? (s("segment") === "commercial" ? "commercial" : "residential"),
    area_ids: allAreas.filter((a) => a.is_active && (slugify(a.name) === s("area") || slugify(a.zone) === s("zone"))).map((a) => a.id),
    property_type_ids: type ? [type.id] : [],
    configurations: CONFIGURATIONS.includes(s("config") ?? "") ? [s("config")!] : [],
    categories: [],
    budget_min: budget?.min ? String(budget.min / unit) : "",
    budget_max: budget?.max ? String(budget.max / unit) : "",
    min_carpet_sqft: "",
    note: "",
  };

  return (
    <div className="max-w-4xl">
      <PageTitle
        eyebrow="Post a requirement"
        title={<>Tell us what you <span className="accent-serif text-brand-green">need.</span></>}
        description="We'll score every verified property against it and show the best matches first."
      />
      <RequirementForm draft={draft} areas={allAreas} propertyTypes={propertyTypes} />
    </div>
  );
}
