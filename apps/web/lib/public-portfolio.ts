import { prisma } from "@da/db/client";
import { portfolio as mockPortfolio, type PortfolioItem } from "@da/db";

/* ══════════════════════════════════════════════════════════════════════════
   Réalisations publiques — source de vérité = la base (pilotée par le CRM
   admin). Repli automatique sur les données mock si la base est vide ou
   injoignable, afin que le site vitrine reste fonctionnel sans base
   provisionnée (propriété « runs-without-DB » du projet).
   ══════════════════════════════════════════════════════════════════════════ */

/** Clés d'enum ProjectType (réalisations créées via le CRM) → libellé lisible.
 *  Les réalisations seedées stockent déjà un libellé → simple passthrough. */
const TYPE_LABEL: Record<string, string> = {
  SITE_VITRINE: "Site vitrine",
  SITE_INSTITUTIONNEL: "Site institutionnel",
  ELEARNING: "E-learning",
  REFONTE: "Refonte",
  MAINTENANCE: "Maintenance",
  OTHER: "Autre",
};

interface PortfolioRow {
  id: string;
  title: string;
  slug: string;
  description: string;
  client: string;
  type: string;
  category: string;
  year: number;
  url: string | null;
  coverImage: string | null;
  images: string[];
  technologies: string[];
  featured: boolean;
}

function toItem(p: PortfolioRow): PortfolioItem {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description,
    client: p.client,
    type: TYPE_LABEL[p.type] ?? p.type,
    category: p.category,
    url: p.url ?? undefined,
    coverImage: p.coverImage ?? undefined,
    images: p.images,
    technologies: p.technologies,
    featured: p.featured,
    year: p.year,
  };
}

/** Toutes les réalisations publiques, dans l'ordre de curation (seed) puis les
 *  ajouts du CRM. Repli sur le mock si la base est vide/injoignable. */
export async function getPublicPortfolio(): Promise<PortfolioItem[]> {
  try {
    const rows = await prisma.portfolioProject.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        client: true,
        type: true,
        category: true,
        year: true,
        url: true,
        coverImage: true,
        images: true,
        technologies: true,
        featured: true,
      },
    });
    if (rows.length === 0) return mockPortfolio;
    return rows.map(toItem);
  } catch {
    return mockPortfolio;
  }
}

/** Une réalisation par slug (mêmes données que la liste publique). */
export async function getPublicPortfolioItem(
  slug: string,
): Promise<PortfolioItem | undefined> {
  const all = await getPublicPortfolio();
  return all.find((p) => p.slug === slug);
}
