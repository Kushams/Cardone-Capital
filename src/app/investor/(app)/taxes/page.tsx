import type { Metadata } from "next";
import { pageTitle } from "@/lib/nav";
import { requireUser } from "@/lib/auth";
import { must, supabase } from "@/lib/supabase";
import { getEntities } from "@/lib/queries";
import { mdyFromISO } from "@/lib/catalog";
import PageTitle from "@/components/PageTitle";
import TaxForms from "@/components/TaxForms";

export const metadata: Metadata = { title: pageTitle("Tax Forms") };

export default async function Taxes() {
  const u = await requireUser("/investor/taxes");
  const entities = await getEntities(u.clientId);
  // Data path ready: rows render in the Documents table pattern. Ships empty (this account has no forms).
  const forms = (must(await supabase().from("tax_forms")
    .select("id, name, investment, tax_year, shared_date, investing_entities ( name )")
    .eq("client_id", u.clientId).order("shared_date", { ascending: false })) as any[])
    .map((f) => ({ id: f.id, name: f.name, investment: f.investment ?? "--", entity: f.investing_entities?.name ?? "--", year: f.tax_year ?? "--", shared: mdyFromISO(f.shared_date), sharedISO: f.shared_date, href: `/investor/files/tax/${f.id}` }));
  return (<div className="max-w-[1180px]"><PageTitle>Tax Forms</PageTitle><TaxForms entities={entities.map((e) => e.name)} forms={forms} /></div>);
}
