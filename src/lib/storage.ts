import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { supabase, supabaseConfigured } from "./supabase";

/**
 * PDF file storage. Repo-relative paths stay the addressing scheme everywhere
 * ("storage/templates/<folder>/<file>.pdf", "storage/generated/<clientId>/<id>.pdf",
 * "storage/executed/<clientId>/<id>.pdf"); the Supabase Storage object key is the
 * path with the "storage/<bucket>/" prefix stripped, in the bucket of the same name.
 *
 * Local disk is still the dev source of truth: reads try Supabase Storage first
 * when configured and fall back to disk (the masters are uploaded to the
 * `templates` bucket in a later step), and writes always land on disk and are
 * mirrored to Storage best-effort. Nothing outside storage/templates|generated|executed
 * is ever read or written through here — signatures-pending is never touched.
 */
const ROOT = process.cwd();
/** Absolute path for a repo-relative storage path, confined to <cwd>/storage (statically scoped for build tracing). */
function storagePath(rel: string): string {
  const full = path.join(ROOT, "storage", rel.replace(/^storage\//, ""));
  const base = path.join(ROOT, "storage");
  if (full !== base && !full.startsWith(base + path.sep)) throw new Error("path outside storage/: " + rel);
  return full;
}
const BUCKETS = ["templates", "generated", "executed"] as const;
type Bucket = (typeof BUCKETS)[number];

function locate(rel: string): { bucket: Bucket; key: string } | null {
  for (const b of BUCKETS) {
    const prefix = `storage/${b}/`;
    if (rel.startsWith(prefix)) return { bucket: b, key: rel.slice(prefix.length) };
  }
  return null;
}

export async function readPortalFile(rel: string): Promise<Uint8Array> {
  const loc = locate(rel);
  if (loc && supabaseConfigured()) {
    try {
      const { data, error } = await supabase().storage.from(loc.bucket).download(loc.key);
      if (!error && data) return new Uint8Array(await data.arrayBuffer());
    } catch { /* not in Storage (yet) — fall back to local disk */ }
  }
  return new Uint8Array(await readFile(storagePath(rel)));
}

export async function writePortalFile(rel: string, bytes: Uint8Array): Promise<void> {
  const full = storagePath(rel);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
  const loc = locate(rel);
  if (loc && supabaseConfigured()) {
    try {
      const { error } = await supabase().storage.from(loc.bucket).upload(loc.key, bytes, { contentType: "application/pdf", upsert: true });
      if (error) console.error(`storage mirror failed for ${rel}: ${error.message}`);
    } catch (e) {
      console.error(`storage mirror failed for ${rel}:`, e);
    }
  }
}
