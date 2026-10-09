import { getSessionUser } from "@/lib/auth";
import { readDb } from "@/lib/db";

/** Super-admin only: full activity log as CSV. */
export async function GET() {
  const user = await getSessionUser();
  if (user?.role !== "super_admin") return new Response("Forbidden", { status: 403 });
  const db = await readDb();
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [
    ["id", "created_at", "actor_id", "actor_name", "actor_role", "action", "entity_type", "entity_id", "metadata"].join(","),
    ...db.activity_log.map((e) =>
      [e.id, e.created_at, e.actor_id, db.profiles.find((p) => p.id === e.actor_id)?.full_name, e.actor_role, e.action, e.entity_type, e.entity_id, JSON.stringify(e.metadata)]
        .map(esc)
        .join(","),
    ),
  ];
  return new Response(rows.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="realgrowth-audit.csv"` },
  });
}
