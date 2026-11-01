import type { Metadata } from "next";
import { pageTitle } from "@/lib/nav";
export const metadata: Metadata = { title: pageTitle("Contact Us") };
export default function Page() { return <h1 className="text-[40px] font-bold text-[#343a40]">Contact Us</h1>; }
