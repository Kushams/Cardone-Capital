import type { Metadata } from "next";
import Link from "next/link";
import { lookupOperatorToken } from "@/lib/operators";
import SetOpPwForm from "./Form";

export const metadata: Metadata = { title: "Set operator password | Cardone Capital" };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const info = await lookupOperatorToken(token);
  return (
    <div className="min-h-screen bg-white text-[#212529]">
      <main className="max-w-[420px] mx-auto p-6 mt-16">
        <h1 className="text-2xl font-bold mb-2">{info?.purpose === "RESET" ? "Reset your operator password" : "Set your operator password"}</h1>
        {info ? <SetOpPwForm token={token!} purpose={info.purpose} /> : (
          <div><p role="alert">This link is invalid or has expired.</p>
            <p className="mt-4 text-sm">Links work once and expire after 48 hours. Ask the super admin to issue a new one.</p>
            <p className="mt-4"><Link href="/operator" className="text-brand">Back to operator sign in</Link></p></div>)}
      </main>
    </div>
  );
}
