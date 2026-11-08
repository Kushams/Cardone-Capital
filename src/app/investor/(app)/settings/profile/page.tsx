import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle } from "@/lib/nav";
import { requireUser } from "@/lib/auth";
import { must, supabase } from "@/lib/supabase";
import { getClient, getEntities } from "@/lib/queries";
import PageTitle from "@/components/PageTitle";
import ThemeToggle from "@/components/ThemeToggle";
import ContactInfoCard from "@/components/ContactInfoCard";
import Collapsible from "@/components/Collapsible";
import BankAccounts from "@/components/BankAccounts";
import { listBankAccounts } from "@/lib/banks";

export const metadata: Metadata = { title: pageTitle("My Profile") };
export const AlertIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className="inline -mt-0.5"><circle cx="12" cy="12" r="11" fill="#d9534f" /><rect x="11" y="5.500" width="2" height="9" fill="#fff" /><circle cx="12" cy="18" r="1.300" fill="#fff" /></svg>;

export default async function Profile() {
  const u = await requireUser("/investor/settings/profile");
  const c = await getClient(u.clientId);
  const entities = await getEntities(u.clientId);
  const invNames = new Map<number, string>();
  for (const e of entities) {
    const rows = must(await supabase().from("commitments").select("offerings!inner ( name )").eq("investing_entity_id", e.id)) as any[];
    invNames.set(e.id, [...new Set(rows.map((r) => r.offerings.name))].join(", ") || "--");
  }
  const inv = (id: number) => invNames.get(id) ?? "--";
  return (
    <div className="max-w-[820px] mx-auto">
      <PageTitle right={<div className="pt-3 shrink-0"><ThemeToggle dark={u.darkTheme} /></div>}>My Profile</PageTitle>
      <div className="space-y-6">
        <ContactInfoCard c={{ name: c.full_name ?? "", phone: c.phone ?? "", address: c.address ?? "", loginEmail: c.email, email: c.email, fincen: c.fincen_id ?? "" }} />

        <Collapsible title="Investing Entities">
          <div className="overflow-x-auto"><table className="w-full">
            <thead><tr className="border-b hair"><th className="py-2 px-2">Name</th><th className="py-2 px-2 hidden md:table-cell">Investments</th><th className="py-2 px-2 hidden md:table-cell">Distribution Method</th><th className="py-2 px-2">Actions</th></tr></thead>
            <tbody>{entities.map((e) => (
              <tr key={e.id} className="border-b hair align-top">
                <td className="py-3 px-2"><Link href={`/investor/settings/profile/entities/${e.id}`}>{e.name}</Link>
                  <div className="md:hidden text-sm mt-1"><span className="muted">Distribution Method:</span> {e.distribution_method ? e.distribution_method.payment_method : <Link href={`/investor/settings/profile/entities/${e.id}#distribution`}><AlertIcon /> Missing Information</Link>}
                    <br /><span className="muted">Investments:</span> {inv(e.id)}</div></td>
                <td className="py-3 px-2 hidden md:table-cell">{inv(e.id)}</td>
                <td className="py-3 px-2 hidden md:table-cell">{e.distribution_method ? e.distribution_method.payment_method : <Link href={`/investor/settings/profile/entities/${e.id}#distribution`}><AlertIcon /> Missing Information</Link>}</td>
                <td className="py-3 px-2"><Link href={`/investor/settings/profile/entities/${e.id}`} className="btn btn-secondary !py-1">Edit</Link></td>
              </tr>))}</tbody></table></div>
        </Collapsible>

        <Collapsible title="Bank Accounts">
          <BankAccounts accounts={await listBankAccounts(u.clientId)} entities={entities.map((e) => ({ id: e.id, name: e.name }))} />
        </Collapsible>
      </div>
      <footer className="text-center text-sm muted mt-10 pb-6">
        <a href="https://cardonecapital.com/terms-of-service/" target="_blank" rel="noreferrer">Terms of Service</a> | <a href="https://cardonecapital.com/privacy-policy/" target="_blank" rel="noreferrer">Privacy Policy</a>
      </footer>
    </div>
  );
}
