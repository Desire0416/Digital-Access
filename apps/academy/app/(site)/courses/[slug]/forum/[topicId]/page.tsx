import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronUp, MessageCircle } from "lucide-react";
import {
  Avatar,
  Badge,
  Container,
  Section,
  cn,
  formatDate,
} from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getForumTopic } from "@/lib/community-queries";
import { Markdown } from "@/components/Markdown";
import { InstructorBadge, SolvedPill } from "../community-ui";
import { TopicThread } from "./TopicThread";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; topicId: string }>;
}): Promise<Metadata> {
  const { slug, topicId } = await params;
  const user = await currentUser();
  const res = await getForumTopic(slug, topicId, user?.id ?? null);
  if (!res) return { title: "Sujet introuvable" };
  return {
    title: `${res.topic.title} — Forum ${res.access.courseTitle}`,
    description: res.topic.content.slice(0, 150),
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string; topicId: string }>;
}) {
  const { slug, topicId } = await params;
  const user = await currentUser();
  const res = await getForumTopic(slug, topicId, user?.id ?? null);
  if (!res) notFound();

  const { access, topic } = res;
  const replyCount = topic.replies.length;

  return (
    <Section spacing="sm">
      <Container size="md">
        {/* Fil d'ariane */}
        <div className="flex flex-wrap items-center gap-1.5 text-sm text-text-muted">
          <Link
            href={`/courses/${slug}/forum`}
            className="inline-flex items-center gap-1 font-medium text-text-secondary transition-colors hover:text-brand-blue-royal"
          >
            <span aria-hidden>&larr;</span> Forum
          </Link>
          <span aria-hidden>·</span>
          <span className="truncate text-text-muted">{access.courseTitle}</span>
        </div>

        {/* Sujet */}
        <article className="mt-5 overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary">
          <div aria-hidden className="h-1 w-full bg-gradient-da" />
          <div className="flex gap-4 p-5 sm:p-7">
            {/* Compteur de votes du sujet (le vote interactif est dans le thread) */}
            <div className="flex h-16 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-navy/10 bg-surface-secondary text-navy">
              <ChevronUp size={18} className="text-brand-blue-royal" />
              <span className="text-sm font-bold">{topic.upvotes}</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {topic.solved && <SolvedPill />}
                {topic.category && <Badge variant="soft">{topic.category}</Badge>}
                {topic.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>

              <h1 className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight text-navy sm:text-3xl">
                {topic.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-muted">
                <span className="inline-flex items-center gap-2">
                  <Avatar
                    name={topic.author.name}
                    src={topic.author.avatar ?? undefined}
                    className="h-7 w-7 text-[0.65rem]"
                  />
                  <span className="font-medium text-navy">{topic.author.name}</span>
                  {topic.author.isInstructor && <InstructorBadge />}
                </span>
                <span aria-hidden>·</span>
                <span>{formatDate(topic.createdAt)}</span>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle size={13} /> {replyCount} réponse{replyCount > 1 ? "s" : ""}
                </span>
              </div>

              <div className="mt-5">
                <Markdown>{topic.content}</Markdown>
              </div>
            </div>
          </div>
        </article>

        {/* Fil des réponses + formulaires (interactif) */}
        <TopicThread slug={slug} topic={topic} access={access} />
      </Container>
    </Section>
  );
}
