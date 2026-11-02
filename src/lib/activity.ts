import { supabase } from "./supabase";

// Activity log (audit item 14): one row per meaningful action, by staff or
// by a client, so the operator console can show who did what, when.
// Logging is best-effort: it must never break the action it records.

export type ActorType = "OPERATOR" | "CLIENT" | "SYSTEM";

export interface ActivityEvent {
  id: number;
  actor_type: ActorType;
  actor_email: string | null;
  client_email: string | null;
  action: string;
  detail: string | null;
  created_at: string;
}

export async function logActivity(e: {
  actorType: ActorType;
  actorEmail?: string | null;
  clientEmail?: string | null;
  action: string;
  detail?: string | null;
}): Promise<void> {
  try {
    await supabase().from("activity_events").insert({
      actor_type: e.actorType,
      actor_email: e.actorEmail ?? null,
      client_email: e.clientEmail ?? null,
      action: e.action,
      detail: e.detail ?? null,
    });
  } catch {
    // swallow: the audit trail must never take the site down
  }
}

export async function listActivity(limit = 150): Promise<ActivityEvent[]> {
  const { data } = await supabase()
    .from("activity_events")
    .select("id, actor_type, actor_email, client_email, action, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ActivityEvent[];
}

export async function listClientActivity(clientEmail: string, limit = 50): Promise<ActivityEvent[]> {
  const { data } = await supabase()
    .from("activity_events")
    .select("id, actor_type, actor_email, client_email, action, detail, created_at")
    .eq("client_email", clientEmail)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ActivityEvent[];
}
