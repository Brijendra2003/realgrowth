import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProjectCard } from "@/components/project/project-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageTitle } from "@/components/ui/page-title";
import { requireUser } from "@/lib/auth";
import { getSavedProjects } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Saved" };

export default async function SavedPage() {
  const user = await requireUser("/saved");
  const projects = await getSavedProjects(user.id);
  return (
    <>
      <PageTitle eyebrow="Saved" title="Your shortlist" description="Tap the heart on any property to save it here." />
      {projects.length === 0 ? (
        <EmptyState icon={Heart} title="Nothing saved yet" action={<Link href="/projects" className="btn btn-primary">Browse properties</Link>} />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p} saved />
          ))}
        </div>
      )}
    </>
  );
}
