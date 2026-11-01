import { must, supabase } from "@/lib/supabase";
import { portalDb } from "@/lib/db";
import { readPortalFile } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";
import { generateInstance, packetName } from "@/lib/personalise";

/** A client's OWN per-client document (generated, or executed after signing). Scoped to the logged-in client — never another's. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) return new Response("Unauthorized", { status: 401 });
  const id = Number((await params).id);
  const r = must(await supabase().from("document_instances").select("client_id, generated_file_path, executed_file_path").eq("id", id).maybeSingle()) as any;
  if (!r || r.client_id !== u.clientId) return new Response("Not found", { status: 404 }); // identical response for 'not yours' and 'missing'
  let rel = r.executed_file_path ?? r.generated_file_path;
  if (!rel) rel = await generateInstance(portalDb(), id);
  const { fileName } = await buildInstancePdfName(id);
  const buf = await readPortalFile(rel);
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${fileName.replace(/["\\/]/g, "-")}"`, "Cache-Control": "private, no-store" } });
}
async function buildInstancePdfName(id: number) {
  const r = must(await supabase().from("document_instances").select(`
      document_templates!inner ( display_name, doc_type ),
      commitments!inner ( offerings!inner ( name ) )`).eq("id", id).maybeSingle()) as any;
  return { fileName: packetName(r.document_templates.display_name, r.document_templates.doc_type, Number(/Fund (\d+)/.exec(r.commitments.offerings.name)?.[1] ?? 0) || null) };
}
