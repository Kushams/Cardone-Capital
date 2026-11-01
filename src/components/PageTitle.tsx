export default function PageTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <h1 className="text-[30px] md:text-[35px] leading-tight font-bold text-[var(--heading)]">{children}</h1>
      {right}
    </div>
  );
}
