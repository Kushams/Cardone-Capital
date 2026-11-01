"use client";
import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";

export default function LoginForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="mt-6">
      <input type="hidden" name="return" value={returnTo} />
      <label className="block mb-4"><span className="label !text-[var(--text)]">Email</span>
        <input name="email" type="email" autoComplete="username" required defaultValue={state.email ?? ""} className="input" /></label>
      <label className="block mb-4"><span className="label !text-[var(--text)]">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className="input" /></label>
      {state.error && <p role="alert" className="text-danger text-sm mb-3">{state.error}</p>}
      <div className="flex items-center justify-between mt-6">
        <button type="submit" disabled={pending} className="btn btn-primary">{pending ? "Logging in…" : "Log In"}</button>
        <Link href="/investor/forgot-password">Forgot password?</Link>
      </div>
    </form>
  );
}
