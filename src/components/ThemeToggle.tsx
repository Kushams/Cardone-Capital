"use client";
import { useOptimistic, useTransition } from "react";
import { setDarkTheme } from "@/app/investor/(app)/settings/profile/actions";

export default function ThemeToggle({ dark }: { dark: boolean }) {
  const [opt, setOpt] = useOptimistic(dark);
  const [, start] = useTransition();
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <span>Dark theme</span>
      <button role="switch" aria-checked={opt} aria-label="Dark theme" data-testid="dark-toggle"
        onClick={() => start(async () => { setOpt(!opt); await setDarkTheme(!opt); })}
        className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${opt ? "bg-brand" : "bg-[#adb5bd]"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${opt ? "translate-x-6" : ""}`} />
      </button>
    </label>
  );
}
