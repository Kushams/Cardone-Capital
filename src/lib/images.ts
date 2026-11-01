import { existsSync } from "node:fs";
import path from "node:path";
import type { Offering } from "@/data/types";

/** Hero slot of a New Offering detail page. The exact hero files (images/new-offerings/fund-NN-hero.*) arrive in a later top-up;
 *  until then the fund's card photo fills the slot. When a hero file appears it is used automatically — no code change. */
export function heroFor(o: Offering): string | undefined {
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const rel = `new-offerings/${o.heroSlug}-hero.${ext}`;
    if (existsSync(path.join(process.cwd(), "images", rel))) return "/images/" + rel;
  }
  return o.cardImage;
}
