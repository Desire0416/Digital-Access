import "server-only";
import { prisma } from "@da/academy-db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Portfolio & employabilité — LECTURES (cahier §16.7 / §19.5).
   « Pas d'employabilité sans preuve » : un projet publié au portfolio provient
   TOUJOURS d'une soumission VALIDÉE (APPROVED). Le portfolio public agrège la
   présentation, les compétences, les projets (preuves), les certificats et les
   expériences saisies manuellement.
   Sécurité : l'éditeur est TOUJOURS scopé au userId de l'utilisateur courant ;
   la vue publique ne renvoie RIEN si le portfolio n'existe pas ou n'est pas public.
   ══════════════════════════════════════════════════════════════════════════ */

/** Normalise le champ Json `links` en un objet plat de liens sociaux. */
function normalizeLinks(links: unknown): { github: string | null; linkedin: string | null; website: string | null } {
  const src = links && typeof links === "object" && !Array.isArray(links) ? (links as Record<string, unknown>) : {};
  const pick = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return { github: pick(src.github), linkedin: pick(src.linkedin), website: pick(src.website) };
}

/* ─── Éditeur de portfolio (§16.7) — vue privée de l'utilisateur courant ───── */

/**
 * Données de l'éditeur : le portfolio (ou `null` s'il n'a jamais été créé), ses
 * items ordonnés, les projets publiables (= soumissions APPROVED de l'utilisateur,
 * avec l'état « déjà publié ») et les certificats actifs à mettre en avant.
 */
export async function getMyPortfolioEditor(userId: string) {
  const [portfolio, approvedSubmissions, certificates] = await Promise.all([
    prisma.portfolio.findUnique({
      where: { userId },
      select: {
        slug: true,
        isPublic: true,
        headline: true,
        about: true,
        tools: true,
        links: true,
        items: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            url: true,
            image: true,
            skills: true,
            order: true,
            submissionId: true,
          },
        },
      },
    }),
    prisma.submission.findMany({
      where: { userId, status: "APPROVED" },
      orderBy: { reviewedAt: "desc" },
      select: {
        id: true,
        isPublic: true,
        project: {
          select: {
            title: true,
            course: { select: { title: true } },
            careerPath: { select: { title: true } },
          },
        },
      },
    }),
    prisma.certificate.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { issuedAt: "desc" },
      select: { id: true, title: true, type: true, number: true },
    }),
  ]);

  const publishableProjects = approvedSubmissions.map((s) => ({
    submissionId: s.id,
    projectTitle: s.project.title,
    source: s.project.course?.title ?? s.project.careerPath?.title ?? "Projet",
    isPublished: s.isPublic,
  }));

  return {
    portfolio: portfolio
      ? {
          slug: portfolio.slug,
          isPublic: portfolio.isPublic,
          headline: portfolio.headline,
          about: portfolio.about,
          tools: portfolio.tools,
          links: normalizeLinks(portfolio.links),
        }
      : null,
    items: portfolio?.items ?? [],
    publishableProjects,
    certificates,
  };
}

export type MyPortfolioEditor = Awaited<ReturnType<typeof getMyPortfolioEditor>>;
export type PortfolioEditorItem = MyPortfolioEditor["items"][number];

/* ─── Portfolio public (§16.7) — /portfolio/[slug] ─────────────────────────── */

/**
 * Vue publique d'un portfolio. Renvoie `null` si le slug est introuvable OU si
 * le portfolio n'est pas public. Les compétences affichées = union dé-dupliquée
 * des compétences des projets (preuves) ET des certificats actifs du titulaire.
 */
export async function getPublicPortfolio(slug: string) {
  const portfolio = await prisma.portfolio.findUnique({
    where: { slug },
    select: {
      isPublic: true,
      userId: true,
      headline: true,
      about: true,
      tools: true,
      links: true,
      user: { select: { name: true, avatar: true } },
      items: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          url: true,
          image: true,
          skills: true,
          order: true,
        },
      },
    },
  });
  if (!portfolio || !portfolio.isPublic) return null;

  const certificates = await prisma.certificate.findMany({
    where: { userId: portfolio.userId, status: "ACTIVE" },
    orderBy: { issuedAt: "desc" },
    select: { title: true, type: true, number: true, issuedAt: true, verifyCode: true, skills: true },
  });

  const projects = portfolio.items.filter((i) => i.type === "PROJECT");
  const experiences = portfolio.items.filter((i) => i.type === "EXPERIENCE" || i.type === "LINK");

  // Compétences = union dé-dupliquée des skills des projets + des certificats actifs.
  const skills = [
    ...new Set([
      ...projects.flatMap((p) => p.skills),
      ...certificates.flatMap((c) => c.skills),
    ]),
  ];

  return {
    owner: {
      name: portfolio.user.name,
      avatar: portfolio.user.avatar,
      headline: portfolio.headline,
    },
    about: portfolio.about,
    tools: portfolio.tools,
    links: normalizeLinks(portfolio.links),
    skills,
    projects,
    experiences,
    certificates: certificates.map((c) => ({
      title: c.title,
      type: c.type,
      number: c.number,
      issuedAt: c.issuedAt,
      verifyCode: c.verifyCode,
    })),
  };
}

export type PublicPortfolio = NonNullable<Awaited<ReturnType<typeof getPublicPortfolio>>>;
export type PublicPortfolioItem = PublicPortfolio["projects"][number];
