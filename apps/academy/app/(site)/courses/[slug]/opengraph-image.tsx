import { prisma } from "@da/db/client";
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/og";

export const alt = "Cours — Access Academy";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const LEVEL_LABEL: Record<string, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let course: {
    title: string;
    subtitle: string | null;
    level: string;
    category: { name: string } | null;
  } | null = null;
  try {
    course = await prisma.course.findFirst({
      where: { slug, status: "PUBLISHED", deletedAt: null },
      select: {
        title: true,
        subtitle: true,
        level: true,
        category: { select: { name: true } },
      },
    });
  } catch {
    /* base injoignable → carte générique ci-dessous */
  }

  if (!course) {
    return renderOgImage({
      eyebrow: "Cours",
      title: "Access Academy",
      footer: "academy.digitalaccess.ci · Cours",
    });
  }

  return renderOgImage({
    eyebrow: course.category?.name ?? "Cours",
    title: course.title,
    description: course.subtitle ?? undefined,
    footer: "academy.digitalaccess.ci · Cours",
    badge: LEVEL_LABEL[course.level],
  });
}
