"use client";
import { useActionState, useState } from "react";
import { addBankAccount, removeBankAccount, type FormState } from "@/app/investor/(app)/settings/profile/actions";
import type { BankAccountView } from "@/lib/banks";

const Err = ({ m }: { m?: string }) => (m ? <span role="alert" className="text-danger text-sm block mt-1">{m}</span> : null);

/** Bank accounts for distributions (audit item 6): secure manual entry. Numbers are
 * encrypted at rest and only the last 4 digits are ever shown. */
export default function BankAccounts({ accounts, entities }: { accounts: BankAccountView[]; entities: { id: number; name: string }[] }) {
  const [add, setAdd] = useState(false);
  const [state, action, pending] = useActionState<FormState, FormData>(async (p, f) => { const r = await addBankAccount(p, f); if (r.ok) setAdd(false); return r; }, {});
  return (
    <div>
      {accounts.length === 0 && !add && <p>You have not added any bank accounts yet.</p>}
      {accounts.length > 0 && (
        <div className="overflow-x-auto"><table className="w-full">
          <thead><tr className="border-b hair"><th className="py-2 px-2">Nickname</th><th className="py-2 px-2">Bank</th><th className="py-2 px-2 hidden md:table-cell">Entity</th><th className="py-2 px-2 hidden md:table-cell">Type</th><th className="py-2 px-2">Account</th><th className="py-2 px-2" /></tr></thead>
          <tbody>{accounts.map((a) => (
            <tr key={a.id} className="border-b hair align-top">
              <td className="py-3 px-2">{a.nickname}</td>
              <td className="py-3 px-2">{a.bankName}</td>
              <td className="py-3 px-2 hidden md:table-cell">{a.entityName}</td>
              <td className="py-3 px-2 hidden md:table-cell">{a.accountType}</td>
              <td className="py-3 px-2">••••{a.accountLast4}<div className="text-xs muted">Routing ••••{a.routingLast4}</div></td>
              <td className="py-3 px-2 text-right"><button className="text-danger cursor-pointer" onClick={async () => { await removeBankAccount(a.id); }}>Remove</button></td>
            </tr>))}</tbody>
        </table></div>
      )}
      {add ? (
        <form action={action} className="space-y-3 border hair rounded p-4 mt-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block"><span className="label">Investing Entity *</span>
              <select name="entity_id" className="input" defaultValue={entities[0]?.id}><option value="">Select…</option>{entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select><Err m={state.errors?.bank} /></label>
            <label className="block"><span className="label">Account Nickname *</span><input name="nickname" className="input" placeholder="e.g. Main operating account" /><Err m={state.errors?.nickname} /></label>
            <label className="block"><span className="label">Bank Name *</span><input name="bank_name" className="input" /><Err m={state.errors?.bank_name} /></label>
            <label className="block"><span className="label">Account Type *</span>
              <select name="account_type" className="input" defaultValue="Checking"><option>Checking</option><option>Savings</option></select><Err m={state.errors?.account_type} /></label>
            <label className="block"><span className="label">Routing Number *</span><input name="routing" inputMode="numeric" autoComplete="off" className="input" placeholder="9 digits" /><Err m={state.errors?.routing} /></label>
            <label className="block"><span className="label">Account Number *</span><input name="account" inputMode="numeric" autoComplete="off" className="input" /><Err m={state.errors?.account} /></label>
            <label className="block"><span className="label">Confirm Account Number *</span><input name="account_confirm" inputMode="numeric" autoComplete="off" className="input" /><Err m={state.errors?.account_confirm} /></label>
          </div>
          <p className="text-xs muted">Your bank details are encrypted before they're stored, and only the last 4 digits are ever displayed. They're used to send your distributions.</p>
          <div className="flex items-center gap-5"><button className="btn btn-primary" disabled={pending}>Save Bank Account</button><button type="button" className="text-brand cursor-pointer" onClick={() => setAdd(false)}>Cancel</button></div>
        </form>
      ) : (
        <p className="mt-4"><button className="btn btn-secondary" onClick={() => setAdd(true)}>Add Bank Account</button></p>
      )}
      <p className="text-xs muted mt-4">Prefer to link your bank automatically? Plaid linking will plug into this same list once the firm enables it — for now, manual entry works the same way.</p>
    </div>
  );
}
