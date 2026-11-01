"use client";
import { useRef } from "react";

/** STUB: no file is stored anywhere. */
export default function UploadModal({ onClose, onStub }: { onClose: () => void; onStub: (msg: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const take = (n: number) => onStub(`STUB: ${n} file${n === 1 ? "" : "s"} selected — uploads are not stored in this build.`);
  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Upload Documents" className="card w-full max-w-[560px] p-6 bg-[var(--card)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Upload Documents</h2>
          <button aria-label="Close" onClick={onClose} className="text-3xl leading-none cursor-pointer">×</button>
        </div>
        <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); take(e.dataTransfer.files.length); }}
          className="border-2 border-dashed border-[#adb5bd] rounded-lg py-14 text-center">
          Drag Files Here or <button className="text-brand underline cursor-pointer" onClick={() => input.current?.click()}>Choose Files to Add</button>
          <input ref={input} type="file" multiple hidden onChange={(e) => take(e.target.files?.length ?? 0)} />
        </div>
      </div>
    </div>
  );
}
