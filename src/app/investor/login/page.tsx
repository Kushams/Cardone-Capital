import type { Metadata } from "next";
import Logo from "@/components/Logo";
import LoginForm from "./LoginForm";
import { FIRM, KNOWLEDGE_BASE_URL, pageTitle } from "@/lib/nav";
import { getCurrentUser, safeReturn } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: pageTitle("Log In") };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ return?: string }> }) {
  const sp = await searchParams;
  const ret = sp.return ? safeReturn(sp.return) : "";
  if (await getCurrentUser()) redirect(ret || "/investor/investments");
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-10">
      {/* NO sign-up / create-account link anywhere: access is invite-only (CLONE-PROMPT §18) */}
      <div className="w-full max-w-[460px] bg-white border border-[#dee2e6] rounded-lg p-8 shadow-sm text-[#212529]">
        <div className="flex justify-center text-navy"><Logo height={56} /></div>
        <h1 className="text-[26px] font-bold text-center mt-6">Log in to your Investor Portal</h1>
        <LoginForm returnTo={ret} />
        <div className="mt-6"><a href={KNOWLEDGE_BASE_URL} target="_blank" rel="noreferrer">Knowledge Base ↗</a></div>
      </div>
      <footer className="mt-8 text-center text-sm text-[#6c757d] leading-6">
        <div>{FIRM.name}</div><div>{FIRM.phone}</div><div>{FIRM.email}</div>
      </footer>
    </div>
  );
}
