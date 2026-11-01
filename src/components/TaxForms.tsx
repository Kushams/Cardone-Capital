"use client";
import { useState } from "react";
import SortableTable from "./SortableTable";

export default function TaxForms({ entities, forms }: { entities: string[]; forms: { id: number; name: string; investment: string; entity: string; year: string | number; shared: string; sharedISO: string; href: string }[] }) {
  const [ent, setEnt] = useState("All");
  const rows = forms.filter((f) => ent === "All" || f.entity === ent);
  return (
    <div>
      <label className="block max-w-[300px] mb-5"><span className="label">Investing Entity</span>
        <select aria-label="Investing Entity" value={ent} onChange={(e) => setEnt(e.target.value)} className="input"><option>All</option>{entities.map((e) => <option key={e}>{e}</option>)}</select></label>
      {forms.length === 0 ? (
        <div className="card py-10 text-center" data-testid="tax-empty">No tax forms have been shared with you.</div>
      ) : (
        <section className="card p-5 md:p-6"><SortableTable defaultSort={{ key: "shared", dir: "desc" }}
          columns={[{ key: "name", header: "Name", sortable: true }, { key: "investment", header: "Investment", sortable: true, hideOnMobile: true }, { key: "entity", header: "Investing Entity", sortable: true, hideOnMobile: true },
            { key: "year", header: "Year", sortable: true, hideOnMobile: true }, { key: "shared", header: "Shared", sortable: true, align: "right" }]}
          rows={rows.map((f) => ({ id: f.id, cells: { name: <a href={f.href} target="_blank" rel="noreferrer">{f.name}</a>, investment: f.investment, entity: f.entity, year: f.year, shared: f.shared }, sort: { name: f.name, investment: f.investment, entity: f.entity, year: String(f.year), shared: f.sharedISO } }))} /></section>
      )}
    </div>
  );
}
