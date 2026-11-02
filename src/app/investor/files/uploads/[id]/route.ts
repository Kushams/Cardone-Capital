import { must, supabase } from "@/lib/supabase";
import { readPortalFile } from "@/lib/storage";
import { getCurrentUser } from "@/lib/auth";

/** A client's OWN uploaded file. Scoped to the logged-in client — never another's. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) return new Response("Unauthorized", { status: 401 });
  const id = Number((await params).id);
  const r = must(await supabase().from("client_uploads").select("client_id, file_path, original_name, content_type").eq("id", id).maybeSingle()) as any;
  if (!r || r.client_id !== u.clientId) return new Response("Not found", { status: 404 }); // identical for 'not yours' and 'missing'
  const buf = await readPortalFile(r.file_path);
  const name = String(r.original_name).replace(/["\\/]/g, "-");
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": r.content_type, "Content-Disposition": `inline; filename="${name}"`, "Cache-Control": "private, no-store" } });
}
