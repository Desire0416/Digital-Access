import "server-only";
import { prisma, type CourseLevel, type EnrollmentStatus } from "@da/academy-db/client";
import { ACQUIRED_STATUSES } from "./pricing";

/* ══════════════════════════════════════════════════════════════════════════
   Moteur de recommandations personnalisées (cahier §33) — DÉTERMINISTE.
   Exploite le profil de l'apprenant : niveau (onboarding + niveaux validés),
   objectif, formations terminées, parcours actifs, résultats d'évaluation,
   compétences acquises et favoris. Retourne des recommandations TYPÉES :
     · NEXT           — prochaine formation d'un parcours en cours
     · SPECIALIZATION — monter en niveau dans un domaine déjà entamé
     · UPGRADE        — consolider les bases (échec d'évaluation ou niveau bas)
     · PROJECT        — une formation à projet pour étoffer le portfolio
     · PATH           — un parcours métier aligné sur le profil
     · DISCOVERY      — à découvrir (favoris, domaine, popularité) — repli
   Sans IA, sans persistance : tout est calculé à la lecture.
   ══════════════════════════════════════════════════════════════════════════ */

export type RecoType = "NEXT" | "SPECIALIZATION" | "UPGRADE" | "PROJECT" | "PATH" | "DISCOVERY";

const TYPE_PRIORITY: Record<RecoType, number> = {
  NEXT: 0,
  SPECIALIZATION: 1,
  UPGRADE: 2,
  PROJECT: 3,
  PATH: 4,
  DISCOVERY: 5,
};

export const RECO_TYPE_LABEL: Record<RecoType, string> = {
  NEXT: "Prochaine étape",
  SPECIALIZATION: "Spécialisation",
  UPGRADE: "Mise à niveau",
  PROJECT: "Projet complémentaire",
  PATH: "Parcours pertinent",
  DISCOVERY: "À découvrir",
};

export interface RecoCourse {
  kind: "course";
  type: RecoType;
  reason: string;
  slug: string;
  title: string;
  subtitle: string | null;
  coverImage: string | null;
  level: string;
  price: number;
  durationHours: number | null;
  moduleCount: number;
  rating: number | null;
  reviewCount: number;
  hasProject: boolean;
  hasCertificate: boolean;
  schoolName: string | null;
}

export interface RecoPath {
  kind: "path";
  type: "PATH";
  reason: string;
  slug: string;
  title: string;
  targetJob: string;
  coverImage: string | null;
  entryLevel: string;
  exitLevel: string;
  price: number;
  courseCount: number;
  projectCount: number;
  schoolName: string | null;
}

export type Recommendation = RecoCourse | RecoPath;

const ACQUIRED: EnrollmentStatus[] = [...ACQUIRED_STATUSES];
const LEVEL_ORDER: Record<CourseLevel, number> = { BEGINNER: 0, INTERMEDIATE: 1, ADVANCED: 2, EXPERT: 3 };

/** Niveau d'onboarding (texte libre) → CourseLevel. */
function levelFromExperience(exp: string | null): CourseLevel | null {
  if (!exp) return null;
  const e = exp.toLowerCase();
  if (/(expert|avanc|senior|confirm)/.test(e)) return "ADVANCED";
  if (/(interm|moyen|opérationnel|operationnel)/.test(e)) return "INTERMEDIATE";
  if (/(débu|debu|novice|zéro|zero|aucun|découv|decouv)/.test(e)) return "BEGINNER";
  return null;
}

/** Chevauchement de mots significatifs entre un objectif libre et un texte cible. */
function objectiveMatch(objective: string | null, target: string): number {
  if (!objective) return 0;
  const stop = new Set(["pour", "dans", "avec", "être", "etre", "les", "des", "une", "un", "de", "la", "le", "et", "en", "du", "au", "aux", "mon", "ma", "je", "veux", "devenir", "apprendre", "métier", "metier"]);
  const words = objective.toLowerCase().split(/[^a-zàâäéèêëïîôöùûüç]+/).filter((w) => w.length > 3 && !stop.has(w));
  if (words.length === 0) return 0;
  const hay = target.toLowerCase();
  return words.filter((w) => hay.includes(w)).length;
}

