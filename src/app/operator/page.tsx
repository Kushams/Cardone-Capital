import type { Metadata } from "next";
import { must, supabase } from "@/lib/supabase";
import { operatorKeyIsDefault } from "@/lib/operator";
import { currentOperator, inviteAction, reissueAction, revokeAction, commitmentAction, operatorLogout, addOperatorAction, resetOperatorAction, removeOperatorAction } from "./actions";
import OperatorLogin from "./OperatorLogin";
import { NEW_OFFERINGS } from "@/data/seed-data";
import { listOperators } from "@/lib/operators";
import { listActivity } from "@/lib/activity";

export const metadata: Metadata = { title: "Operator console | Cardone Capital" };

export default async function Operator({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string; pwset?: string }> }) {
  const sp = await searchParams;
  const banner = <div className="bg-[#fff3cd] border-b border-[#ffe69c] text-[#664d03] px-4 py-2 text-sm"><b>OPERATOR CONSOLE.</b> Not part of the client-facing portal.{operatorKeyIsDefault() && <b> Using the default dev passphrase — set OPERATOR_KEY.</b>}</div>;
  const me = await currentOperator();
  if (!me) return <div>{banner}{sp.pwset && <p role="status" className="max-w-[360px] mx-auto mt-6 p-3 rounded bg-[#d1e7dd]">Password set. Sign in with your email and password.</p>}<OperatorLogin hint={operatorKeyIsDefault()} /></div>;
  const operators = await listOperators();
  const canManage = me.kind === "passphrase" || me.operator.role === "SUPERADMIN";
  const activity = await listActivity(100);
  const sb = supabase();
  const authRows = must(await sb.from("authorized_emails").select("email, status, invite_expires_at, token_purpose").order("created_at", { ascending: false })) as any[];
  const obByEmail = new Map((must(await sb.from("clients").select("email, onboarding_completed_at")) as any[]).map((c) => [c.email, c.onboarding_completed_at]));
  const rows = authRows.map((a) => ({ email: a.email, status: a.status, x: a.invite_expires_at, p: a.token_purpose, ob: obByEmail.get(a.email) ?? null }));
  const outbox = must(await sb.from("outbox").select("id, to_email, subject, body, created_at").order("id", { ascending: false }).limit(10)) as any[];
  const clients = rows.filter((r) => r.ob);
  const th = "py-2 px-2 text-left";
  return (
    <div className="min-h-screen bg-white text-[#212529]">{banner}
      <main className="max-w-[1000px] mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center"><h1 className="text-3xl font-bold">Access allowlist</h1><div className="flex items-center gap-4"><span className="text-sm muted">{me.kind === "account" ? <>Signed in as <b>{me.operator.email}</b> · {me.operator.role === "SUPERADMIN" ? "Super admin" : "Staff"}</> : "Signed in via recovery passphrase"}</span><form action={operatorLogout}><button className="text-brand cursor-pointer">Lock</button></form></div></div>
        {sp.ok && <p role="status" className="p-3 rounded bg-[#d1e7dd]">Done.</p>}{sp.err && <p role="alert" className="p-3 rounded bg-[#f8d7da]">{sp.err}</p>}
        <form action={inviteAction} className="flex gap-3 items-end"><label className="flex-1"><span className="label">Add client email (after your conversation with them)</span><input name="email" type="email" required className="input" placeholder="client@example.com" /></label><button className="btn btn-primary">Invite</button></form>
        <table className="w-full text-sm"><thead><tr className="border-b"><th className={th}>Email</th><th className={th}>Status</th><th className={th}>Link</th><th className={th}>Onboarded</th><th /></tr></thead>
          <tbody>{rows.map((r) => (<tr key={r.email} className="border-b">
            <td className="py-2 px-2">{r.email}</td><td className="px-2">{r.status}</td>
            <td className="px-2">{r.x ? (new Date(r.x) > new Date() ? `${r.p} · expires ${r.x.slice(0, 16).replace("T", " ")}Z` : "expired") : "—"}</td><td className="px-2">{r.ob ? "yes" : "no"}</td>
            <td className="px-2 text-right whitespace-nowrap">
              <form action={reissueAction.bind(null, r.email)} className="inline"><button className="text-brand cursor-pointer mr-3">Re-issue link</button></form>
              {r.status !== "REVOKED" && <form action={revokeAction.bind(null, r.email)} className="inline"><button className="text-danger cursor-pointer">Revoke</button></form>}</td></tr>))}</tbody></table>

        <section><h2 className="text-2xl font-bold mb-3">Create commitment (generates the client’s documents)</h2>
          <form action={commitmentAction} className="flex flex-wrap gap-3 items-end">
            <label><span className="label">Onboarded client</span><select name="email" className="input min-w-[260px]">{clients.map((c) => <option key={c.email}>{c.email}</option>)}</select></label>
            <label><span className="label">Offering</span><select name="offering" className="input">{NEW_OFFERINGS.map((o) => <option key={o.portalId} value={o.portalId}>{o.name}</option>)}</select></label>
            <label><span className="label">Amount (USD)</span><input name="amount" className="input" defaultValue="200,000" /></label><button className="btn btn-primary">Create</button></form>
          <p className="text-sm muted mt-2">Creates the personalised Subscription Booklet + W-9 packet from the client’s own onboarding data and queues them under Documents → Signatures.</p></section>

        <section><h2 className="text-2xl font-bold mb-3">Operators</h2>
          <table className="w-full text-sm"><thead><tr className="border-b"><th className={th}>Email</th><th className={th}>Role</th><th className={th}>Password</th><th className={th}>Last sign in</th>{canManage && <th />}</tr></thead>
          <tbody>{operators.map((o) => (<tr key={o.id} className="border-b"><td className="py-2 px-2">{o.email}</td><td className="px-2">{o.role === "SUPERADMIN" ? "Super admin" : "Staff"}</td><td className="px-2">{o.password_hash ? "set" : "not set"}</td><td className="px-2">{o.last_login_at ? o.last_login_at.slice(0, 16).replace("T", " ") + "Z" : "—"}</td>
            {canManage && <td className="px-2 text-right whitespace-nowrap">
              <form action={resetOperatorAction.bind(null, o.id)} className="inline"><button className="text-brand cursor-pointer mr-3">{o.password_hash ? "Send reset link" : "Resend invite"}</button></form>
              <form action={removeOperatorAction.bind(null, o.id)} className="inline"><button className="text-danger cursor-pointer">Remove</button></form></td>}</tr>))}</tbody></table>
          {canManage ? (
            <form action={addOperatorAction} className="flex flex-wrap gap-3 items-end mt-4">
              <label className="flex-1 min-w-[240px]"><span className="label">Add staff member (email)</span><input name="email" type="email" required className="input" placeholder="colleague@firm.com" /></label>
              <label><span className="label">Role</span><select name="role" className="input"><option value="STAFF">Staff</option><option value="SUPERADMIN">Super admin</option></select></label>
              <button className="btn btn-primary">Add + send invite</button>
            </form>
          ) : (
            <p className="text-sm muted mt-2">Staff accounts are managed by the super admin (invest@).</p>
          )}</section>

        <section><h2 className="text-2xl font-bold mb-3">Activity log</h2>
          {activity.length === 0 ? <p className="muted">No activity recorded yet.</p> : (
            <div className="border rounded divide-y">
              {activity.map((e) => (
                <div key={e.id} className="px-3 py-2 text-sm flex flex-wrap gap-x-3">
                  <span className="muted">{String(e.created_at).slice(0, 16).replace("T", " ")}</span>
                  <b>{e.action}</b>
                  <span>{e.actor_type === "OPERATOR" ? "staff" : e.actor_type === "CLIENT" ? "client" : "system"}: {e.actor_email ?? "—"}</span>
                  {e.client_email && e.client_email !== e.actor_email ? <span className="muted">client: {e.client_email}</span> : null}
                  {e.detail ? <span className="muted">{e.detail}</span> : null}
                </div>
              ))}
            </div>
          )}
          <p className="text-sm muted mt-2">Staff and client actions across the portal, newest first.</p></section>

        <section><h2 className="text-2xl font-bold mb-3">Email log</h2>
          {outbox.length === 0 ? <p className="muted">Nothing sent.</p> : outbox.map((m) => (<details key={m.id} className="border rounded p-3 mb-2"><summary className="cursor-pointer">{String(m.created_at).slice(0, 16).replace("T", " ")} → <b>{m.to_email}</b> — {m.subject}</summary><pre className="whitespace-pre-wrap text-sm mt-2 break-all">{m.body}</pre></details>))}</section>
      </main></div>
  );
}
