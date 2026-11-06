import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { pageTitle } from "@/lib/nav";

export const metadata: Metadata = {
  title: pageTitle("Investor Portal").replace("Investor Portal | ", ""),
  // Private portal: keep every page out of search indexes (audit follow-up item 3).
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const u = await getCurrentUser();
  return (
    <html lang="en" data-theme={u?.darkTheme ? "dark" : "light"}>
      <head><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
      <body>{children}</body>
    </html>
  );
}
