export default function PageTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <h1 className="text-[34px] md:text-[40px] leading-tight font-bold text-[#343a40] dark:text-[var(--text)]">{children}</h1>
      {right}
    </div>
  );
}
