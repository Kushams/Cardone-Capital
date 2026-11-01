import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { requireUser } from "@/lib/auth";
import { NEW_OFFERINGS } from "@/data/seed-data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  if (!u.onboarded) redirect("/investor/onboarding"); // mandatory first-login form (§18)
  const newBadge = NEW_OFFERINGS.filter((o) => o.isNew).length; // preserved quirk: badge counts NEW flags (3) while 4 cards exist
  return <AppShell userName={u.fullName ?? u.email} newBadge={newBadge}>{children}</AppShell>;
}
