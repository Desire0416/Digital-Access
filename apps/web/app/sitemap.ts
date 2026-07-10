import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { getPublicPortfolio } from "@/lib/public-portfolio";
import { getPublishedSlugs } from "@/lib/public-blog";
import { serviceLandingSlugs } from "@/lib/service-pages";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();
  const [portfolio, posts] = await Promise.all([
    getPublicPortfolio(),
    getPublishedSlugs(),
  ]);

  // Pages principales (priorité haute pour l'accueil, services, tarifs).
  const primary = ["", "/services", "/tarifs", "/portfolio", "/academy", "/devis"];
  const secondary = ["/blog", "/a-propos", "/contact", "/faq"];
  const legal = ["/mentions-legales", "/cgu", "/confidentialite"];

  const staticRoutes = [
    ...primary.map((route) => ({
      url: `${base}${route}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.9,
    })),
    ...secondary.map((route) => ({
      url: `${base}${route}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...legal.map((route) => ({
      url: `${base}${route}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  // Pages de destination services (SEO local) — forte priorité.
  const services = serviceLandingSlugs.map((slug) => ({
    url: `${base}/services/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const work = portfolio.map((p) => ({
    url: `${base}/portfolio/${p.slug}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  const blog = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...services, ...work, ...blog];
}
