import type { Metadata } from "next";
import Logo from "@/components/Logo";
import LoginForm from "./LoginForm";
import { FIRM, pageTitle } from "@/lib/nav";
import { getCurrentUser, safeReturn } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: pageTitle("Log In") };

/** Layout matches the original (user-supplied mobile screenshot): bordered card centred vertically, light-weight heading,
 *  "Forgot password?" above a Log In / Knowledge Base row, firm contact lines pinned to the bottom. NO sign-up link (§18). */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ return?: string }> }) {
  const sp = await searchParams;
  const ret = sp.return ? safeReturn(sp.return) : "";
  if (await getCurrentUser()) redirect(ret || "/investor/investments");
  return (
    <div className="min-h-screen bg-white text-[#212529] flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 pt-16 pb-8">
        <div className="w-full max-w-[470px] bg-white border border-[#dee2e6] rounded-[4px] px-5 py-8 sm:px-9">
          <div className="flex justify-center text-[#102a52]"><Logo height={78} /></div>
          <h1 className="text-[21px] font-light text-center mt-9">Log in to your Investor Portal</h1>
          <LoginForm returnTo={ret} />
        </div>
      </main>
      <footer className="text-center text-[15px] leading-7 pb-12 sm:pb-10 pt-4">
        <div>{FIRM.name}</div><div>{FIRM.phone}</div><div>{FIRM.email}</div>
      </footer>
    </div>
  );
}
