/** Photo slot. With `src` it renders the real image (object-fit: cover in the same slot geometry the placeholder used);
 *  without one it falls back to neutral placeholder artwork (used only for gallery slides whose photos have not been delivered yet). */
export default function Photo({ seed, tag, className = "", label, src, fit = "cover" }: { seed: number; tag?: string; className?: string; label?: string; src?: string; fit?: "cover" | "contain" }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={label ?? ""} loading="lazy" decoding="async" className={`block w-full aspect-[600/340] ${fit === "contain" ? "object-contain" : "object-cover"} ${className}`} />;
  }
  const hues = [[205, 40], [195, 45], [215, 35], [180, 40], [225, 30]][seed % 5];
  const c1 = `hsl(${hues[0]} ${hues[1]}% 62%)`, c2 = `hsl(${hues[0] + 15} ${hues[1] + 10}% 36%)`;
  const bars = Array.from({ length: 9 }, (_, i) => ({ x: 20 + i * 62, h: 70 + ((seed * 37 + i * 53) % 110), w: 46 }));
  return (
    <svg viewBox="0 0 600 340" preserveAspectRatio="xMidYMid slice" className={`block w-full ${className}`} role="img" aria-label={label ?? "Property photo (placeholder)"}>
      <defs><linearGradient id={`g${seed}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor="#dfe9f0" /></linearGradient></defs>
      <rect width="600" height="340" fill={`url(#g${seed})`} />
      {bars.map((b, i) => (<g key={i}><rect x={b.x} y={300 - b.h} width={b.w} height={b.h} fill={c2} opacity=".85" />
        {Array.from({ length: Math.floor(b.h / 22) }, (_, r) => <rect key={r} x={b.x + 8} y={300 - b.h + 8 + r * 22} width="30" height="9" fill="#fff" opacity=".35" />)}</g>))}
      <rect y="300" width="600" height="40" fill="#5b8b4a" opacity=".55" />
      {tag && (<g><rect x="95" y="120" width="410" height="64" rx="6" fill="#000" opacity=".5" /><text x="300" y="161" textAnchor="middle" fontFamily="Arial" fontWeight="800" fontSize="22" fill="#fff" letterSpacing="1">{tag}</text></g>)}
    </svg>
  );
}
