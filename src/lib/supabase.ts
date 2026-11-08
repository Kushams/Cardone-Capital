import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client (Phase 1 of docs/SUPABASE-CLOUDFLARE-PLAN.md).
 * Uses the SERVICE ROLE key, which bypasses RLS — RLS is enabled deny-by-default
 * on every table, and per-client access is enforced in the app layer (session ->
 * client_id scoping on every query), exactly as it was with the SQLite build.
 * NEVER import this from a client component: the service-role key is a secret.
 */
let cached: SupabaseClient | null = null;

export const supabaseConfigured = () => !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export function supabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.local / platform secrets)");
  cached = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return cached;
}

/** Unwrap a PostgREST result or throw with the provider message. */
export function must<T>(r: { data: T; error: { message: string } | null }): T {
  if (r.error) throw new Error("Supabase: " + r.error.message);
  return r.data;
}
