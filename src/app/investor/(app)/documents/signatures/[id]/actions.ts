"use server";
import { redirect } from "next/navigation";
import { must, supabase } from "@/lib/supabase";
import { portalDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { executeInstance } from "@/lib/personalise";

async function owned(pageId: number) {
  const u = await requireUser(`/investor/documents/signatures/${pageId}`);
  const r = must(await supabase().from("signature_requests")
    .select("id, status, document_instance_id, document_instances!inner ( client_id )")
    .eq("signature_page_id", pageId).eq("document_instances.client_id", u.clientId).maybeSingle()) as any;
  if (!r) redirect("/investor/documents/signatures");
  return { u, r: { id: r.id, status: r.status, inst: r.document_instance_id } };
}

/** Consent step: records "Agree" only. Nothing is signed here. */
export async function agreeAction(pageId: number) {
  const { r } = await owned(pageId);
  if (r.status === "PENDING") must(await supabase().from("signature_requests").update({ status: "AGREED" }).eq("id", r.id));
  redirect(`/investor/documents/signatures/${pageId}`);
}

/** STUB signing step: typed-name capture; produces the client's executed copy. */
export async function signAction(pageId: number, form: FormData) {
  const { u, r } = await owned(pageId);
  const name = String(form.get("signature") ?? "").trim();
  if (r.status !== "AGREED" || name.length < 2 || form.get("confirm") !== "on") redirect(`/investor/documents/signatures/${pageId}?error=1`);
  await executeInstance(portalDb(), r.inst, name);
  redirect(`/investor/documents/signatures/${pageId}?signed=1`);
}
