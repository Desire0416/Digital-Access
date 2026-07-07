import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { blogPosts } from "@da/db";
import { getPublicPortfolio } from "@/lib/public-portfolio";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();
  const portfolio = await getPublicPortfolio();

  const staticRoutes = [
    "",
    "/services",
    "/portfolio",
    "/tarifs",
    "/blog",
    "/a-propos",
    "/contact",
    "/devis",
    "/academy",
    "/faq",
    "/mentions-legales",
    "/cgu",
    "/confidentialite",
  ].map((route) => ({
    url: `${base}${route}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.7,
  }));

  const work = portfolio.map((p) => ({
    url: `${base}/portfolio/${p.slug}`,
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  const posts = blogPosts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...work, ...posts];
}
