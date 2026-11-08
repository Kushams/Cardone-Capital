"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocumentsAction, type UploadState } from "@/app/investor/(app)/documents/actions";

/** Real upload: chosen files are stored privately under the client's account and
 * appear in their All Documents list. */
export default function UploadModal({ onClose, onDone }: { onClose: () => void; onDone: (msg: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [names, setNames] = useState<string[]>([]);
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadDocumentsAction, {});
  const router = useRouter();

  useEffect(() => {
    if (state.done) {
      onDone(`${state.done} file${state.done === 1 ? "" : "s"} uploaded — you'll find them in All Documents.`);
      router.refresh();
    }
  }, [state.done, onDone, router]);

  const pick = (fl: FileList | null) => setNames(fl ? [...fl].map((f) => f.name) : []);

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Upload Documents" className="card w-full max-w-[560px] p-6 bg-[var(--card)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Upload Documents</h2>
          <button aria-label="Close" onClick={onClose} className="text-3xl leading-none cursor-pointer">×</button>
        </div>
        <form action={action}>
          <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (input.current) { input.current.files = e.dataTransfer.files; pick(e.dataTransfer.files); } }}
            className="border-2 border-dashed border-[#adb5bd] rounded-lg py-14 text-center">
            Drag Files Here or <button type="button" className="text-brand underline cursor-pointer" onClick={() => input.current?.click()}>Choose Files to Add</button>
            <input ref={input} name="files" type="file" multiple hidden accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.txt" onChange={(e) => pick(e.target.files)} />
            <p className="text-xs muted mt-3">PDF, images, Word, Excel or text — up to 15 MB per file.</p>
          </div>
          {names.length > 0 && (
            <ul className="mt-4 text-sm space-y-1">
              {names.map((n) => <li key={n} className="break-words">• {n}</li>)}
            </ul>
          )}
          {state.error && <p role="alert" className="text-danger text-sm mt-3">{state.error}</p>}
          <div className="flex gap-3 mt-5">
            <button className="btn btn-primary px-6" disabled={pending || names.length === 0}>{pending ? "Uploading…" : "Upload"}</button>
            <button type="button" className="btn btn-outline px-6" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
