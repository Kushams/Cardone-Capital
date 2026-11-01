"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { NAV, KNOWLEDGE_BASE_URL } from "@/lib/nav";
import { logoutAction } from "@/app/investor/login/actions";

const ExtIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="inline-block ml-1 -mt-0.5">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14 21 3" />
  </svg>
);

function UserMenu({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} className="text-brand text-[15px] md:text-base flex items-center gap-1 cursor-pointer" data-testid="user-menu">
        {name}<span aria-hidden className="text-[9px] ml-0.5">▼</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-44 card py-1 z-50 shadow-lg">
          <Link role="menuitem" href="/investor/settings/profile" className="block px-4 py-2 hover:bg-black/5 text-[var(--text)]" onClick={() => setOpen(false)}>My Profile</Link>
          <form action={logoutAction}><button role="menuitem" className="w-full text-left px-4 py-2 hover:bg-black/5 cursor-pointer">Log Out</button></form>
        </div>
      )}
    </div>
  );
}

function NavList({ badge, onNavigate, mobile }: { badge: number; onNavigate?: () => void; mobile?: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Main">
      {NAV.map((n) => {
        const active = n.match.test(path);
        return (
          <Link key={n.href} href={n.href} onClick={onNavigate}
            className={`flex items-center gap-3 text-white hover:no-underline ${mobile ? "h-[58.500px] px-4 text-xl" : "h-[52px] px-6 text-[15px]"} ${active ? "bg-active" : "hover:bg-white/10"}`}
            aria-current={active ? "page" : undefined}>
            {n.label}
            {"badge" in n && badge > 0 && <span className="badge-yellow" data-testid="badge-new">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppShell({ userName, newBadge, children }: { userName: string; newBadge: number; children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const path = usePathname();
  useEffect(() => setDrawer(false), [path]);
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-[var(--header)] shadow-[0_1px_6px_rgba(0,0,0,.12)] relative z-30">
        {/* desktop */}
        <div className="hidden md:flex items-center justify-between h-[72px] px-6">
          <Link href="/investor/investments" aria-label="Dashboard" className="text-navy dark:text-white"><Logo height={44} /></Link>
          <div className="flex items-center gap-8">
            <a href={KNOWLEDGE_BASE_URL} target="_blank" rel="noreferrer" className="text-brand">Knowledge Base<ExtIcon /></a>
            <UserMenu name={userName} />
          </div>
        </div>
        {/* mobile */}
        <div className="md:hidden flex items-center justify-between h-[72px] px-4">
          <button onClick={() => setDrawer(!drawer)} aria-label="Menu" aria-expanded={drawer} className="flex flex-col items-center text-brand cursor-pointer" data-testid="hamburger">
            <svg width="26" height="22" viewBox="0 0 26 22" aria-hidden><rect y="1" width="26" height="4.200" rx="1" fill="currentColor" /><rect y="8.900" width="26" height="4.200" rx="1" fill="currentColor" /><rect y="16.800" width="26" height="4.200" rx="1" fill="currentColor" /></svg>
            <span className="text-[9px] leading-3 mt-0.5">MENU</span>
          </button>
          <div className="flex items-center gap-5">
            <a href={KNOWLEDGE_BASE_URL} target="_blank" rel="noreferrer" className="text-brand text-[15px]">Knowledge Base<ExtIcon /></a>
            <UserMenu name={userName} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        <aside className="hidden md:block w-[240px] shrink-0 bg-navy pt-2" aria-label="Sidebar"><NavList badge={newBadge} /></aside>
        {drawer && <div className="md:hidden fixed inset-0 top-[72px] z-20" onClick={() => setDrawer(false)} aria-hidden />}
        <aside data-testid="drawer" aria-hidden={!drawer}
          className={`md:hidden fixed top-[72px] bottom-0 left-0 w-1/2 min-w-[220px] bg-navy z-30 transition-transform duration-200 ${drawer ? "translate-x-0" : "-translate-x-full"}`}>
          <NavList badge={newBadge} mobile onNavigate={() => setDrawer(false)} />
        </aside>
        <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
