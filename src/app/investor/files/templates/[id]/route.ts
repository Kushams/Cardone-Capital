import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/** Serves a STATIC master as-is (PPM, Operating Agreement, Wire Instructions, memoranda, blank booklets/W-9). Auth required.
 *  Only paths inside storage/templates/ are ever served. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const t = db().prepare("SELECT master_file_path p, display_name n FROM document_templates WHERE id = ?").get(Number(id)) as any;
  if (!t) return new Response("Not found", { status: 404 });
  const full = path.resolve(process.cwd(), t.p);
  if (!full.startsWith(path.resolve(process.cwd(), "storage", "templates") + path.sep)) return new Response("Forbidden", { status: 403 });
  const buf = await readFile(full);
  const name = (t.n.endsWith(".pdf") ? t.n : t.n + ".pdf").replace(/[\/\\"]/g, "-");
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${name}"`, "Cache-Control": "private, no-store" } });
}
