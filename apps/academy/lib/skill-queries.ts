import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@da/academy-db/client";
import { requireAdminFresh } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Compétences (§21) — LECTURES. Le référentiel `Skill` est global (géré en
   admin) ; les rattachements `CourseSkill` portent le niveau visé + primaire.
   Le profil de compétences de l'apprenant est DÉRIVÉ de ses formations
   acquises (aucune table dédiée) : preuve = achèvement / certificat.
   ══════════════════════════════════════════════════════════════════════════ */

async function guard() {
  const admin = await requireAdminFresh();
  if (!admin) redirect("/connexion?callbackUrl=%2Fadmin");
  return admin;
}

/* ─── Niveaux (enum SkillLevel) ────────────────────────────────────────────── */

export const LEVEL_ORDER = { DISCOVERY: 0, BEGINNER: 1, OPERATIONAL: 2, ADVANCED: 3, EXPERT: 4 } as const;
export type SkillLevelName = keyof typeof LEVEL_ORDER;
export const SKILL_LEVELS: SkillLevelName[] = ["DISCOVERY", "BEGINNER", "OPERATIONAL", "ADVANCED", "EXPERT"];
export const SKILL_LEVEL_LABEL: Record<SkillLevelName, string> = {
  DISCOVERY: "Découverte",
  BEGINNER: "Débutant",
  OPERATIONAL: "Opérationnel",
  ADVANCED: "Avancé",
  EXPERT: "Expert",
};

function levelName(v: unknown): SkillLevelName {
  return typeof v === "string" && v in LEVEL_ORDER ? (v as SkillLevelName) : "OPERATIONAL";
}
function maxLevel(a: SkillLevelName, b: SkillLevelName): SkillLevelName {
  return LEVEL_ORDER[a] >= LEVEL_ORDER[b] ? a : b;
}

/* ─── Admin : référentiel complet ──────────────────────────────────────────── */

export type AdminSkillRow = {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  description: string | null;
  courseCount: number;
};

/** Toutes les compétences + nombre de formations rattachées. Gardé admin. */
export async function getSkillsAdmin(): Promise<AdminSkillRow[]> {
  await guard();
  const rows = await prisma.skill.findMany({
    orderBy: [{ domain: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      description: true,
      _count: { select: { courses: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    domain: r.domain,
    description: r.description,
    courseCount: r._count.courses,
  }));
}

/** Options pour le sélecteur de compétences du constructeur de formation.
 *  NON gardé : la route (éditeur) est déjà protégée par requireCourseEditor. */
export type SkillOption = { id: string; name: string; slug: string; domain: string | null };
export async function getSkillOptions(): Promise<SkillOption[]> {
  return prisma.skill.findMany({
    orderBy: [{ domain: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, domain: true },
  });
}

/* ─── Apprenant : profil / passeport de compétences (§21.4) ────────────────── */

export type CompetenceSource = { courseTitle: string; courseSlug: string; level: SkillLevelName; completed: boolean };
export type CompetenceCard = {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  level: SkillLevelName;
  levelLabel: string;
  certified: boolean;
  sources: CompetenceSource[];
};
export type LearnerCompetences = {
  totalAcquired: number;
  totalInProgress: number;
  totalCertified: number;
  /** Compétences acquises, groupées par domaine (domaine « Autres » si null). */
  groups: { domain: string; skills: CompetenceCard[] }[];
  /** Compétences en cours d'acquisition (formation en cours, non terminée). */
  inProgress: CompetenceCard[];
};

/**
 * Dérive les compétences de l'apprenant depuis ses inscriptions :
 *   · formation COMPLETED  → compétence ACQUISE (niveau = targetLevel),
 *   · formation ACTIVE     → compétence EN COURS,
 * la preuve étant l'achèvement (et, le cas échéant, un certificat ACTIF).
 */
export async function getLearnerCompetences(userId: string): Promise<LearnerCompetences> {
  const [enrollments, certs] = await Promise.all([
    prisma.enrollment.findMany({
      where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } },
      select: {
        status: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            skills: {
              select: {
                targetLevel: true,
                skill: { select: { id: true, name: true, slug: true, domain: true } },
              },
            },
          },
        },
      },
    }),
    prisma.certificate.findMany({
      where: { userId, status: "ACTIVE", courseId: { not: null } },
      select: { courseId: true },
    }),
  ]);

  const certifiedCourseIds = new Set(certs.map((c) => c.courseId));

  type Agg = {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    acquiredLevel: SkillLevelName | null;
    inProgressLevel: SkillLevelName | null;
    certified: boolean;
    sources: CompetenceSource[];
  };
  const map = new Map<string, Agg>();

  for (const e of enrollments) {
    const completed = e.status === "COMPLETED";
    for (const cs of e.course.skills) {
      const s = cs.skill;
      const level = levelName(cs.targetLevel);
      const cur =
        map.get(s.id) ??
        { id: s.id, name: s.name, slug: s.slug, domain: s.domain, acquiredLevel: null, inProgressLevel: null, certified: false, sources: [] };

      cur.sources.push({ courseTitle: e.course.title, courseSlug: e.course.slug, level, completed });
      if (completed) {
        cur.acquiredLevel = cur.acquiredLevel ? maxLevel(cur.acquiredLevel, level) : level;
        if (certifiedCourseIds.has(e.course.id)) cur.certified = true;
      } else {
        cur.inProgressLevel = cur.inProgressLevel ? maxLevel(cur.inProgressLevel, level) : level;
      }
      map.set(s.id, cur);
    }
  }

  const acquired: CompetenceCard[] = [];
  const inProgress: CompetenceCard[] = [];
  for (const a of map.values()) {
    // Preuves triées : formations terminées d'abord.
    const sources = a.sources.sort((x, y) => Number(y.completed) - Number(x.completed));
    if (a.acquiredLevel) {
      acquired.push({
        id: a.id, name: a.name, slug: a.slug, domain: a.domain,
        level: a.acquiredLevel, levelLabel: SKILL_LEVEL_LABEL[a.acquiredLevel],
        certified: a.certified, sources,
      });
    } else if (a.inProgressLevel) {
      inProgress.push({
        id: a.id, name: a.name, slug: a.slug, domain: a.domain,
        level: a.inProgressLevel, levelLabel: SKILL_LEVEL_LABEL[a.inProgressLevel],
        certified: false, sources,
      });
    }
  }

  // Groupe les acquises par domaine (niveau décroissant, puis nom).
  const byDomain = new Map<string, CompetenceCard[]>();
  for (const c of acquired) {
    const key = c.domain?.trim() || "Autres compétences";
    (byDomain.get(key) ?? byDomain.set(key, []).get(key)!).push(c);
  }
  const groups = [...byDomain.entries()]
    .map(([domain, skills]) => ({
      domain,
      skills: skills.sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level] || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.domain.localeCompare(b.domain));

  inProgress.sort((a, b) => a.name.localeCompare(b.name));

  return {
    totalAcquired: acquired.length,
    totalInProgress: inProgress.length,
    totalCertified: acquired.filter((c) => c.certified).length,
    groups,
    inProgress,
  };
}
