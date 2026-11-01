import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { generateInstance, buildInstancePdf } from "@/lib/personalise";

/** A client's OWN per-client document (generated, or executed after signing). Scoped to the logged-in client — never another's. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) return new Response("Unauthorized", { status: 401 });
  const id = Number((await params).id);
  const r = db().prepare("SELECT client_id c, generated_file_path g, executed_file_path x FROM document_instances WHERE id = ?").get(id) as any;
  if (!r || r.c !== u.clientId) return new Response("Not found", { status: 404 }); // identical response for 'not yours' and 'missing'
  let rel = r.x ?? r.g;
  if (!rel) rel = await generateInstance(db(), id);
  const { fileName } = await buildInstancePdfName(id);
  const buf = await readFile(path.join(process.cwd(), rel));
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${fileName.replace(/["\\/]/g, "-")}"`, "Cache-Control": "private, no-store" } });
}
async function buildInstancePdfName(id: number) {
  const r = db().prepare(`SELECT t.display_name n, t.doc_type dt, o.name o FROM document_instances di JOIN document_templates t ON t.id = di.template_id JOIN commitments c ON c.id = di.commitment_id JOIN offerings o ON o.id = c.offering_id WHERE di.id = ?`).get(id) as any;
  const { packetName } = await import("@/lib/personalise");
  return { fileName: packetName(r.n, r.dt, Number(/Fund (\d+)/.exec(r.o)?.[1] ?? 0) || null) };
}
void buildInstancePdf;
