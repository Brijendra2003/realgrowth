import "server-only";
import type { UserRole } from "./constants";
import { sb } from "./supabase";

/**
 * Single audit helper called by every server action (Architecture §12).
 * Best effort: a failed log line must not undo the action it describes.
 */
export async function logActivity(
  actor: { id: string; role: UserRole } | null,
  action: string,
  entity: { type: string; id: string | null },
  metadata: Record<string, unknown> = {},
) {
  const db = await sb();
  const { error } = await db.from("activity_log").insert({
    actor_id: actor?.id ?? null,
    actor_role: actor?.role ?? null,
    action,
    entity_type: entity.type,
    entity_id: entity.id,
    metadata,
  });
  if (error) console.error(`[activity] could not log ${action}: ${error.message}`);
}

export async function notify(userId: string, title: string, body: string, link: string | null = null) {
  const db = await sb();
  const { error } = await db.from("notifications").insert({ user_id: userId, title, body, link });
  if (error) console.error(`[notify] ${error.message}`);
}
