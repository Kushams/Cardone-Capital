import type { Metadata } from "next";
import AuthCard from "@/components/AuthCard";
import ForgotForm from "./Form";
import { pageTitle } from "@/lib/nav";
export const metadata: Metadata = { title: pageTitle("Forgot Password") };
export default function Page() { return <AuthCard title="Reset your password"><ForgotForm /></AuthCard>; }
