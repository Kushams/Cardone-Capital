"use client";
import { useMemo, useState } from "react";
import SortableTable from "./SortableTable";
import { FUND_COLS } from "./DocumentsView";
import type { DocRow } from "@/lib/docviews";

export default function FundDocuments({ rows, entities, years }: { rows: DocRow[]; entities: string[]; years: number[] }) {
  const [ent, setEnt] = useState("All"), [yr, setYr] = useState("All");
  const filtered = useMemo(() => rows.filter((d) => (ent === "All" || d.entity === null || d.entity === ent) && (yr === "All" || String(d.year) === yr)), [rows, ent, yr]);
  const sel = (label: string, v: string, set: (s: string) => void, opts: string[]) => (
    <label className="block md:flex-1 md:max-w-[300px]"><span className="label">{label}</span>
      <select aria-label={label} value={v} onChange={(e) => set(e.target.value)} className="input"><option>All</option>{opts.map((o) => <option key={o}>{o}</option>)}</select></label>
  );
  return (
    <section className="card p-5 md:p-6">
      <h2 className="text-[24px] md:text-[28px] font-bold mb-5">All Documents</h2>
      <div className="grid gap-4 md:flex md:gap-6 mb-4">{sel("Investing Entity", ent, setEnt, entities)}{sel("Year", yr, setYr, years.map(String))}</div>
      <SortableTable columns={FUND_COLS} defaultSort={{ key: "shared", dir: "desc" }} empty="No documents match the selected filters." testId="fund-docs"
        rows={filtered.map((d) => ({ id: d.id,
          cells: { dot: d.dot ? <span aria-hidden className="inline-block w-2.5 h-2.5 rounded-full bg-brand" /> : null,
            name: <div><a href={d.href} target="_blank" rel="noreferrer" className="break-words">{d.name}</a><div className="md:hidden text-[15px] mt-0.5">{d.investment}</div></div>,
            entity: d.entity ?? "--", asset: "--", type: d.type, year: d.year ?? "--", shared: d.shared },
          sort: { name: d.name.toLowerCase(), entity: d.entity ?? "", asset: "", type: d.type, year: d.year ?? 0, shared: d.sharedISO } }))} />
    </section>
  );
}
