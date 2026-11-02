import { must, supabase } from "@/lib/supabase";
import { readPortalFile } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { documentsFor } from "@/lib/docviews";
import { listTemplates } from "@/lib/docs";
import { buildZip, type ZipEntry } from "@/lib/zip";

/** Download All (audit item 5): one ZIP of everything in the client's All Documents
 * list — shared masters, their executed copies and their own uploads. */
export async function GET() {
  const u = await getCurrentUser();
  if (!u) return new Response("Unauthorized", { status: 401 });
  const { all } = await documentsFor(u.clientId);
  const tplPath = new Map((await listTemplates()).map((t) => [t.id, t.path as string]));
  const inst = must(await supabase().from("document_instances").select("id, executed_file_path, generated_file_path").eq("client_id", u.clientId)) as any[];
  const instPath = new Map(inst.map((r) => [r.id, (r.executed_file_path ?? r.generated_file_path) as string | null]));
  const ups = must(await supabase().from("client_uploads").select("id, file_path").eq("client_id", u.clientId)) as any[];
  const upPath = new Map(ups.map((r) => [r.id, r.file_path as string]));

  const used = new Set<string>();
  const entries: ZipEntry[] = [];
  for (const row of all) {
    const kind = row.id[0];
    const numId = Number(row.id.slice(1));
    const rel = kind === "t" ? tplPath.get(numId) : kind === "i" ? instPath.get(numId) : kind === "u" ? upPath.get(numId) : null;
    if (!rel) continue;
    let name = row.name.replace(/[\\/:*?"<>|]/g, "-").trim();
    const ext = rel.split(".").pop() ?? "pdf";
    if (!name.toLowerCase().endsWith("." + ext.toLowerCase())) name += "." + ext;
    let final = name;
    for (let n = 2; used.has(final.toLowerCase()); n++) final = name.replace(/(\.[^.]+)$/, ` (${n})$1`);
    used.add(final.toLowerCase());
    try {
      entries.push({ name: final, data: await readPortalFile(rel) });
    } catch { /* a missing file must not sink the whole archive */ }
  }
  const zip = buildZip(entries);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="Cardone-Capital-Documents-${stamp}.zip"`,
      "Cache-Control": "private, no-store",
    },
  });
}
