import type { Metadata } from "next";
import { Download, Eye, EyeOff } from "lucide-react";
import { toggleAreaAction } from "@/actions/admin";
import { AreaForm } from "@/components/admin/area-form";
import { PageTitle } from "@/components/ui/page-title";
import { requireStaff } from "@/lib/auth";
import { getReferenceData } from "@/lib/queries";

// Reads the session or URL on every request, so navigations may block on the server.
export const instant = false;

export const metadata: Metadata = { title: "Areas & settings" };

export default async function SettingsPage() {
  await requireStaff(["super_admin"]);
  const { allAreas, propertyTypes } = await getReferenceData();
  const zones = [...new Set(allAreas.map((a) => a.zone))];
  return (
    <>
      <PageTitle
        eyebrow="System"
        title="Areas & settings"
        description="The service corridor is a fixed list — listers can only pick from these areas. Hidden areas disappear from forms and search."
        action={<a href="/api/admin/audit-export" className="btn btn-outline"><Download className="h-4 w-4" /> Export audit log (CSV)</a>}
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {zones.map((z) => (
            <section key={z} className="card p-5">
              <h2 className="font-semibold text-brand-green">{z}</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {allAreas.filter((a) => a.zone === z).map((a) => (
                  <li key={a.id}>
                    <form action={toggleAreaAction}>
                      <input type="hidden" name="area_id" value={a.id} />
                      <button
                        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${a.is_active ? "border-line bg-paper hover:border-danger/40" : "border-dashed border-line bg-canvas text-muted line-through hover:border-brand-green"}`}
                        title={a.is_active ? "Hide this area" : "Show this area"}
                      >
                        {a.is_active ? <Eye className="h-3.5 w-3.5 text-brand-green" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {a.name}
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-4 font-semibold">Add an area</h2>
            <AreaForm zones={zones} />
          </section>
          <section className="card p-5">
            <h2 className="font-semibold">Property types</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {propertyTypes.map((t) => (
                <li key={t.id} className="flex justify-between"><span>{t.name}</span><span className="text-xs capitalize text-muted">{t.segment}</span></li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </>
  );
}
