"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { must, supabase } from "@/lib/supabase";
import { portalDb } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { executeInstance } from "@/lib/personalise";
import { writePortalFile } from "@/lib/storage";
import { createHash } from "node:crypto";
import { logActivity } from "@/lib/activity";
import { notifyStaff } from "@/lib/notify";

async function owned(pageId: number) {
  const u = await requireUser(`/investor/documents/signatures/${pageId}`);
  const r = must(await supabase().from("signature_requests")
    .select("id, status, document_instance_id, document_instances!inner ( client_id )")
    .eq("signature_page_id", pageId).eq("document_instances.client_id", u.clientId).maybeSingle()) as any;
  if (!r) redirect("/investor/documents/signatures");
  return { u, r: { id: r.id as number, status: r.status as string, inst: r.document_instance_id as number, clientId: (r.document_instances as any).client_id as number } };
}

/** Consent step: records the agreement + when it happened. Nothing is signed here. */
export async function agreeAction(pageId: number) {
  const { u, r } = await owned(pageId);
  if (r.status === "PENDING") {
    must(await supabase().from("signature_requests").update({ status: "AGREED", consent_agreed_at: new Date().toISOString() }).eq("id", r.id));
    await logActivity({ actorType: "CLIENT", actorEmail: u.email, clientEmail: u.email, action: "SIGN_CONSENT_AGREED", detail: `signature page ${pageId}` });
  }
  redirect(`/investor/documents/signatures/${pageId}`);
}

/** Real signing step: the investor's drawn signature (PNG from the signing pad) is
 * embedded into the executed copy, its image is retained in the private signatures
 * bucket, and the request row keeps the audit trail (who, when, IP, image hash). */
export async function signAction(pageId: number, form: FormData) {
  const { u, r } = await owned(pageId);
  const back = (q: string) => redirect(`/investor/documents/signatures/${pageId}?${q}`);
  const name = String(form.get("signature") ?? "").trim();
  const dataUrl = String(form.get("signatureImage") ?? "");
  if (r.status !== "AGREED" || name.length < 2 || form.get("confirm") !== "on") back("error=1");
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) back("error=2");
  const png = new Uint8Array(Buffer.from(m![1], "base64"));
  if (png.length < 400 || png.length > 400_000) back("error=2");
  const digest = createHash("sha256").update(Buffer.from(png)).digest("hex");

  const imageRel = `storage/signatures/${r.clientId}/${r.inst}.png`;
  await writePortalFile(imageRel, png);
  await executeInstance(portalDb(), r.inst, name, { png, sha256: digest });

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  must(await supabase().from("signature_requests").update({
    signed_at: new Date().toISOString(), signer_name: name, signer_ip: ip,
    signer_user_agent: h.get("user-agent"), signature_sha256: digest, signature_image_path: imageRel,
  }).eq("id", r.id));
  await logActivity({ actorType: "CLIENT", actorEmail: u.email, clientEmail: u.email, action: "DOCUMENT_SIGNED", detail: `signature page ${pageId}, ${name}` });
  const doc = must(await supabase().from("document_instances").select("document_templates!inner ( display_name )").eq("id", r.inst).maybeSingle()) as any;
  await notifyStaff("Document signed", `${u.email} signed “${doc?.document_templates?.display_name ?? "a document"}”. The executed copy is in their documents.`);
  redirect(`/investor/documents/signatures/${pageId}?signed=1`);
}
