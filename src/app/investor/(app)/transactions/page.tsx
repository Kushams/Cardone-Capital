import type { Metadata } from "next";
import { pageTitle } from "@/lib/nav";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { mdyFromISO } from "@/lib/catalog";
import PageTitle from "@/components/PageTitle";
import SortableTable from "@/components/SortableTable";

export const metadata: Metadata = { title: pageTitle("Transactions") };
const usd = (c: number) => (c < 0 ? "-" : "") + "$" + (Math.abs(c) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });

export default async function Transactions() {
  const u = await requireUser("/investor/transactions");
  const tx = db().prepare(`SELECT t.id, t.tx_date d, t.kind, t.description, t.investment, t.amount_cents a, e.name en FROM transactions t LEFT JOIN investing_entities e ON e.id = t.investing_entity_id WHERE t.client_id = ? ORDER BY t.tx_date DESC`).all(u.clientId) as any[];
  return (
    <div className="max-w-[1180px]">
      <PageTitle>Transactions</PageTitle>
      {tx.length === 0 ? <p className="text-center py-10" data-testid="tx-empty">Transactions have not been recorded.</p> : (
        <section className="card p-5 md:p-6"><SortableTable defaultSort={{ key: "date", dir: "desc" }}
          columns={[{ key: "date", header: "Date", sortable: true }, { key: "kind", header: "Type", sortable: true }, { key: "inv", header: "Investment", sortable: true, hideOnMobile: true }, { key: "ent", header: "Investing Entity", sortable: true, hideOnMobile: true }, { key: "amt", header: "Amount", sortable: true, align: "right" }]}
          rows={tx.map((t) => ({ id: t.id, cells: { date: mdyFromISO(t.d), kind: t.kind, inv: t.investment ?? "--", ent: t.en ?? "--", amt: usd(t.a) }, sort: { date: t.d, kind: t.kind, inv: t.investment ?? "", ent: t.en ?? "", amt: t.a } }))} /></section>
      )}
    </div>
  );
}
