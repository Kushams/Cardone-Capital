"use client";
import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";
import { KNOWLEDGE_BASE_URL } from "@/lib/nav";

export default function LoginForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  const field = "w-full h-[40px] border border-[#c9d1e0] rounded-[4px] px-3 text-[14px] bg-white text-[#212529] focus:outline-2 focus:outline-[#0175d8] focus:-outline-offset-1";
  return (
    <form action={action} className="mt-8">
      <input type="hidden" name="return" value={returnTo} />
      <label className="block mb-6"><span className="block text-[#6c757d] text-[14px] mb-2">Email</span>
        <input name="email" type="email" autoComplete="username" required defaultValue={state.email ?? ""} className={field} /></label>
      <label className="block mb-3"><span className="block text-[#6c757d] text-[14px] mb-2">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className={field} /></label>
      {state.error && <p role="alert" className="text-danger text-sm mb-2">{state.error}</p>}
      <div className="flex justify-end mt-6"><Link href="/investor/forgot-password" className="underline text-[14px]">Forgot password?</Link></div>
      <div className="flex items-center justify-between mt-3">
        <button type="submit" disabled={pending} className="btn btn-primary !px-[14px] !py-[7px] text-[14px]">{pending ? "Logging in…" : "Log In"}</button>
        <a href={KNOWLEDGE_BASE_URL} target="_blank" rel="noreferrer" className="text-[14px]">Knowledge Base
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="inline-block ml-1.5 -mt-0.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" /></svg></a>
      </div>
    </form>
  );
}
