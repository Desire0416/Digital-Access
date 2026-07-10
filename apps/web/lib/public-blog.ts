import { prisma } from "@da/db/client";
import { blogPosts as mockPosts } from "@da/db";
import type { BlogPostPreview } from "@da/db";

/* ══════════════════════════════════════════════════════════════════════════
   Blog public — source de vérité = la base (articles rédigés / publiés depuis
   /admin/blog). On n'expose QUE les articles PUBLISHED. Repli automatique sur
   le mock si la base est vide ou injoignable (propriété « runs-without-DB »).
   Ainsi les articles créés dans le back-office apparaissent réellement en ligne.
   ══════════════════════════════════════════════════════════════════════════ */

interface BlogRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string | null;
  tags: string[];
  readMinutes: number;
  publishedAt: Date | null;
  createdAt: Date;
  author: { name: string; avatar: string | null } | null;
}

function toPreview(p: BlogRow): BlogPostPreview {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    content: p.content,
    coverImage: p.coverImage ?? undefined,
    category: p.category ?? "Actualités",
    tags: p.tags,
    author: {
      name: p.author?.name ?? "Équipe Digital Access",
      avatar: p.author?.avatar ?? undefined,
    },
    readMinutes: p.readMinutes,
    publishedAt: (p.publishedAt ?? p.createdAt).toISOString(),
  };
}

const SELECT = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  coverImage: true,
  category: true,
  tags: true,
  readMinutes: true,
  publishedAt: true,
  createdAt: true,
  author: { select: { name: true, avatar: true } },
} as const;

/** Tous les articles publiés (plus récents d'abord). Repli sur le mock si base vide/injoignable. */
export async function getPublishedPosts(): Promise<BlogPostPreview[]> {
  try {
    const rows = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: SELECT,
    });
    if (rows.length === 0) return mockPosts;
    return rows.map(toPreview);
  } catch {
    return mockPosts;
  }
}

/** Un article publié par slug. Repli sur le mock (par slug) si base vide/injoignable. */
export async function getPostBySlug(slug: string): Promise<BlogPostPreview | undefined> {
  try {
    const row = await prisma.blogPost.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: SELECT,
    });
    if (row) return toPreview(row);
    // Repli : article présent uniquement dans le mock.
    return mockPosts.find((p) => p.slug === slug);
  } catch {
    return mockPosts.find((p) => p.slug === slug);
  }
}

/** Slugs de tous les articles publiés (sitemap). Repli sur le mock. */
export async function getPublishedSlugs(): Promise<{ slug: string; publishedAt: string }[]> {
  const posts = await getPublishedPosts();
  return posts.map((p) => ({ slug: p.slug, publishedAt: p.publishedAt }));
}
