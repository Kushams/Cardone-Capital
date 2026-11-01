"use client";
import { useActionState } from "react";
import { setPasswordAction, type SetPwState } from "./actions";
export default function SetPwForm({ token, purpose }: { token: string; purpose: string }) {
  const [s, action, pending] = useActionState<SetPwState, FormData>(setPasswordAction, {});
  return (<form action={action} className="mt-6">
    <input type="hidden" name="token" value={token} />
    <p className="text-sm mb-4">{purpose === "INVITE" ? "Choose a password for your Investor Portal account. Nobody at the firm will ever see it." : "Choose a new password."}</p>
    <label className="block mb-4"><span className="label !text-[var(--text)]">New password</span><input name="password" type="password" autoComplete="new-password" required minLength={12} className="input !text-[#212529] !bg-white" /><span className="text-xs text-[#6c757d]">At least 12 characters.</span></label>
    <label className="block mb-4"><span className="label !text-[var(--text)]">Confirm password</span><input name="confirm" type="password" autoComplete="new-password" required className="input !text-[#212529] !bg-white" /></label>
    {s.error && <p role="alert" className="text-danger text-sm mb-3">{s.error}</p>}
    <button className="btn btn-primary mt-2" disabled={pending}>Set password</button></form>);
}
