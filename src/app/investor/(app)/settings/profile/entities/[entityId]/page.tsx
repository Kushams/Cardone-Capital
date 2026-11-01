import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageTitle } from "@/lib/nav";
import { requireUser } from "@/lib/auth";
import { must, supabase } from "@/lib/supabase";
import { entityMaskedTaxId, formatAddress, getEntity } from "@/lib/queries";
import EntityDetail, { type EntityView } from "@/components/EntityDetail";

export const metadata: Metadata = { title: pageTitle("Investing Entity Details") };

export default async function EntityPage({ params }: { params: Promise<{ entityId: string }> }) {
  const { entityId } = await params;
  const u = await requireUser(`/investor/settings/profile/entities/${entityId}`);
  const e = await getEntity(u.clientId, Number(entityId));
  if (!e) notFound();
  const contacts = (must(await supabase().from("entity_contacts").select("*").eq("entity_id", e.id).order("id")) as any[]).map((c) => ({
    id: c.id, name: c.name, emails: c.emails, phones: c.phones, isPrimary: !!c.is_primary, access: c.document_access, signer: !!c.required_signer }));
  const view: EntityView = { id: e.id, name: e.name, maskedTin: entityMaskedTaxId(e), entityType: e.entity_type ?? "", disregarded: !!e.is_disregarded,
    taxAddress: e.tax_address, taxAddressLine: formatAddress(e.tax_address), dist: e.distribution_method, contacts };
  return (
    <div className="max-w-[820px] mx-auto">
      <p className="text-sm mb-2"><Link href="/investor/settings/profile">My Profile</Link> › Investing Entity Details</p>
      <h1 className="text-[28px] md:text-[35px] leading-tight font-bold text-[var(--heading)] mb-6">{e.name}</h1>
      <EntityDetail e={view} />
    </div>
  );
}
