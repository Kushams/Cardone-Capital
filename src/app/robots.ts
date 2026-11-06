import type { MetadataRoute } from "next";

/** Private investor portal: no crawling of anything (audit follow-up item 3). */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
