"use client";
import { useActionState, useState } from "react";
import AddressFields from "@/components/AddressFields";
import { ENTITY_TYPES, PAYMENT_METHODS } from "@/lib/constants";
import { onboardingAction, type OnbState } from "./actions";

const Err = ({ m }: { m?: string }) => (m ? <span role="alert" className="text-danger text-sm block mt-1">{m}</span> : null);
export default function OnboardingForm({ email }: { email: string }) {
  const [s, action, pending] = useActionState<OnbState, FormData>(onboardingAction, {});
  const v = s.values ?? {}; const er = s.errors ?? {};
  const [entName, setEntName] = useState(v.entity_name ?? ""); const [k1, setK1] = useState(v.k1_name ?? ""); const [k1Touched, setK1Touched] = useState(!!v.k1_name);
  const [payAddr, setPayAddr] = useState(0);
  const T = ({ children }: { children: React.ReactNode }) => <h2 className="text-xl font-bold mt-2 mb-3 pt-4 border-t hair first:border-0 first:pt-0">{children}</h2>;
  return (
    <form action={action} className="space-y-5">
      <section className="space-y-4"><T>Your details</T>
        <label className="block"><span className="label">Full legal name</span><input name="full_name" defaultValue={v.full_name} className="input" autoComplete="name" /><Err m={er.full_name} /></label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block"><span className="label">Contact email</span><input name="contact_email" type="email" defaultValue={v.contact_email ?? email} className="input" /><Err m={er.contact_email} /></label>
          <label className="block"><span className="label">Phone</span><input name="phone" type="tel" defaultValue={v.phone} className="input" /><Err m={er.phone} /></label>
        </div></section>

      <section className="space-y-4"><T>Investing entity</T>
        <label className="block"><span className="label">Investing entity name (e.g. your company, LLC)</span>
          <input name="entity_name" value={entName} onChange={(e) => { setEntName(e.target.value); if (!k1Touched) setK1(e.target.value); }} className="input" /><Err m={er.entity_name} /></label>
        <div className="flex flex-wrap items-end gap-6">
          <label className="block"><span className="label">Entity Type</span><select name="entity_type" defaultValue={v.entity_type ?? ""} className="input"><option value="">Select…</option>{ENTITY_TYPES.map((t) => <option key={t}>{t}</option>)}</select><Err m={er.entity_type} /></label>
          <label className="flex items-center gap-2 pb-2"><input type="checkbox" name="disregarded" defaultChecked={!!v.disregarded} /> Mark as a Disregarded Entity <span title="A disregarded entity is treated as separate from its owner for tax purposes." aria-label="info" className="inline-flex w-4 h-4 rounded-full border text-[11px] items-center justify-center muted">i</span></label>
        </div>
        <label className="block"><span className="label">Holding Title</span><input name="holding_title" defaultValue={v.holding_title} className="input" placeholder="" /><Err m={er.holding_title} /></label>
        <label className="block"><span className="label">Tax ID Number (EIN or SSN)</span><input name="tax_id" className="input max-w-[300px]" autoComplete="off" inputMode="numeric" /><Err m={er.tax_id} />
          <span className="text-xs muted block mt-1">Stored encrypted; only the last 4 digits are ever shown.</span></label>
        <div><span className="label">Tax Address</span><AddressFields prefix="tax" v={{ address: v.tax_address, address2: v.tax_address2, city: v.tax_city, state: v.tax_state, zip: v.tax_zip, country: v.tax_country } as Record<string, string>} /><Err m={er.tax} /></div>
        <label className="block"><span className="label">Member Name as it appears on Schedule K-1</span>
          <input name="k1_name" value={k1} onChange={(e) => { setK1(e.target.value); setK1Touched(true); }} className="input" /></label></section>

      <section className="space-y-4"><T>Distribution method <span className="text-base font-normal muted">(optional now — you can finish this later from My Profile)</span></T>
        <label className="block"><span className={`label ${er.payment_method ? "!text-danger" : ""}`}>Payment Method</span><select name="payment_method" defaultValue={v.payment_method ?? ""} className="input max-w-[320px]"><option value="">Select…</option>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select><Err m={er.payment_method} /></label>
        <label className="flex items-center gap-2"><input type="checkbox" name="custodian" /> This is a Custodian/FBO Account</label>
        <label className="block"><span className={`label ${er.payee_name ? "!text-danger" : ""}`}>Payee Name</span><input name="payee_name" defaultValue={v.payee_name} className="input" /><Err m={er.payee_name} /></label>
        <div><div className="flex items-center justify-between"><span className="label">Payment Address</span>
          <button type="button" className="text-brand cursor-pointer" title="Copies the tax address fields above" onClick={() => { const g = (n: string) => (document.querySelector(`[name=${n}]`) as HTMLInputElement | null)?.value ?? ""; ["address", "address2", "city", "state", "zip", "country"].forEach((k) => { const t = document.querySelector(`[name=pay_${k}]`) as HTMLInputElement | null; if (t) t.value = g(`tax_${k}`); }); setPayAddr(payAddr + 1); }}>Use Tax Address</button></div>
          <AddressFields prefix="pay" /></div></section>
      <div className="pt-2"><button className="btn btn-primary px-8" disabled={pending}>{pending ? "Saving…" : "Submit and continue"}</button></div>
    </form>
  );
}
