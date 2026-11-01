/** The real Cardone Capital logo (images/logo/cardone-capital-logo.png, 800x229 RGBA). Dark theme inverts it to white via CSS (.logo-img). */
export default function Logo({ height = 44 }: { height?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/images/logo/cardone-capital-logo.png" alt="Cardone Capital" width={Math.round(height * (800 / 229))} height={height} className="logo-img inline-block align-middle" style={{ height, width: "auto" }} />;
}
