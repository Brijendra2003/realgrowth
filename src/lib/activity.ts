import "server-only";
import type { UserRole } from "./constants";
import { nowIso, uid } from "./db";
import type { Database } from "./types";

/**
 * Single audit helper called by every server action (Architecture §12).
 * Runs inside a `mutate()` callback so the log entry commits with the change.
 */
export function logActivity(
  db: Database,
  actor: { id: string; role: UserRole } | null,
  action: string,
  entity: { type: string; id: string | null },
  metadata: Record<string, unknown> = {},
) {
  const id = (db.activity_log.at(-1)?.id ?? 0) + 1;
  db.activity_log.push({
    id,
    actor_id: actor?.id ?? null,
    actor_role: actor?.role ?? null,
    action,
    entity_type: entity.type,
    entity_id: entity.id,
    metadata,
    created_at: nowIso(),
  });
}

export function notify(db: Database, userId: string, title: string, body: string, link: string | null = null) {
  db.notifications.push({ id: uid(), user_id: userId, title, body, link, read_at: null, created_at: nowIso() });
}
