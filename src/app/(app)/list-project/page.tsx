import type { Metadata } from "next";
import { ProjectForm } from "@/components/project/project-form";
import { PageTitle } from "@/components/ui/page-title";
import { requireLister } from "@/lib/auth";
import { getReferenceData } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Add your property" };

export default async function ListProjectPage() {
  const user = await requireLister("/list-project");
  const { allAreas, propertyTypes } = await getReferenceData();
  return (
    <div className="max-w-4xl">
      <PageTitle
        eyebrow="Add your property"
        title={<>List it in <span className="accent-serif text-brand-green">five short steps.</span></>}
        description="It's free. Our team checks every listing before it goes live, then buyers can call you directly."
      />
      <ProjectForm areas={allAreas} propertyTypes={propertyTypes} role={user.role} />
    </div>
  );
}
