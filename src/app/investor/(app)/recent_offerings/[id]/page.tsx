import type { Metadata } from "next";
import { pageTitle } from "@/lib/nav";
export const metadata: Metadata = { title: pageTitle("Recent Offering") };
export default function Page() { return <h1 className="text-[40px] font-bold text-[#343a40]">Recent Offering</h1>; }
