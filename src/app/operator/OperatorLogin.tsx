"use client";
import { useActionState } from "react";
import { operatorAccountLogin, operatorLogin } from "./actions";

export default function OperatorLogin({ hint }: { hint: boolean }) {
  const [s, accountAction] = useActionState(operatorAccountLogin, {} as { error?: string });
  const [p, passAction] = useActionState(operatorLogin, {} as { error?: string });
  return (<div className="max-w-[360px] mx-auto mt-20 space-y-10 text-[#212529]">
    <form action={accountAction} className="space-y-4">
      <h1 className="text-2xl font-bold">Operator access</h1>
      <label className="block"><span className="label">Email</span>
        <input name="email" type="email" autoComplete="username" required placeholder="invest@cardonecapitalportal.us" className="input !bg-white !text-[#212529]" /></label>
      <label className="block"><span className="label">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className="input !bg-white !text-[#212529]" /></label>
      {s.error && <p role="alert" className="text-danger text-sm">{s.error}</p>}
      <button className="btn btn-primary">Sign in</button>
    </form>
    <form action={passAction} className="space-y-4 border-t pt-6">
      <h2 className="text-base font-bold">Recovery passphrase</h2>
      <input name="key" type="password" placeholder="Passphrase" className="input !bg-white !text-[#212529]" />
      {p.error && <p role="alert" className="text-danger text-sm">{p.error}</p>}
      {hint && <p className="text-xs text-[#6c757d]">Dev default passphrase: operator-dev-key</p>}
      <button className="btn btn-secondary">Unlock with passphrase</button>
    </form>
  </div>);
}
