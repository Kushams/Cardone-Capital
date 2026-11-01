"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Photo from "./Photo";

/** Full-screen black photo viewer: Previous/Next, X close (back to detail), one dot per photo. */
export default function Gallery({ closeHref, count, seed, name, cover }: { closeHref: string; count: number; seed: number; name: string; cover?: string }) {
  const [i, setI] = useState(0);
  const prev = () => setI((i + count - 1) % count), next = () => setI((i + 1) % count);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "ArrowLeft") prev(); if (e.key === "ArrowRight") next(); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  });
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" role="dialog" aria-label={`${name} photos`}>
      <Link href={closeHref} aria-label="Close" className="absolute top-4 right-5 text-white text-4xl leading-none hover:no-underline">×</Link>
      {count > 1 && <button aria-label="Previous" onClick={prev} className="absolute left-4 text-white text-5xl cursor-pointer px-3">‹</button>}
      <div className="w-full max-w-[900px] px-14"><Photo seed={seed + i} src={i === 0 ? cover : undefined} fit="contain" label={`${name} — photo ${i + 1} of ${count}`} className="rounded" /></div>
      {count > 1 && <button aria-label="Next" onClick={next} className="absolute right-4 text-white text-5xl cursor-pointer px-3">›</button>}
      <div className="absolute bottom-6 flex gap-2" role="tablist">
        {Array.from({ length: count }, (_, k) => <button key={k} role="tab" aria-selected={k === i} aria-label={`Photo ${k + 1}`} onClick={() => setI(k)} className={`w-2.5 h-2.5 rounded-full cursor-pointer ${k === i ? "bg-white" : "bg-white/40"}`} />)}
      </div>
    </div>
  );
}
