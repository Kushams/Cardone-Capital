import type { Metadata } from "next";
import { must, supabase } from "@/lib/supabase";
import { operatorKeyIsDefault } from "@/lib/operator";
import { isOperator, inviteAction, reissueAction, revokeAction, commitmentAction, operatorLogout } from "./actions";
import OperatorLogin from "./OperatorLogin";
import { NEW_OFFERINGS } from "@/data/seed-data";

export const metadata: Metadata = { title: "Operator console (STUB) | Cardone Capital" };

export default async function Operator({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams;
  const banner = <div className="bg-[#fff3cd] border-b border-[#ffe69c] text-[#664d03] px-4 py-2 text-sm"><b>OPERATOR CONSOLE — STUB.</b> Not part of the client-facing portal. Email sending is simulated (see Outbox).{operatorKeyIsDefault() && <b> Using the default dev passphrase — set OPERATOR_KEY.</b>}</div>;
  if (!(await isOperator())) return <div>{banner}<OperatorLogin hint={operatorKeyIsDefault()} /></div>;
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
        <div className="flex justify-between items-center"><h1 className="text-3xl font-bold">Access allowlist</h1><form action={operatorLogout}><button className="text-brand cursor-pointer">Lock</button></form></div>
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

        <section><h2 className="text-2xl font-bold mb-3">Outbox (simulated email)</h2>
          {outbox.length === 0 ? <p className="muted">Nothing sent.</p> : outbox.map((m) => (<details key={m.id} className="border rounded p-3 mb-2"><summary className="cursor-pointer">{String(m.created_at).slice(0, 16).replace("T", " ")} → <b>{m.to_email}</b> — {m.subject}</summary><pre className="whitespace-pre-wrap text-sm mt-2 break-all">{m.body}</pre></details>))}</section>
      </main></div>
  );
}
