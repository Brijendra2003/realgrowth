import { getSessionUser } from "@/lib/auth";
import { getActivityForExport } from "@/lib/queries";

/** Super-admin only: full activity log as CSV. */
export async function GET() {
  const user = await getSessionUser();
  if (user?.role !== "super_admin") return new Response("Forbidden", { status: 403 });
  const entries = await getActivityForExport();
  // Quote every cell, and neutralise values a spreadsheet would run as a formula.
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return `"${(/^[=+\-@\t\r]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
  };
  const lines = [
    ["id", "created_at", "actor_id", "actor_name", "actor_role", "action", "entity_type", "entity_id", "metadata"].join(","),
    ...entries.map((e) =>
      [e.id, e.created_at, e.actor_id, e.actor, e.actor_role, e.action, e.entity_type, e.entity_id, JSON.stringify(e.metadata)].map(esc).join(","),
    ),
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="realgrowth-audit.csv"`, "Cache-Control": "no-store" },
  });
}
