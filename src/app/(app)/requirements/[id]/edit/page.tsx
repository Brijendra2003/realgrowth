import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequirementForm } from "@/components/requirement/requirement-form";
import { PageTitle } from "@/components/ui/page-title";
import { requireBuyer } from "@/lib/auth";
import { getOwnRequirement, getReferenceData } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Edit requirement" };

export default async function EditRequirementPage({ params }: PageProps<"/requirements/[id]/edit">) {
  const { id } = await params;
  const user = await requireBuyer(`/requirements/${id}/edit`);
  const [r, { allAreas, propertyTypes }] = await Promise.all([getOwnRequirement(user.id, id), getReferenceData()]);
  if (!r) notFound();
  const unit = r.purpose === "sale" ? 1_00_000 : 1;

  return (
    <div className="max-w-4xl">
      <PageTitle eyebrow="Edit requirement" title="Change what you're looking for" description="Matches update as soon as you save." />
      <RequirementForm
        id={r.id}
        areas={allAreas}
        propertyTypes={propertyTypes}
        draft={{
          purpose: r.purpose,
          segment: r.segment,
          area_ids: r.area_ids,
          property_type_ids: r.property_type_ids,
          configurations: r.configurations,
          categories: r.categories,
          budget_min: r.budget_min === null ? "" : String(r.budget_min / unit),
          budget_max: String(r.budget_max / unit),
          min_carpet_sqft: r.min_carpet_sqft === null ? "" : String(r.min_carpet_sqft),
          note: r.note,
        }}
      />
    </div>
  );
}
