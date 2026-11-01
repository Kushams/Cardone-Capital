import Logo from "./Logo";
import { FIRM } from "@/lib/nav";
export default function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#212529] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[460px] bg-white border border-[#dee2e6] rounded-lg p-8 shadow-sm">
        <div className="flex justify-center text-navy"><Logo height={56} /></div>
        <h1 className="text-[24px] font-bold text-center mt-6">{title}</h1>
        {children}
      </div>
      <footer className="mt-8 text-center text-sm text-[#6c757d] leading-6"><div>{FIRM.name}</div><div>{FIRM.phone}</div><div>{FIRM.email}</div></footer>
    </div>
  );
}
