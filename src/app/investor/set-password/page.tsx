import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import SetPwForm from "./Form";
import { lookupToken } from "@/lib/invites";
import { pageTitle } from "@/lib/nav";
export const metadata: Metadata = { title: pageTitle("Set Password") };
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const info = await lookupToken(token);
  return (
    <AuthCard title={info?.purpose === "RESET" ? "Reset your password" : "Create your password"}>
      {info ? <SetPwForm token={token!} purpose={info.purpose} /> : (
        <div className="mt-6"><p role="alert">This link is invalid or has expired.</p><p className="mt-4 text-sm">Links work once and expire after 48 hours. Contact the firm to receive a new invitation.</p><p className="mt-4"><Link href="/investor/login">Log In</Link></p></div>)}
    </AuthCard>
  );
}
