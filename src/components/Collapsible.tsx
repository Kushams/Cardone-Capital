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
          <svg width="14" height="9" viewBox="0 0 14 9" aria-hidden className={`transition-transform text-[#6c757d] ${open ? "" : "-rotate-90"}`}><path d="M0 0h14L7 9z" fill="currentColor" /></svg>
          <H className="text-[22px] md:text-[26px] font-bold">{title}</H>
        </button>
        {action}
      </div>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}
