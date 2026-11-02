import { supabase } from "./supabase";

/** Login protection (audit item 11): MAX_FAILURES failed attempts inside a
 * 15-minute window lock the key for 15 minutes. Keys: `investor:<email>`,
 * `operator:<email>`, and `operator-ip:<ip>` for the shared recovery passphrase
 * (no account name to key on there). Best-effort by design: if the store is
 * unreachable, sign-in still works — availability beats a hard fail-closed here,
 * and every lock that does engage is written to the activity log by the caller. */
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

export async function checkLock(key: string): Promise<{ locked: boolean; retryMinutes: number }> {
  try {
    const { data } = await supabase().from("login_attempts").select("locked_until").eq("key", key).maybeSingle();
    const until = (data as any)?.locked_until ? new Date((data as any).locked_until).getTime() : 0;
    if (until > Date.now()) return { locked: true, retryMinutes: Math.max(1, Math.ceil((until - Date.now()) / 60000)) };
  } catch { /* fail open */ }
  return { locked: false, retryMinutes: 0 };
}

/** Records one failed attempt; returns true when this failure engaged the lock. */
export async function recordFailure(key: string): Promise<boolean> {
  try {
    const sb = supabase();
    const { data } = await sb.from("login_attempts").select("failures, window_started_at, locked_until").eq("key", key).maybeSingle();
    const now = Date.now();
    const row = data as any;
    const windowFresh = row && now - new Date(row.window_started_at).getTime() < WINDOW_MS;
    const failures = (windowFresh ? row.failures : 0) + 1;
    const lock = failures >= MAX_FAILURES;
    await sb.from("login_attempts").upsert({
      key,
      failures,
      window_started_at: windowFresh ? row.window_started_at : new Date(now).toISOString(),
      locked_until: lock ? new Date(now + LOCK_MS).toISOString() : row?.locked_until ?? null,
      updated_at: new Date(now).toISOString(),
    });
    return lock;
  } catch {
    return false;
  }
}

export async function recordSuccess(key: string): Promise<void> {
  try {
    await supabase().from("login_attempts").delete().eq("key", key);
  } catch { /* best-effort */ }
}

export function lockMessage(retryMinutes: number): string {
  return `Too many failed attempts. For security, sign-in is paused for about ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"} — please try again later.`;
}
