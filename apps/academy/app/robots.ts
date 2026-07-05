import type { MetadataRoute } from "next";
import { academyConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/auth/", "/dashboard/", "/api/", "/courses/*/learn/"],
    },
    sitemap: `${academyConfig.url}/sitemap.xml`,
  };
}
