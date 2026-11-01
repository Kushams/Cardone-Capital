"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import SortableTable, { type Col, type Row } from "./SortableTable";
import Collapsible from "./Collapsible";
import UploadModal from "./UploadModal";
import type { DocRow, SigRow } from "@/lib/docviews";

type Tab = "all" | "investment" | "signatures";
interface Fund { portalId: number; name: string; preview: DocRow[]; total: number }

const Dot = ({ on }: { on: boolean }) => (on ? <span aria-hidden className="inline-block w-2.5 h-2.5 rounded-full bg-brand" /> : null); // unlabelled, as in the original

const nameCell = (d: DocRow) => (
  <div>
    <a href={d.href} target="_blank" rel="noreferrer" className="break-words">{d.name}</a>
    <div className="md:hidden text-[13px] mt-0.5">{d.investment}</div>
  </div>
);
const toRow = (d: DocRow, withEntity: boolean): Row => ({
  id: d.id,
  cells: { dot: <Dot on={d.dot} />, name: nameCell(d), investment: d.investment, entity: d.entity ?? "--", asset: "--", type: d.type, year: d.year ?? "--", shared: d.shared },
  sort: { name: d.name.toLowerCase(), investment: d.investment, entity: d.entity ?? "", asset: "", type: d.type, year: d.year ?? 0, shared: d.sharedISO },
});

const ALL_COLS: Col[] = [
  { key: "dot", header: "", hideOnMobile: true, className: "w-8" },
  { key: "name", header: "Name", sortable: true },
  { key: "investment", header: "Investment", sortable: true, hideOnMobile: true },
  { key: "type", header: "Type", sortable: true, hideOnMobile: true },
  { key: "year", header: "Year", sortable: true, hideOnMobile: true },
  { key: "shared", header: "Shared", sortable: true, align: "right" },
];
export const FUND_COLS: Col[] = [
  { key: "dot", header: "", hideOnMobile: true, className: "w-8" },
  { key: "name", header: "Name", sortable: true },
  { key: "entity", header: "Investing Entity", sortable: true, hideOnMobile: true },
  { key: "asset", header: "Asset", sortable: true, hideOnMobile: true },
  { key: "type", header: "Type", sortable: true, hideOnMobile: true },
  { key: "year", header: "Year", sortable: true, hideOnMobile: true },
  { key: "shared", header: "Shared", sortable: true, align: "right" },
];

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block md:flex-1 md:max-w-[300px]">
      <span className="label">{label}</span>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="input">
        <option value="All">All</option>{options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

function Pending({ sigs }: { sigs: SigRow[] }) {
  const rows: Row[] = sigs.map((s) => ({
    id: s.id,
    cells: { requested: s.requested, doc: <a href={s.docHref} target="_blank" rel="noreferrer" className="break-words">{s.docName}</a>, investment: s.investment, entity: s.entity,
      status: <Link href={`/investor/documents/signatures/${s.pageId}`} className="btn btn-primary px-6 !py-2">Sign</Link> },
    sort: { requested: s.requestedISO, doc: s.docName, investment: s.investment, entity: s.entity, status: 0 },
  }));
  return (
    <Collapsible title="Pending Signatures" id="pending-signatures">
      <p className="mb-3">Please review and sign the following:</p>
      <SortableTable testId="pending-signatures-table" defaultSort={{ key: "requested", dir: "desc" }} empty="No documents are waiting for your signature."
        columns={[{ key: "requested", header: "Requested", sortable: true, hideOnMobile: true }, { key: "doc", header: "Document", sortable: true },
          { key: "investment", header: "Investment", sortable: true, hideOnMobile: true }, { key: "entity", header: "Investing Entity", sortable: true, hideOnMobile: true },
          { key: "status", header: "Status", sortable: true, align: "center" }]} rows={rows} />
    </Collapsible>
  );
}

export default function DocumentsView({ initialTab, all, funds, sigs, entities, years }:
  { initialTab: Tab; all: DocRow[]; funds: Fund[]; sigs: SigRow[]; entities: string[]; years: number[] }) {
  const [tab, setTabState] = useState<Tab>(initialTab);
  const [inv, setInv] = useState("All"), [ent, setEnt] = useState("All"), [yr, setYr] = useState("All");
  const [upload, setUpload] = useState(false), [note, setNote] = useState("");
  const setTab = (t: Tab) => { setTabState(t); document.cookie = `cc_docs_tab=${t}; path=/; SameSite=Lax`; }; // last-used tab persists for the session

  const filtered = useMemo(() => all.filter((d) => (inv === "All" || d.investment === inv) && (ent === "All" || d.entity === null || d.entity === ent) && (yr === "All" || String(d.year) === yr)), [all, inv, ent, yr]);
  const tabBtn = (t: Tab, label: string, badge?: number) => (
    <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
      className={`relative pb-2 px-2 md:px-3 text-[15px] md:text-[18px] cursor-pointer flex items-center gap-1.5 md:gap-2 ${tab === t ? "font-bold" : ""}`}>
      {label}{badge ? <span className="badge-yellow">{badge}</span> : null}
      {tab === t && <span className="absolute left-2 right-2 -bottom-[1px] h-[4px] bg-tab" />}
    </button>
  );
  return (
    <div className="max-w-[1180px]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <h1 className="text-[30px] md:text-[35px] leading-tight font-bold text-[var(--heading)]">Documents</h1>
        <button onClick={() => setUpload(true)} className="btn btn-outline !py-2 shrink-0">Upload Document</button>
      </div>
      {note && <p role="status" className="card p-3 mb-4 text-sm">{note}</p>}
      <div role="tablist" aria-label="View by" className="flex items-end gap-1 mb-5">
        <span className="muted pb-2 pr-1 md:pr-3 text-[14px] md:text-[16px] whitespace-nowrap">View by:</span>
        {tabBtn("all", "All")}{tabBtn("investment", "Investment")}{tabBtn("signatures", "Signatures", sigs.length)}
      </div>

      {tab === "all" && (
        <section className="card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-[21px] md:text-[24px] font-bold">All Documents</h2>
            <button className="btn btn-secondary" onClick={() => setNote("STUB: “Download All” is not connected in this build — no archive is generated.")}>Download All</button>
          </div>
          <div className="grid gap-4 md:flex md:gap-6 mb-4">
            <Filter label="Investment" value={inv} onChange={setInv} options={funds.map((f) => f.name)} />
            <Filter label="Investing Entity" value={ent} onChange={setEnt} options={entities} />
            <Filter label="Year" value={yr} onChange={setYr} options={years.map(String)} />
          </div>
          <SortableTable testId="all-docs" columns={ALL_COLS} rows={filtered.map((d) => toRow(d, false))} defaultSort={{ key: "shared", dir: "desc" }} empty="No documents match the selected filters." />
        </section>
      )}

      {tab === "investment" && (
        <div className="space-y-6">
          {funds.map((f) => (
            <Collapsible key={f.portalId} title={f.name}>
              <SortableTable columns={FUND_COLS} rows={f.preview.map((d) => toRow(d, true))} defaultSort={{ key: "shared", dir: "desc" }} />
              <div className="text-center pt-4"><Link href={`/investor/documents/investments/${f.portalId}`}>View all</Link></div>
            </Collapsible>
          ))}
        </div>
      )}

      {tab === "signatures" && <Pending sigs={sigs} />}
      {upload && <UploadModal onClose={() => setUpload(false)} onStub={(m) => { setUpload(false); setNote(m); }} />}
    </div>
  );
}
