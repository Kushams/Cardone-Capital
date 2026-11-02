"use client";
import { useActionState } from "react";
import { setPasswordAction } from "../actions";

export default function SetOpPwForm({ token, purpose }: { token: string; purpose: string }) {
  const [s, action, pending] = useActionState(setPasswordAction.bind(null, token), {} as { error?: string });
  return (<form action={action} className="mt-4">
    <p className="text-sm mb-4">{purpose === "INVITE" ? "Choose a password for your operator account. It is stored only as a secure hash — nobody can see it." : "Choose a new password for your operator account."}</p>
    <label className="block mb-4"><span className="label">New password</span><input name="password" type="password" autoComplete="new-password" required minLength={12} className="input !text-[#212529] !bg-white" /><span className="text-xs text-[#6c757d]">At least 12 characters.</span></label>
    <label className="block mb-4"><span className="label">Confirm password</span><input name="confirm" type="password" autoComplete="new-password" required className="input !text-[#212529] !bg-white" /></label>
    {s.error && <p role="alert" className="text-danger text-sm mb-3">{s.error}</p>}
    <button className="btn btn-primary mt-2" disabled={pending}>Set password</button></form>);
}
