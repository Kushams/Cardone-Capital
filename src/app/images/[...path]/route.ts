import { readFile } from "node:fs/promises";
import path from "node:path";

/** Serves the real portal images from the project's images/ folder (delivered as-is). Public on purpose: the login page logo needs it. */
const ROOT = path.resolve(process.cwd(), "images");
const TYPES: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const rel = (await params).path.join("/");
  const full = path.resolve(ROOT, rel);
  const type = TYPES[path.extname(full).toLowerCase()];
  if (!type || !full.startsWith(ROOT + path.sep)) return new Response("Not found", { status: 404 }); // images only; no path traversal
  try {
    return new Response(new Uint8Array(await readFile(full)), { headers: { "Content-Type": type, "Cache-Control": "public, max-age=3600" } });
  } catch { return new Response("Not found", { status: 404 }); }
}
