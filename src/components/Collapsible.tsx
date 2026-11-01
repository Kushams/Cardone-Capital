"use client";
import { useState } from "react";

export default function Collapsible({ title, headingLevel = 2, action, defaultOpen = true, children, id }:
  { title: React.ReactNode; headingLevel?: 2 | 3; action?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode; id?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  const H = (`h${headingLevel}`) as "h2" | "h3";
  return (
    <section className="card p-5 md:p-6" id={id}>
      <div className="flex items-center justify-between gap-3">
        <button className="flex items-center gap-3 text-left cursor-pointer" aria-expanded={open} onClick={() => setOpen(!open)}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}><path d="M2 5l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.200" /></svg>
          <H className="text-[22px] md:text-[26px] font-bold">{title}</H>
        </button>
        {action}
      </div>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}
