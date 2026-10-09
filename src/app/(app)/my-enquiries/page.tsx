import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MessageSquareText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LeadStageChip, ListerBadge } from "@/components/ui/chips";
import { PageTitle } from "@/components/ui/page-title";
import { requireUser } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { getBuyerEnquiries } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "My enquiries" };

export default async function MyEnquiriesPage() {
  const user = await requireUser("/my-enquiries");
  const rows = await getBuyerEnquiries(user.id);
  return (
    <>
      <PageTitle eyebrow="My enquiries" title="Properties you asked about" description="The lister calls you back and updates the status here." />
      {rows.length === 0 ? (
        <EmptyState icon={MessageSquareText} title="No enquiries yet" body="When you send an enquiry, you can follow its progress here." action={<Link href="/projects" className="btn btn-primary">Browse properties</Link>} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table-clean min-w-[44rem]">
            <thead>
              <tr>
                <th>Property</th>
                <th>Lister</th>
                <th>Sent on</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ lead, project }) => (
                <tr key={lead.id}>
                  <td>
                    <Link href={`/projects/${project.slug}`} className="flex items-center gap-3 font-medium hover:text-brand-green">
                      <span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-sand">
                        {project.cover && <Image src={project.cover} alt="" fill sizes="64px" className="object-cover" />}
                      </span>
                      <span>
                        {project.title}
                        <span className="block text-xs font-normal text-muted">{project.area.name} · {formatPrice(project.price, project.purpose)}</span>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <p className="text-sm">{project.lister.company_name ?? project.lister.full_name}</p>
                    <ListerBadge role={project.lister.role} />
                  </td>
                  <td className="text-muted">{formatDate(lead.created_at)}</td>
                  <td><LeadStageChip stage={lead.stage} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
