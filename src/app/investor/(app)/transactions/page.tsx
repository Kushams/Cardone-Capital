import type { Metadata } from "next";
import { pageTitle } from "@/lib/nav";
import { requireUser } from "@/lib/auth";
import { must, supabase } from "@/lib/supabase";
import { mdyFromISO } from "@/lib/catalog";
import PageTitle from "@/components/PageTitle";
import SortableTable from "@/components/SortableTable";

export const metadata: Metadata = { title: pageTitle("Transactions") };
const usd = (c: number) => (c < 0 ? "-" : "") + "$" + (Math.abs(c) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 });

export default async function Transactions() {
  const u = await requireUser("/investor/transactions");
  const tx = must(await supabase().from("transactions")
    .select("id, tx_date, kind, description, investment, amount_cents, investing_entities ( name )")
    .eq("client_id", u.clientId).order("tx_date", { ascending: false })) as any[];
  return (
    <div className="max-w-[1180px]">
      <PageTitle>Transactions</PageTitle>
      {tx.length === 0 ? <p className="text-center py-10" data-testid="tx-empty">Transactions have not been recorded.</p> : (
        <section className="card p-5 md:p-6"><SortableTable defaultSort={{ key: "date", dir: "desc" }}
          columns={[{ key: "date", header: "Date", sortable: true }, { key: "kind", header: "Type", sortable: true }, { key: "inv", header: "Investment", sortable: true, hideOnMobile: true }, { key: "ent", header: "Investing Entity", sortable: true, hideOnMobile: true }, { key: "amt", header: "Amount", sortable: true, align: "right" }]}
          rows={tx.map((t) => ({ id: t.id, cells: { date: mdyFromISO(t.tx_date), kind: t.kind, inv: t.investment ?? "--", ent: t.investing_entities?.name ?? "--", amt: usd(t.amount_cents) }, sort: { date: t.tx_date, kind: t.kind, inv: t.investment ?? "", ent: t.investing_entities?.name ?? "", amt: t.amount_cents } }))} /></section>
      )}
    </div>
  );
}
