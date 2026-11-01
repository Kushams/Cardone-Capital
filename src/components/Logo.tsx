/** Cardone Capital lockup. Artwork = the original logo extracted from the user-supplied login screenshot (public/logo-mask.png, 768x220 alpha mask).
 *  Rendered as a CSS mask so it takes the surrounding text colour (navy on light, white on dark). Swap in the official SVG/PNG at the same slot when available. */
export default function Logo({ height = 44 }: { height?: number }) {
  return (
    <span role="img" aria-label="Cardone Capital" className="inline-block align-middle"
      style={{ width: height * (768 / 220), height, backgroundColor: "currentColor", WebkitMaskImage: "url(/logo-mask.png)", maskImage: "url(/logo-mask.png)",
        WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center" }} />
  );
}
