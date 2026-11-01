"use client";
export default function BackToTop() {
  return <button aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="mx-auto mt-6 block w-10 h-10 rounded bg-[var(--btn2)] cursor-pointer">▲</button>;
}
