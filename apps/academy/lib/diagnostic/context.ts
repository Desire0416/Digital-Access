import "server-only";
import { prisma } from "@da/db/client";
import type { DiagnosticContext } from "./types";

/** Charge le contexte d'un parcours pour cibler le diagnostic IA. */
export async function getDiagnosticContext(slug: string): Promise<DiagnosticContext | null> {
  try {
    const p = await prisma.careerPath.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: {
        slug: true,
        title: true,
        level: true,
        targetJob: true,
        shortDescription: true,
        objectives: true,
        outcomes: true,
        prerequisites: true,
        tools: true,
        skills: { select: { skill: { select: { name: true } } } },
        modules: {
          where: { status: "PUBLISHED" },
          orderBy: { order: "asc" },
          select: { title: true },
        },
      },
    });
    if (!p) return null;
    return {
      slug: p.slug,
      title: p.title,
      level: p.level,
      targetJob: p.targetJob,
      shortDescription: p.shortDescription,
      objectives: p.objectives ?? [],
      outcomes: p.outcomes ?? [],
      prerequisites: p.prerequisites ?? [],
      tools: p.tools ?? [],
      skills: p.skills.map((s) => s.skill.name),
      moduleTitles: p.modules.map((m) => m.title),
    };
  } catch {
    return null;
  }
}
