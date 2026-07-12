import type { MetadataRoute } from "next";
import { prisma } from "@da/academy-db/client";
import { siteConfig } from "@/lib/site";

/* ══════════════════════════════════════════════════════════════════════════
   Sitemap — routes publiques statiques + contenus PUBLISHED depuis la base
   (formations, parcours métiers, écoles). URLs françaises du cahier §44.
   ══════════════════════════════════════════════════════════════════════════ */

const STATIC_ROUTES: Array<{ path: string; priority: number }> = [
  { path: "", priority: 1 },
  { path: "/formations", priority: 0.9 },
  { path: "/parcours-metiers", priority: 0.9 },
  { path: "/ecoles", priority: 0.8 },
  { path: "/certifications", priority: 0.7 },
  { path: "/certificats/verifier", priority: 0.5 },
  { path: "/entreprises", priority: 0.6 },
  { path: "/a-propos", priority: 0.5 },
  { path: "/contact", priority: 0.5 },
  { path: "/connexion", priority: 0.3 },
  { path: "/inscription", priority: 0.4 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority,
  }));

  try {
    const [courses, paths, schools] = await Promise.all([
      prisma.course.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.careerPath.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.school.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    for (const c of courses) {
      entries.push({
        url: `${base}/formations/${c.slug}`,
        lastModified: c.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const p of paths) {
      entries.push({
        url: `${base}/parcours-metiers/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    for (const s of schools) {
      entries.push({
        url: `${base}/ecoles/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    // Base indisponible au moment du build : on sert au moins les routes statiques.
  }

  return entries;
}
