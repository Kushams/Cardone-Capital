/** Recreation of the Cardone Capital lockup (dark-navy stylised "C", CARDONE bold caps, CAPITAL letter-spaced beneath).
 *  NOTE: production artwork was not in the kit — drop the official SVG into this slot at the same size. */
export default function Logo({ height = 44, color = "#002c4f" }: { height?: number; color?: string }) {
  const w = height * 4.1;
  return (
    <svg role="img" aria-label="Cardone Capital" width={w} height={height} viewBox="0 0 205 50" fill={color}>
      <g>
        <path d="M24 3C12.4 3 3 12.4 3 24s9.4 21 21 21c6.6 0 12.2-3 16-7.7l-6.2-5C31.400 35 28 37 24 37c-7.200 0-13-5.800-13-13S16.800 11 24 11c4 0 7.400 1.900 9.700 4.700l6.200-5C36.200 6 30.600 3 24 3z" />
        <path d="M24 17.500c-3.600 0-6.500 2.900-6.500 6.500s2.900 6.500 6.500 6.500c1.900 0 3.500-.8 4.700-2l-3-3.300c-.4.500-1 .8-1.700.8-1.100 0-2.100-.9-2.100-2s.9-2 2.100-2c.7 0 1.300.3 1.700.8l3-3.300c-1.200-1.200-2.800-2-4.700-2z" opacity=".0" />
      </g>
      <text x="55" y="26" fontFamily="'Nunito Sans Variable','Helvetica Neue',Arial,sans-serif" fontWeight="900" fontSize="25" letterSpacing="1">CARDONE</text>
      <text x="56" y="43" fontFamily="'Nunito Sans Variable','Helvetica Neue',Arial,sans-serif" fontWeight="600" fontSize="12.500" letterSpacing="9.500">CAPITAL</text>
    </svg>
  );
}
