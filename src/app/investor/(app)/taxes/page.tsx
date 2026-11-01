import type { Metadata } from "next";
import { pageTitle } from "@/lib/nav";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntities } from "@/lib/queries";
import { mdyFromISO } from "@/lib/catalog";
import PageTitle from "@/components/PageTitle";
import TaxForms from "@/components/TaxForms";

export const metadata: Metadata = { title: pageTitle("Tax Forms") };

export default async function Taxes() {
  const u = await requireUser("/investor/taxes");
  const entities = getEntities(u.clientId);
  // Data path ready: rows render in the Documents table pattern. Ships empty (this account has no forms).
  const forms = (db().prepare(`SELECT f.id, f.name, f.investment, f.tax_year y, f.shared_date s, e.name en FROM tax_forms f LEFT JOIN investing_entities e ON e.id = f.investing_entity_id WHERE f.client_id = ? ORDER BY f.shared_date DESC`).all(u.clientId) as any[])
    .map((f) => ({ id: f.id, name: f.name, investment: f.investment ?? "--", entity: f.en ?? "--", year: f.y ?? "--", shared: mdyFromISO(f.s), sharedISO: f.s, href: `/investor/files/tax/${f.id}` }));
  return (<div className="max-w-[1180px]"><PageTitle>Tax Forms</PageTitle><TaxForms entities={entities.map((e) => e.name)} forms={forms} /></div>);
}