type Candidate = {
  slug: string;
  title: string;
  subtitle: string | null;
  coverImage: string | null;
  level: CourseLevel;
  price: number;
  durationHours: number | null;
  moduleCount: number;
  rating: number | null;
  reviewCount: number;
  hasProject: boolean;
  hasCertificate: boolean;
  schoolName: string | null;
  schoolIds: Set<string>;
  skillIds: Set<string>;
  enrollCount: number;
  courseId: string;
  score: number;
  favorite: boolean;
};

/**
 * Recommandations personnalisées pour un apprenant. `limit` borne le nombre de
 * cartes renvoyées (défaut 6). Dégrade proprement pour un profil vide
 * (populaires filtrées par niveau d'onboarding).
 */
export async function getRecommendations(
  userId: string,
  opts: { limit?: number } = {},
): Promise<Recommendation[]> {
  const limit = opts.limit ?? 6;

  const [user, enrollments, pathEnrollments, favorites, failedAtt, passedAtt] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { objective: true, experienceLevel: true } }),
    prisma.enrollment.findMany({
      where: { userId },
      select: {
        courseId: true,
        status: true,
        course: {
          select: {
            level: true,
            schools: { select: { schoolId: true } },
            skills: { select: { skillId: true } },
          },
        },
      },
    }),
    prisma.careerPathEnrollment.findMany({
      where: { userId },
      select: { careerPathId: true, status: true },
    }),
    prisma.favorite.findMany({ where: { userId }, select: { courseId: true, careerPathId: true } }),
    // Échecs / réussites par ÉVALUATION (distinct assessmentId) — pour ne
    // déclencher UPGRADE que sur un échec NON rattrapé (repassé et réussi ⇒ OK).
    prisma.assessmentAttempt.findMany({ where: { userId, passed: false }, select: { assessmentId: true }, distinct: ["assessmentId"] }),
    prisma.assessmentAttempt.findMany({ where: { userId, passed: true }, select: { assessmentId: true }, distinct: ["assessmentId"] }),
  ]);

  const acquiredCourseIds = new Set(enrollments.filter((e) => ACQUIRED.includes(e.status)).map((e) => e.courseId));
  const completed = enrollments.filter((e) => e.status === "COMPLETED");

  const mySchoolIds = new Set<string>();
  const mySkillIds = new Set<string>();
  let myMaxLevel = -1;
  for (const e of enrollments) {
    if (!ACQUIRED.includes(e.status)) continue;
    // Domaine « entamé » : compte dès l'inscription (ACTIVE ou COMPLETED).
    e.course.schools.forEach((s) => mySchoolIds.add(s.schoolId));
    // Niveau et compétences = uniquement le VALIDÉ (COMPLETED). Une inscription
    // ACTIVE à 0 % ne doit pas gonfler le niveau de référence.
    if (e.status === "COMPLETED") {
      e.course.skills.forEach((s) => mySkillIds.add(s.skillId));
      myMaxLevel = Math.max(myMaxLevel, LEVEL_ORDER[e.course.level]);
    }
  }
  // Niveau de référence : plus haut niveau validé, sinon niveau d'onboarding.
  const onboardingLevel = levelFromExperience(user?.experienceLevel ?? null);
  const refLevel = myMaxLevel >= 0 ? myMaxLevel : onboardingLevel ? LEVEL_ORDER[onboardingLevel] : 0;

  const favCourseIds = new Set(favorites.map((f) => f.courseId).filter(Boolean) as string[]);
  const favPathIds = new Set(favorites.map((f) => f.careerPathId).filter(Boolean) as string[]);
  // Échec NON rattrapé = une évaluation ratée dont aucune reprise n'a réussi.
  const passedAssessmentIds = new Set(passedAtt.map((a) => a.assessmentId));
  const hasUnresolvedFailure = failedAtt.some((a) => !passedAssessmentIds.has(a.assessmentId));
  const hasFailed = hasUnresolvedFailure || completed.length === 0; // débutant ou échec non rattrapé → mise à niveau pertinente
  const activePaths = pathEnrollments.filter((p) => p.status === "ACTIVE" || p.status === "PAUSED");
  const enrolledPathIds = new Set(pathEnrollments.map((p) => p.careerPathId));

  // ─── Candidats : formations publiées non acquises ────────────────────────
  // La note moyenne est agrégée en SQL (groupBy) plutôt que de rapatrier toutes
  // les lignes d'avis de chaque formation juste pour une moyenne d'affichage.
  const [rawCandidates, ratingAgg] = await Promise.all([
    prisma.course.findMany({
      where: { status: "PUBLISHED", id: { notIn: [...acquiredCourseIds] } },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        coverImage: true,
        level: true,
        price: true,
        durationHours: true,
        certificateTitle: true,
        schools: { orderBy: { isPrimary: "desc" }, select: { schoolId: true, school: { select: { name: true } } } },
        skills: { select: { skillId: true } },
        projects: { where: { status: "PUBLISHED", isRequired: true }, select: { id: true }, take: 1 },
        _count: { select: { modules: true, enrollments: true } },
      },
    }),
    prisma.review.groupBy({
      by: ["courseId"],
      where: { status: "APPROVED", course: { status: "PUBLISHED" } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);
  const ratingByCourse = new Map(ratingAgg.map((r) => [r.courseId, r]));

  const candidates: Candidate[] = rawCandidates.map((c) => {
    const schoolIds = new Set(c.schools.map((s) => s.schoolId));
    const skillIds = new Set(c.skills.map((s) => s.skillId));
    const sharedSkills = [...skillIds].filter((s) => mySkillIds.has(s)).length;
    const domainMatch = [...schoolIds].some((s) => mySchoolIds.has(s));
    const favorite = favCourseIds.has(c.id);
    const objText = `${c.title} ${c.subtitle ?? ""} ${c.schools.map((s) => s.school.name).join(" ")}`;
    const objScore = objectiveMatch(user?.objective ?? null, objText);
    const agg = ratingByCourse.get(c.id);
    const reviewCount = agg?._count.rating ?? 0;
    const rating = reviewCount > 0 ? agg!._avg.rating : null;

    // Score composite (déterministe).
    let score = 0;
    if (domainMatch) score += 4;
    score += Math.min(sharedSkills, 3) * 3;
    if (favorite) score += 6;
    score += objScore * 2;
    if (LEVEL_ORDER[c.level] === refLevel) score += 1;
    score += Math.min(c._count.enrollments, 10) * 0.1; // départage populaire

    return {
      courseId: c.id,
      slug: c.slug,
      title: c.title,
      subtitle: c.subtitle,
      coverImage: c.coverImage,
      level: c.level,
      price: c.price,
      durationHours: c.durationHours,
      moduleCount: c._count.modules,
      rating,
      reviewCount,
      hasProject: c.projects.length > 0,
      hasCertificate: !!c.certificateTitle,
      schoolName: c.schools[0]?.school.name ?? null,
      schoolIds,
      skillIds,
      enrollCount: c._count.enrollments,
      score,
      favorite,
    };
  });

  const byScore = [...candidates].sort((a, b) => b.score - a.score || b.enrollCount - a.enrollCount);
  const used = new Set<string>();
  const out: Recommendation[] = [];

  const toReco = (c: Candidate, type: RecoType, reason: string): RecoCourse => ({
    kind: "course",
    type,
    reason,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    coverImage: c.coverImage,
    level: c.level,
    price: c.price,
    durationHours: c.durationHours,
    moduleCount: c.moduleCount,
    rating: c.rating,
    reviewCount: c.reviewCount,
    hasProject: c.hasProject,
    hasCertificate: c.hasCertificate,
    schoolName: c.schoolName,
  });

  // ─── NEXT : prochaine formation non acquise d'un parcours en cours ────────
  // Charge tous les parcours actifs en UNE requête (pas de N+1 dans la boucle).
  const activePathRows = activePaths.length
    ? await prisma.careerPath.findMany({
        where: { id: { in: activePaths.map((p) => p.careerPathId) } },
        select: {
          id: true,
          title: true,
          courses: {
            orderBy: { position: "asc" },
            select: { isRequired: true, course: { select: { id: true } } },
          },
        },
      })
    : [];
  const pathById = new Map(activePathRows.map((p) => [p.id, p]));
  for (const pe of activePaths) {
    const path = pathById.get(pe.careerPathId);
    if (!path) continue;
    const nextLink = path.courses.find((cc) => cc.isRequired && !acquiredCourseIds.has(cc.course.id));
    if (!nextLink) continue;
    const cand = candidates.find((c) => c.courseId === nextLink.course.id && !used.has(c.slug));
    if (cand) {
      used.add(cand.slug);
      out.push(toReco(cand, "NEXT", `Prochaine étape de votre parcours « ${path.title} ».`));
    }
  }

  // ─── SPECIALIZATION : niveau strictement supérieur dans un domaine entamé ──
  if (mySchoolIds.size > 0) {
    const spec = byScore.find(
      (c) =>
        !used.has(c.slug) &&
        [...c.schoolIds].some((s) => mySchoolIds.has(s)) &&
        LEVEL_ORDER[c.level] > refLevel,
    );
    if (spec) {
      used.add(spec.slug);
      out.push(toReco(spec, "SPECIALIZATION", `Pour aller plus loin après vos acquis${spec.schoolName ? ` en ${spec.schoolName}` : ""}.`));
    }
  }

  // ─── UPGRADE : consolider les bases (échec ou niveau bas) ─────────────────
  if (hasFailed) {
    const up = byScore.find(
      (c) =>
        !used.has(c.slug) &&
        LEVEL_ORDER[c.level] <= Math.max(refLevel, 1) &&
        (mySchoolIds.size === 0 || [...c.schoolIds].some((s) => mySchoolIds.has(s))),
    );
    if (up) {
      used.add(up.slug);
      out.push(toReco(up, "UPGRADE", completed.length === 0 ? "Un bon point de départ pour bâtir des bases solides." : "Consolidez vos bases avant de monter en niveau."));
    }
  }

  // ─── PROJECT : une formation à projet dans le domaine, pour le portfolio ──
  {
    const proj = byScore.find(
      (c) =>
        !used.has(c.slug) &&
        c.hasProject &&
        (mySchoolIds.size === 0 || [...c.schoolIds].some((s) => mySchoolIds.has(s))),
    );
    if (proj) {
      used.add(proj.slug);
      out.push(toReco(proj, "PROJECT", "Un projet évalué concret à ajouter à votre portfolio."));
    }
  }

  // ─── PATH : un parcours métier aligné, non suivi ──────────────────────────
  {
    const paths = await prisma.careerPath.findMany({
      where: { status: "PUBLISHED", id: { notIn: [...enrolledPathIds] } },
      select: {
        id: true,
        slug: true,
        title: true,
        targetJob: true,
        description: true,
        coverImage: true,
        entryLevel: true,
        exitLevel: true,
        price: true,
        featured: true,
        schools: { orderBy: { isPrimary: "desc" }, select: { schoolId: true, school: { select: { name: true } } } },
        _count: { select: { courses: true, projects: true, enrollments: true } },
      },
    });
    const scoredPaths = paths
      .map((p) => {
        const domain = p.schools.some((s) => mySchoolIds.has(s.schoolId));
        const obj = objectiveMatch(user?.objective ?? null, `${p.title} ${p.targetJob} ${p.description}`);
        const fav = favPathIds.has(p.id);
        const score = (domain ? 5 : 0) + obj * 2 + (fav ? 6 : 0) + (p.featured ? 1 : 0) + Math.min(p._count.enrollments, 10) * 0.1;
        return { p, score };
      })
      .sort((a, b) => b.score - a.score || b.p._count.enrollments - a.p._count.enrollments);
    const best = scoredPaths[0];
    if (best) {
      const p = best.p;
      out.push({
        kind: "path",
        type: "PATH",
        reason:
          best.score >= 5
            ? "Un parcours métier aligné sur ce que vous avez déjà appris."
            : "Un parcours métier complet pour viser un emploi.",
        slug: p.slug,
        title: p.title,
        targetJob: p.targetJob,
        coverImage: p.coverImage,
        entryLevel: p.entryLevel,
        exitLevel: p.exitLevel,
        price: p.price,
        courseCount: p._count.courses,
        projectCount: p._count.projects,
        schoolName: p.schools[0]?.school.name ?? null,
      });
    }
  }

  // ─── DISCOVERY : compléter jusqu'à `limit` (favoris, domaine, populaires) ──
  for (const c of byScore) {
    if (out.length >= limit) break;
    if (used.has(c.slug)) continue;
    used.add(c.slug);
    out.push(
      toReco(
        c,
        "DISCOVERY",
        c.favorite ? "Dans vos favoris — prêt à commencer." : "Populaire auprès des apprenants comme vous.",
      ),
    );
  }

  // Trie par pertinence de type, borne à `limit`.
  return out.sort((a, b) => TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]).slice(0, limit);
}
