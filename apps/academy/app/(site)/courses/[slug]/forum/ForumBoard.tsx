"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Plus,
  ChevronUp,
  MessageCircle,
  CheckCircle2,
  Filter,
  MessagesSquare,
  X,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Container,
  Input,
  Section,
  buttonClasses,
  cn,
  formatDate,
} from "@da/ui";
import type { CommunityAccess, ForumTopicCard } from "@/lib/community-queries";
import { upvoteTopic } from "@/lib/community-actions";
import { EmailVerifyBanner, InstructorBadge, SolvedPill } from "./community-ui";
import { NewTopicDialog } from "./NewTopicDialog";

/* ══════════════════════════════════════════════════════════════════════════
   Tableau du forum : recherche debounce, filtre résolu, création de sujet,
   liste de cartes avec upvote optimiste.
   ══════════════════════════════════════════════════════════════════════════ */

type SolvedFilter = "all" | "open" | "solved";

const filters: { key: SolvedFilter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "open", label: "Sans réponse validée" },
  { key: "solved", label: "Résolus" },
];

export function ForumBoard({
  slug,
  topics,
  access,
}: {
  slug: string;
  topics: ForumTopicCard[];
  access: CommunityAccess;
}) {
  const [rawQuery, setRawQuery] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<SolvedFilter>("all");
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Recherche debounce (client).
  React.useEffect(() => {
    const t = setTimeout(() => setQuery(rawQuery.trim().toLowerCase()), 220);
    return () => clearTimeout(t);
  }, [rawQuery]);

  const visible = React.useMemo(() => {
    return topics.filter((t) => {
      if (filter === "solved" && !t.solved) return false;
      if (filter === "open" && t.solved) return false;
      if (!query) return true;
      const haystack = [
        t.title,
        t.excerpt,
        t.category ?? "",
        t.tags.join(" "),
        t.author.name,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [topics, query, filter]);

  return (
    <Section spacing="sm">
      <Container size="lg">
        {access.canPost ? null : <EmailVerifyBanner className="mb-8" />}

        {/* Barre d'actions */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <Input
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              placeholder="Rechercher un sujet, un tag, un auteur…"
              aria-label="Rechercher dans le forum"
              className="pl-10"
            />
            {rawQuery && (
              <button
                type="button"
                onClick={() => setRawQuery("")}
                aria-label="Effacer la recherche"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-navy"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {access.canPost && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className={cn(buttonClasses({ variant: "primary", size: "md" }), "shrink-0")}
            >
              <Plus size={18} /> Nouveau sujet
            </button>
          )}
        </div>

        {/* Filtres */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted">
            <Filter size={13} /> Filtrer
          </span>
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-tight transition-all duration-200",
                  active
                    ? "bg-gradient-da text-white shadow-brand"
                    : "border border-navy/10 bg-surface-primary text-navy hover:border-brand-blue-vif/50 hover:text-brand-blue-royal",
                )}
              >
                {f.label}
              </button>
            );
          })}
          <span className="ml-auto text-xs font-medium text-text-muted">
            {visible.length} sujet{visible.length > 1 ? "s" : ""}
          </span>
        </div>

        {/* Liste */}
        <div className="mt-6">
          {visible.length === 0 ? (
            <EmptyState hasTopics={topics.length > 0} canPost={access.canPost} onCreate={() => setDialogOpen(true)} />
          ) : (
            <motion.ul
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045 } } }}
              className="space-y-3"
            >
              <AnimatePresence initial={false}>
                {visible.map((t) => (
                  <TopicRow key={t.id} slug={slug} topic={t} canView={access.canView} />
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </Container>

      {access.canPost && (
        <NewTopicDialog slug={slug} open={dialogOpen} onClose={() => setDialogOpen(false)} />
      )}
    </Section>
  );
}

/* ─────────────────────────────── Carte sujet ───────────────────────────── */

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function TopicRow({
  slug,
  topic,
  canView,
}: {
  slug: string;
  topic: ForumTopicCard;
  canView: boolean;
}) {
  const router = useRouter();
  const [voted, setVoted] = React.useState(false);
  const [count, setCount] = React.useState(topic.upvotes);
  const [pending, setPending] = React.useState(false);

  async function handleVote(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    const nextVoted = !voted;
    // Optimiste : bascule l'état et le compteur.
    setVoted(nextVoted);
    setCount((c) => c + (nextVoted ? 1 : -1));
    setPending(true);
    const res = await upvoteTopic(slug, topic.id, nextVoted);
    setPending(false);
    if (!res.ok) {
      // Rollback.
      setVoted(!nextVoted);
      setCount((c) => c + (nextVoted ? -1 : 1));
    } else {
      router.refresh();
    }
  }

  return (
    <motion.li variants={item} exit={{ opacity: 0, y: -8 }} layout>
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="group relative flex gap-3 overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-shadow hover:shadow-brand-lg sm:gap-4 sm:p-5"
      >
        {/* Colonne vote */}
        <button
          type="button"
          onClick={handleVote}
          disabled={!canView}
          aria-pressed={voted}
          aria-label={voted ? "Retirer mon vote" : "Voter pour ce sujet"}
          className={cn(
            "z-10 flex h-14 w-11 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border text-xs font-bold transition-all duration-200",
            voted
              ? "border-transparent bg-gradient-da text-white shadow-brand"
              : "border-navy/10 bg-surface-secondary text-navy hover:border-brand-blue-vif/50 hover:text-brand-blue-royal",
            !canView && "cursor-not-allowed opacity-60",
          )}
        >
          <ChevronUp size={16} className={cn("transition-transform", voted && "-translate-y-0.5")} />
          <span>{count}</span>
        </button>

        {/* Contenu — la card entière est cliquable via le lien couvrant */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {topic.solved && <SolvedPill />}
            {topic.category && (
              <Badge variant="soft" className="max-w-[12rem] truncate">
                {topic.category}
              </Badge>
            )}
            {topic.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="max-w-[9rem] truncate">
                #{tag}
              </Badge>
            ))}
          </div>

          <h3 className="mt-2 font-display text-base font-bold leading-snug tracking-tight text-navy transition-colors group-hover:text-brand-blue-royal sm:text-lg">
            <Link
              href={`/courses/${slug}/forum/${topic.id}`}
              className="after:absolute after:inset-0 after:content-['']"
            >
              {topic.title}
            </Link>
          </h3>

          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-secondary">
            {topic.excerpt}
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
            <span className="inline-flex items-center gap-2">
              <Avatar name={topic.author.name} src={topic.author.avatar ?? undefined} className="h-6 w-6 text-[0.6rem]" />
              <span className="font-medium text-navy">{topic.author.name}</span>
              {topic.author.isInstructor && <InstructorBadge />}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle size={13} />
              {topic.replyCount} réponse{topic.replyCount > 1 ? "s" : ""}
            </span>
            {topic.solved && (
              <span className="inline-flex items-center gap-1 font-medium text-success">
                <CheckCircle2 size={13} /> Résolu
              </span>
            )}
            <span className="ml-auto">{formatDate(topic.lastActivityAt)}</span>
          </div>
        </div>
      </motion.div>
    </motion.li>
  );
}

/* ─────────────────────────────── État vide ─────────────────────────────── */

function EmptyState({
  hasTopics,
  canPost,
  onCreate,
}: {
  hasTopics: boolean;
  canPost: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-navy/15 bg-surface-secondary/60 px-6 py-14 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dots opacity-[0.08]" />
      <span className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-da text-white shadow-brand">
        <MessagesSquare size={28} />
      </span>
      <h3 className="font-display text-lg font-bold text-navy">
        {hasTopics ? "Aucun sujet ne correspond" : "Le forum est encore tout neuf"}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
        {hasTopics
          ? "Essayez un autre mot-clé ou changez de filtre pour retrouver une discussion."
          : "Lancez la toute première discussion : une question, un retour d'expérience, une astuce à partager."}
      </p>
      {!hasTopics && canPost && (
        <button
          type="button"
          onClick={onCreate}
          className={cn(buttonClasses({ variant: "primary", size: "md" }), "mt-6")}
        >
          <Plus size={18} /> Ouvrir un premier sujet
        </button>
      )}
    </div>
  );
}
