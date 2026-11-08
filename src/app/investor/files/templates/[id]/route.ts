import path from "node:path";
import { must, supabase } from "@/lib/supabase";
import { readPortalFile } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";

/** Serves a STATIC master as-is (PPM, Operating Agreement, Wire Instructions, memoranda, blank booklets/W-9). Auth required.
 *  Only paths inside storage/templates/ are ever served (bytes come from Supabase Storage when uploaded, else local disk). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getCurrentUser())) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const t = must(await supabase().from("document_templates").select("master_file_path, display_name").eq("id", Number(id)).maybeSingle()) as any;
  if (!t) return new Response("Not found", { status: 404 });
  const full = path.resolve(process.cwd(), t.master_file_path);
  if (!full.startsWith(path.resolve(process.cwd(), "storage", "templates") + path.sep)) return new Response("Forbidden", { status: 403 });
  const buf = await readPortalFile(t.master_file_path);
  const name = (t.display_name.endsWith(".pdf") ? t.display_name : t.display_name + ".pdf").replace(/[\/\\"]/g, "-");
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${name}"`, "Cache-Control": "private, no-store" } });
}
