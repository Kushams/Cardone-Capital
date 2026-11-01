"use client";
import { useActionState } from "react";
import { operatorLogin } from "./actions";
export default function OperatorLogin({ hint }: { hint: boolean }) {
  const [s, action] = useActionState(operatorLogin, {} as { error?: string });
  return (<form action={action} className="max-w-[360px] mx-auto mt-20 space-y-4 text-[#212529]"><h1 className="text-2xl font-bold">Operator access</h1>
    <input name="key" type="password" placeholder="Passphrase" className="input !bg-white !text-[#212529]" />{s.error && <p role="alert" className="text-danger text-sm">{s.error}</p>}
    {hint && <p className="text-xs text-[#6c757d]">Dev default passphrase: operator-dev-key</p>}<button className="btn btn-primary">Unlock</button></form>);
}
