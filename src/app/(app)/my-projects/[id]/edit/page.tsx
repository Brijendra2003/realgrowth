import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProjectForm } from "@/components/project/project-form";
import { ProjectStatusChip } from "@/components/ui/chips";
import { PageTitle } from "@/components/ui/page-title";
import { requireLister } from "@/lib/auth";
import { getOwnProject, getReferenceData } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Edit property" };

export default async function EditProjectPage({ params }: PageProps<"/my-projects/[id]/edit">) {
  const { id } = await params;
  const user = await requireLister(`/my-projects/${id}/edit`);
  const [project, { allAreas, propertyTypes }] = await Promise.all([getOwnProject(user.id, id), getReferenceData()]);
  if (!project) notFound();

  return (
    <div className="max-w-4xl">
      <Link href="/my-projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> My properties
      </Link>
      <PageTitle
        eyebrow={project.code}
        title={project.title}
        description={<span className="flex items-center gap-2">Current status: <ProjectStatusChip status={project.status} /></span>}
      />
      <ProjectForm areas={allAreas} propertyTypes={propertyTypes} project={project} />
    </div>
  );
}
