import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import OnboardingForm from "./Form";
import { requireUser } from "@/lib/auth";
import { pageTitle } from "@/lib/nav";
import { logoutAction } from "../login/actions";

export const metadata: Metadata = { title: pageTitle("Welcome") };

export default async function Onboarding() {
  const u = await requireUser("/investor/onboarding");
  if (u.onboarded) redirect("/investor/investments");
  return (
    <div className="min-h-screen">
      <header className="bg-[var(--header)] shadow-[0_1px_6px_rgba(0,0,0,.12)] h-[72px] px-6 flex items-center justify-between">
        <span className="text-navy dark:text-white"><Logo height={44} /></span>
        <form action={logoutAction}><button className="text-brand cursor-pointer">Log Out</button></form>
      </header>
      <main className="max-w-[820px] mx-auto px-4 py-8">
        <h1 className="text-[28px] md:text-[33px] font-bold text-[var(--heading)]">Welcome to your Investor Portal</h1>
        <p className="mt-2 mb-6">Please complete your investor profile. This information is used to prepare your investment documents, so it must match your legal records.</p>
        <div className="card p-6"><OnboardingForm email={u.email} /></div>
      </main>
    </div>
  );
}
