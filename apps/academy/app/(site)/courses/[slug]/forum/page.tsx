import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUser } from "@da/auth/guards";
import { getForumTopics } from "@/lib/community-queries";
import { AccessGate, CommunityHeader, GradientText } from "./community-ui";
import { ForumBoard } from "./ForumBoard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const user = await currentUser();
  const res = await getForumTopics(slug, user?.id ?? null);
  if (!res) return { title: "Forum introuvable" };
  return {
    title: `Forum — ${res.access.courseTitle}`,
    description: `Posez vos questions et échangez avec la communauté du cours ${res.access.courseTitle} sur Access Academy.`,
  };
}

export default async function ForumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await currentUser();
  const res = await getForumTopics(slug, user?.id ?? null);
  if (!res) notFound();

  const { access, topics } = res;

  return (
    <>
      <CommunityHeader
        slug={slug}
        courseTitle={access.courseTitle}
        eyebrow="Communauté"
        title={
          <>
            Forum, <GradientText>{access.courseTitle}</GradientText>
          </>
        }
        subtitle="Un doute, un blocage, une idée à partager ? La communauté et l'instructeur sont là pour vous aider à avancer."
      />

      {!access.canView ? (
        <AccessGate slug={slug} courseTitle={access.courseTitle} />
      ) : (
        <ForumBoard slug={slug} topics={topics} access={access} />
      )}
    </>
  );
}
