"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { must, supabase } from "@/lib/supabase";
import { requireUser } from "@/lib/auth";
import { writePortalFile } from "@/lib/storage";
import { logActivity } from "@/lib/activity";
import { notifyStaff } from "@/lib/notify";

const ALLOWED: Record<string, string> = {
  pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
};
const MAX_BYTES = 15 * 1024 * 1024;

export interface UploadState { error?: string; done?: number }

/** Real upload (audit item 4): files land in the private `uploads` bucket under the
 * client's own folder and are listed with their documents. */
export async function uploadDocumentsAction(_prev: UploadState, form: FormData): Promise<UploadState> {
  const u = await requireUser("/investor/documents");
  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { error: "Choose at least one file to upload." };
  let done = 0;
  for (const f of files) {
    const ext = (f.name.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED[ext]) return { error: `“${f.name}” is not a supported file type (PDF, image, Word, Excel or text).` };
    if (f.size > MAX_BYTES) return { error: `“${f.name}” is larger than 15 MB.` };
    const safeName = f.name.replace(/[^\w.\-]+/g, "-").replace(/^-+|-+$/g, "") || `file.${ext}`;
    const rel = `storage/uploads/${u.clientId}/${randomUUID()}-${safeName}`;
    const bytes = new Uint8Array(await f.arrayBuffer());
    await writePortalFile(rel, bytes);
    must(await supabase().from("client_uploads").insert({
      client_id: u.clientId, original_name: f.name, file_path: rel,
      content_type: ALLOWED[ext], size_bytes: f.size,
    }));
    done++;
  }
  await logActivity({ actorType: "CLIENT", actorEmail: u.email, clientEmail: u.email, action: "DOCUMENT_UPLOADED", detail: `${done} file${done === 1 ? "" : "s"}` });
  await notifyStaff("Client uploaded documents", `${u.email} uploaded ${done} file${done === 1 ? "" : "s"} to their portal documents.`);
  revalidatePath("/investor/documents");
  return { done };
}
