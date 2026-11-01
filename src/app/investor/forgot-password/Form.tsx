"use client";
import { useActionState } from "react";
import Link from "next/link";
import { forgotAction, type ForgotState } from "./actions";
export default function ForgotForm() {
  const [s, action, pending] = useActionState<ForgotState, FormData>(forgotAction, {});
  if (s.done) return (<div className="mt-6"><p role="status">If that email is authorized for the portal, a password-reset link has been sent. The link works once and expires in 48 hours.</p>
    <p className="mt-4"><Link href="/investor/login">Back to Log In</Link></p></div>);
  return (<form action={action} className="mt-6">
    <label className="block mb-4"><span className="label !text-[var(--text)]">Email</span><input name="email" type="email" required className="input !text-[#212529] !bg-white" /></label>
    <div className="flex items-center justify-between mt-6"><button className="btn btn-primary" disabled={pending}>Send reset link</button><Link href="/investor/login">Cancel</Link></div></form>);
}
