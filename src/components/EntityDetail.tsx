"use client";
import { Fragment, useActionState, useState } from "react";
import AddressFields from "./AddressFields";
import { PAYMENT_METHODS } from "@/lib/constants";
import { addContact, removeContact, saveDistribution, updateEntityTax, type FormState } from "@/app/investor/(app)/settings/profile/actions";

type Addr = Record<string, string>;
export interface EntityView {
  id: number; name: string; maskedTin: string; entityType: string; disregarded: boolean; taxAddress: Addr | null; taxAddressLine: string;
  dist: { payment_method: string; payee_name: string; is_custodian_fbo: boolean; payment_address: Addr } | null;
  contacts: { id: number; name: string; emails: string[]; phones: string[]; isPrimary: boolean; access: string; signer: boolean }[];
}
const Row = ({ l, v }: { l: string; v: React.ReactNode }) => <div><dt className="label">{l}</dt><dd className="mb-4 break-words">{v || "--"}</dd></div>;
const Err = ({ m }: { m?: string }) => (m ? <span role="alert" className="text-danger text-sm block mt-1">{m}</span> : null);
const Head = ({ title, right }: { title: string; right?: React.ReactNode }) => <div className="flex items-center justify-between mb-4"><h2 className="text-[22px] md:text-[26px] font-bold">{title}</h2>{right}</div>;

function DetailsCard({ e }: { e: EntityView }) {
  const [edit, setEdit] = useState(false); const [note, setNote] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(async (p, f) => { const r = await updateEntityTax(e.id, p, f); if (r.ok) setEdit(false); return r; }, {});
  return (
    <section className="card p-5 md:p-6">
      <Head title="Investing Entity Details" right={!edit && <button className="btn btn-secondary" onClick={() => setEdit(true)}>Edit</button>} />
      {!edit ? (
        <dl>
          <Row l="Tax ID Number" v={<>{e.maskedTin} <button className="text-brand ml-2 cursor-pointer" onClick={() => setNote(!note)}>Show</button>
            {note && <span className="block text-sm muted mt-1">For security the full Tax ID is never displayed. Contact the firm to verify it.</span>}</>} />
          <Row l="Entity Type" v={e.entityType} /><Row l="Disregarded Entity" v={e.disregarded ? "Yes" : "No"} /><Row l="Tax Address" v={e.taxAddressLine} />
        </dl>
      ) : (
        <form action={action} className="space-y-4">
          <label className="block"><span className="label">Tax ID Number</span><input className="input max-w-[300px]" value={e.maskedTin} readOnly /></label>
          <div className="flex flex-wrap items-end gap-6">
            <label className="block"><span className="label">Entity Type</span><input className="input" value={e.entityType} readOnly /></label>
            <label className="flex items-center gap-2 pb-2"><input type="checkbox" name="disregarded" defaultChecked={e.disregarded} /> Mark as a Disregarded Entity <span title="A disregarded entity is treated as separate from its owner for tax purposes." aria-label="info" className="inline-flex w-4 h-4 rounded-full border text-[11px] items-center justify-center muted">i</span></label>
          </div>
          <p className="muted text-sm">Tax ID and Entity Type are managed by the firm after the entity is created.</p>
          <div><span className="label">Tax Address</span><AddressFields prefix="tax" v={e.taxAddress ?? {}} /><Err m={state.errors?.tax} /></div>
          <div className="flex items-center gap-5"><button className="btn btn-primary" disabled={pending}>Save</button><button type="button" className="text-brand cursor-pointer" onClick={() => setEdit(false)}>Cancel</button></div>
        </form>
      )}
    </section>
  );
}

