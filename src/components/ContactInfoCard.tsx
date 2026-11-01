"use client";
import { useActionState, useState } from "react";
import { updateContact, type FormState } from "@/app/investor/(app)/settings/profile/actions";

export default function ContactInfoCard({ c }: { c: { name: string; phone: string; address: string; loginEmail: string; email: string; fincen: string } }) {
  const [edit, setEdit] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(async (p, f) => { const r = await updateContact(p, f); if (r.ok) setEdit(false); return r; }, {});
  const Row = ({ l, v }: { l: string; v: string }) => <div><dt className="label">{l}</dt><dd className="mb-4">{v || "--"}</dd></div>;
  return (
    <section className="card p-5 md:p-6">
      <div className="flex items-center justify-between mb-4"><h2 className="text-[19px] md:text-[23px] font-bold">Contact Information</h2>
        {!edit && <button className="btn btn-secondary" onClick={() => setEdit(true)}>Edit</button>}</div>
      {!edit ? (
        <dl><Row l="Name" v={c.name} /><Row l="Phone" v={c.phone} /><Row l="Address" v={c.address} /><Row l="Login Email" v={c.loginEmail} /><Row l="Email" v={c.email} /><Row l="FinCEN ID" v={c.fincen} /></dl>
      ) : (
        <form action={action} className="space-y-4">
          <label className="block"><span className="label">Name</span><input name="name" defaultValue={c.name} className="input" required />{state.errors?.name && <span className="text-danger text-sm">{state.errors.name}</span>}</label>
          <label className="block"><span className="label">Phone</span><input name="phone" defaultValue={c.phone} className="input" /></label>
          <label className="block"><span className="label">Address</span><input name="address" defaultValue={c.address} className="input" /></label>
          <p className="muted text-sm">Login Email, Email and FinCEN ID are managed by the firm.</p>
          <div className="flex items-center gap-5"><button className="btn btn-primary" disabled={pending}>Save</button><button type="button" className="text-brand cursor-pointer" onClick={() => setEdit(false)}>Cancel</button></div>
        </form>
      )}
    </section>
  );
}
