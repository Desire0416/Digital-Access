import "server-only";
import { prisma } from "@da/db/client";
import type { CatalogueFormation, DiagQuestion } from "./types";

/** Catalogue résumé (parcours + formations courtes publiés) pour l'IA + écoles. */
export async function getCatalogueForDiagnostic(): Promise<{
  formations: CatalogueFormation[];
  schools: string[];
}> {
  try {
    const [paths, courses] = await Promise.all([
      prisma.careerPath.findMany({
        where: { status: "PUBLISHED" },
        select: {
          slug: true,
          title: true,
          level: true,
          targetJob: true,
          shortDescription: true,
          school: { select: { name: true } },
          skills: { select: { skill: { select: { name: true } } } },
        },
      }),
      prisma.shortCourse.findMany({
        where: { status: "PUBLISHED" },
        select: {
          slug: true,
          title: true,
          level: true,
          courseType: true,
          shortDescription: true,
          objectives: true,
          school: { select: { name: true } },
        },
      }),
    ]);

    const formations: CatalogueFormation[] = [
      ...paths.map((p) => ({
        type: "career-path" as const,
        slug: p.slug,
        title: p.title,
        school: p.school.name,
        level: p.level,
        target: p.targetJob,
        description: p.shortDescription,
        skills: p.skills.map((s) => s.skill.name).slice(0, 8),
      })),
      ...courses.map((c) => ({
        type: "short-course" as const,
        slug: c.slug,
        title: c.title,
        school: c.school.name,
        level: c.level,
        target: c.courseType ?? "Formation courte",
        description: c.shortDescription,
        skills: (c.objectives ?? []).slice(0, 6),
      })),
    ];

    const schools = [...new Set(formations.map((f) => f.school))].sort();
    return { formations, schools };
  } catch {
    return { formations: [], schools: [] };
  }
}

/** Questions d'orientation (fixes ; la question « domaine » est bâtie depuis les écoles réelles). */
export function buildOrientationQuestions(schools: string[]): DiagQuestion[] {
  const domainOptions =
    schools.length > 0 ? [...schools, "Je ne sais pas encore"] : ["Je ne sais pas encore"];
  return [
    {
      id: "domaine",
      dimension: "Domaine",
      question: "Quel domaine vous attire le plus ?",
      options: domainOptions,
    },
    {
      id: "niveau",
      dimension: "Niveau",
      question: "Comment décririez-vous votre niveau global en numérique ?",
      options: [
        "Grand débutant",
        "Quelques bases",
        "À l'aise avec les outils courants",
        "Expérimenté / avancé",
      ],
    },
    {
      id: "objectif",
      dimension: "Objectif",
      question: "Quel est votre objectif principal ?",
      options: [
        "Découvrir et monter en compétences",
        "Trouver un emploi dans le numérique",
        "Lancer ou développer mon activité",
        "Réaliser un projet précis",
      ],
    },
    {
      id: "experience",
      dimension: "Expérience",
      question: "Avez-vous déjà pratiqué dans le domaine qui vous intéresse ?",
      options: [
        "Jamais",
        "Un peu, en autodidacte",
        "Formation ou usage régulier",
        "Niveau professionnel",
      ],
    },
    {
      id: "temps",
      dimension: "Disponibilité",
      question: "Combien de temps pouvez-vous consacrer par semaine ?",
      options: ["Moins de 2 h", "2 à 5 h", "5 à 10 h", "Plus de 10 h"],
    },
    {
      id: "attente",
      dimension: "Attente",
      question: "Qu'est-ce qui compte le plus pour vous ?",
      options: [
        "Apprendre les bases pas à pas",
        "Être opérationnel rapidement",
        "Obtenir un certificat reconnu",
        "Construire un portfolio de projets",
      ],
    },
  ];
}
