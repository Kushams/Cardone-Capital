export default function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`card p-5 md:p-6 ${className}`}>{children}</section>;
}
