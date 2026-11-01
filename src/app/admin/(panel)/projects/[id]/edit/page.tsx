import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { staffSaveProjectAction } from "@/actions/projects";
import { ProjectForm } from "@/components/project/project-form";
import { ListerBadge, ProjectStatusChip } from "@/components/ui/chips";
import { PageTitle } from "@/components/ui/page-title";
import { requireStaff } from "@/lib/auth";
import { getProjectForStaff, getReferenceData } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Edit property" };

export default async function AdminEditProjectPage({ params }: PageProps<"/admin/projects/[id]/edit">) {
  const { id } = await params;
  await requireStaff();
  const [project, { allAreas, propertyTypes }] = await Promise.all([getProjectForStaff(id), getReferenceData()]);
  if (!project) notFound();

  return (
    <div className="max-w-4xl">
      <Link href="/admin/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All projects
      </Link>
      <PageTitle
        eyebrow={project.code}
        title={project.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ProjectStatusChip status={project.status} />
            Listed by {project.lister.company_name ?? project.lister.full_name}
            <ListerBadge role={project.lister.role} />
          </span>
        }
      />
      <ProjectForm areas={allAreas} propertyTypes={propertyTypes} project={project} staffAction={staffSaveProjectAction} />
    </div>
  );
}
