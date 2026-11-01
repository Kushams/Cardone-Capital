import Logo from "./Logo";
import { FIRM } from "@/lib/nav";
export default function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#212529] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[470px] bg-white border border-[#dee2e6] rounded-[4px] px-5 py-8 sm:px-9">
        <div className="flex justify-center text-[#102a52]"><Logo height={70} /></div>
        <h1 className="text-[24px] font-light text-center mt-9">{title}</h1>
        {children}
      </div>
      <footer className="mt-8 text-center text-[17px] leading-7"><div>{FIRM.name}</div><div>{FIRM.phone}</div><div>{FIRM.email}</div></footer>
    </div>
  );
}
