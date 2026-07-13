import "server-only";
import { prisma } from "@da/academy-db/client";
import type { DiagnosticContext } from "./types";

/** Charge le contexte d'une FORMATION (Course) pour cibler le test de positionnement IA. */
export async function getDiagnosticContext(slug: string): Promise<DiagnosticContext | null> {
  try {
    const c = await prisma.course.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: {
        slug: true,
        title: true,
        level: true,
        subtitle: true,
        description: true,
        objectives: true,
        prerequisitesText: true,
        tools: true,
        skills: { select: { skill: { select: { name: true } } } },
        modules: {
          where: { status: "PUBLISHED" },
          orderBy: { order: "asc" },
          select: { title: true },
        },
      },
    });
    if (!c) return null;
    return {
      slug: c.slug,
      title: c.title,
      level: c.level,
      subtitle: c.subtitle || c.description.slice(0, 240),
      objectives: c.objectives ?? [],
      prerequisites: c.prerequisitesText ?? [],
      tools: c.tools ?? [],
      skills: c.skills.map((s) => s.skill.name),
      moduleTitles: c.modules.map((m) => m.title),
    };
  } catch {
    return null;
  }
}