function DistributionCard({ e }: { e: EntityView }) {
  const [edit, setEdit] = useState(false);
  const [addrKey, setAddrKey] = useState(0);
  const [pa, setPa] = useState<Addr>(e.dist?.payment_address ?? {});
  const [state, action, pending] = useActionState<FormState, FormData>(async (p, f) => { const r = await saveDistribution(e.id, p, f); if (r.ok) setEdit(false); return r; }, {});
  const d = e.dist; const pay = d?.payment_address;
  const line = pay ? [pay.address, pay.address2, pay.city, [pay.state, pay.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ") : "";
  return (
    <section className="card p-5 md:p-6" id="distribution">
      <Head title="Distribution Method" right={!edit && <button className="btn btn-secondary" onClick={() => setEdit(true)}>Edit</button>} />
      {!edit ? (
        <dl>{[["Payment Method", d?.payment_method], ["Bank Account Nickname", ""], ["Bank Name", ""], ["Routing Number", ""], ["Account Number", ""], ["Account Type", ""], ["Payee Name", d?.payee_name], ["Payment Address", line]].map(([l, v]) => <Row key={l} l={l!} v={v} />)}</dl>
      ) : (
        <form action={action} className="space-y-4">
          <label className="block"><span className={`label ${state.errors?.payment_method ? "!text-danger" : ""}`}>Payment Method *</span>
            <select name="payment_method" defaultValue={d?.payment_method ?? ""} className="input max-w-[320px]"><option value="">Select…</option>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</select><Err m={state.errors?.payment_method} /></label>
          <div><span className="label">Bank Account</span><div className="flex items-center gap-4"><select className="input max-w-[320px]" disabled><option>No bank accounts</option></select>
            <a href="#plaid" title="Stub — Plaid is not connected" onClick={(ev) => ev.preventDefault()}>Add New Bank Account</a></div></div>
          <label className="flex items-center gap-2"><input type="checkbox" name="custodian" defaultChecked={d?.is_custodian_fbo} /> This is a Custodian/FBO Account</label>
          <label className="block"><span className={`label ${state.errors?.payee_name ? "!text-danger" : ""}`}>Payee Name *</span><input name="payee_name" defaultValue={d?.payee_name ?? ""} className="input" /><Err m={state.errors?.payee_name} /></label>
          <div><div className="flex items-center justify-between"><span className="label">Payment Address</span>
            <button type="button" className="text-brand cursor-pointer" onClick={() => { setPa(e.taxAddress ?? {}); setAddrKey(addrKey + 1); }}>Use Tax Address</button></div>
            <AddressFields key={addrKey} prefix="pay" v={pa} /></div>
          <div className="flex items-center gap-5"><button className="btn btn-primary" disabled={pending}>Save</button><button type="button" className="text-brand cursor-pointer" onClick={() => setEdit(false)}>Cancel</button></div>
        </form>
      )}
    </section>
  );
}

function ContactsCard({ e }: { e: EntityView }) {
  const [open, setOpen] = useState<number | null>(null); const [menu, setMenu] = useState<number | null>(null); const [add, setAdd] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(async (p, f) => { const r = await addContact(e.id, p, f); if (r.ok) setAdd(false); return r; }, {});
  return (
    <section className="card p-5 md:p-6">
      <Head title="Contacts" right={<button className="btn btn-secondary" onClick={() => setAdd(!add)}>Add Contact</button>} />
      {add && (
        <form action={action} className="space-y-3 border hair rounded p-4 mb-4">
          <label className="block"><span className="label">Name</span><input name="name" className="input" /><Err m={state.errors?.name} /></label>
          <div className="grid sm:grid-cols-2 gap-3"><label><span className="label">Email</span><input name="email" type="email" className="input" /></label><label><span className="label">Phone</span><input name="phone" className="input" /></label></div>
          <div className="flex gap-6"><label className="flex items-center gap-2"><input type="checkbox" name="primary" /> Primary contact</label><label className="flex items-center gap-2"><input type="checkbox" name="signer" /> Required signer</label></div>
          <div className="flex items-center gap-5"><button className="btn btn-primary" disabled={pending}>Save</button><button type="button" className="text-brand cursor-pointer" onClick={() => setAdd(false)}>Cancel</button></div>
        </form>
      )}
      <table className="w-full"><thead><tr className="border-b hair"><th className="py-2 px-2">Name</th><th /></tr></thead>
        <tbody>{e.contacts.map((c) => (<Fragment key={c.id}>
          <tr className="border-b hair"><td className="py-3 px-2">{c.name}</td>
            <td className="py-3 px-2 text-right"><button className="text-brand cursor-pointer" aria-expanded={open === c.id} onClick={() => setOpen(open === c.id ? null : c.id)}>View Details</button></td></tr>
          {open === c.id && (<tr><td colSpan={2} className="px-2 py-4 bg-black/[.02]">
            <dl className="grid sm:grid-cols-2 gap-x-8">
              <Row l="Emails" v={c.emails.join(", ")} /><Row l="Phone Numbers" v={c.phones.join(", ")} /><Row l="Primary Contact" v={c.isPrimary ? "Yes" : "No"} />
              <Row l="Document Access" v={c.access} /><Row l="Required Signer" v={c.signer ? "Yes" : "No"} />
              <div className="relative"><dt className="label">Action</dt><dd><button aria-label="Contact actions" className="text-2xl leading-none cursor-pointer px-2" onClick={() => setMenu(menu === c.id ? null : c.id)}>⋮</button>
                {menu === c.id && <div className="absolute z-10 card py-1 w-36"><button className="block w-full text-left px-4 py-2 muted cursor-not-allowed" disabled title="Stub">Edit</button>
                  <button className="block w-full text-left px-4 py-2 cursor-pointer text-danger" onClick={async () => { await removeContact(e.id, c.id); setMenu(null); }}>Remove</button></div>}</dd></div>
            </dl></td></tr>)}
        </Fragment>))}</tbody></table>
      {e.contacts.length === 0 && <p className="muted py-4">No contacts yet.</p>}
    </section>
  );
}

export default function EntityDetail({ e }: { e: EntityView }) { return <div className="space-y-6"><DetailsCard e={e} /><DistributionCard e={e} /><ContactsCard e={e} /></div>; }
