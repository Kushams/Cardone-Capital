/** Cardone Capital lockup. Artwork = the original logo extracted from the user-supplied login screenshot (public/logo-mask.png, 1544x446 alpha mask, ink #112847 sampled from the image).
 *  Rendered as a CSS mask coloured by --logo (the sampled navy on light themes, white on dark). Swap in the official SVG/PNG at the same slot when available. */
export default function Logo({ height = 44 }: { height?: number }) {
  return (
    <span role="img" aria-label="Cardone Capital" className="inline-block align-middle"
      style={{ width: height * (1544 / 446), height, backgroundColor: "var(--logo)", WebkitMaskImage: "url(/logo-mask.png)", maskImage: "url(/logo-mask.png)",
        WebkitMaskSize: "contain", maskSize: "contain", WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat", WebkitMaskPosition: "center", maskPosition: "center" }} />
  );
}
