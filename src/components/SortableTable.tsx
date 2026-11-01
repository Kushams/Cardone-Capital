"use client";
import { useMemo, useState } from "react";

export interface Col { key: string; header: string; sortable?: boolean; hideOnMobile?: boolean; align?: "left" | "right" | "center"; className?: string }
export interface Row { id: string | number; cells: Record<string, React.ReactNode>; sort?: Record<string, string | number> }

/** Server pages pass pre-rendered cells + sort keys (React nodes are serialisable; functions are not). */
export default function SortableTable({ columns, rows, defaultSort, empty, testId }:
  { columns: Col[]; rows: Row[]; defaultSort?: { key: string; dir: "asc" | "desc" }; empty?: React.ReactNode; testId?: string }) {
  const [sort, setSort] = useState(defaultSort ?? null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const k = sort.key, m = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = a.sort?.[k] ?? "", y = b.sort?.[k] ?? "";
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })) * m;
    });
  }, [rows, sort]);
  // Solid triangles like the original: stacked pair when unsorted, single when sorted.
  const arrow = (c: Col) => !c.sortable ? null : (
    <svg aria-hidden width="10" height="14" viewBox="0 0 10 14" className="inline-block ml-1.5 -mt-0.5" fill="currentColor">
      {sort?.key === c.key ? (sort.dir === "asc" ? <path d="M0 9h10L5 3z" /> : <path d="M0 5h10L5 11z" />) : <><path d="M0 5.500h10L5 .5z" /><path d="M0 8.500h10L5 13.500z" /></>}
    </svg>);
  const al = (c: Col) => (c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left");
  return (
    <div className="overflow-x-auto" data-testid={testId}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b hair">
            {columns.map((c) => (
              <th key={c.key} className={`py-3 px-2 md:px-3 font-bold ${al(c)} ${c.hideOnMobile ? "hidden md:table-cell" : ""} ${c.className ?? ""}`}
                aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
                {c.sortable ? (
                  <button className="font-bold cursor-pointer whitespace-nowrap" onClick={() => setSort(sort?.key === c.key ? { key: c.key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: "asc" })}>
                    {c.header}{arrow(c)}
                  </button>
                ) : c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.id} className="border-b hair align-middle">
              {columns.map((c) => (
                <td key={c.key} className={`py-3 md:py-4 px-2 md:px-3 ${al(c)} ${c.hideOnMobile ? "hidden md:table-cell" : ""} ${c.className ?? ""}`}>{r.cells[c.key]}</td>
              ))}
            </tr>
          ))}
          {sorted.length === 0 && <tr><td colSpan={columns.length} className="py-8 text-center muted">{empty ?? "No records."}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
