"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { executeInstance } from "@/lib/personalise";

async function owned(pageId: number) {
  const u = await requireUser(`/investor/documents/signatures/${pageId}`);
  const r = db().prepare(`SELECT sr.id, sr.status, sr.document_instance_id inst FROM signature_requests sr JOIN document_instances di ON di.id = sr.document_instance_id
    WHERE sr.signature_page_id = ? AND di.client_id = ?`).get(pageId, u.clientId) as any;
  if (!r) redirect("/investor/documents/signatures");
  return { u, r };
}

/** Consent step: records "Agree" only. Nothing is signed here. */
export async function agreeAction(pageId: number) {
  const { r } = await owned(pageId);
  if (r.status === "PENDING") db().prepare("UPDATE signature_requests SET status = 'AGREED' WHERE id = ?").run(r.id);
  redirect(`/investor/documents/signatures/${pageId}`);
}

/** STUB signing step: typed-name capture; produces the client's executed copy. */
export async function signAction(pageId: number, form: FormData) {
  const { u, r } = await owned(pageId);
  const name = String(form.get("signature") ?? "").trim();
  if (r.status !== "AGREED" || name.length < 2 || form.get("confirm") !== "on") redirect(`/investor/documents/signatures/${pageId}?error=1`);
  await executeInstance(db(), r.inst, name);
  redirect(`/investor/documents/signatures/${pageId}?signed=1`);
}
