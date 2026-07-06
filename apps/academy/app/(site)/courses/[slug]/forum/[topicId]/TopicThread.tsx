"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronUp,
  CheckCircle2,
  CornerDownRight,
  Trash2,
  Reply as ReplyIcon,
  Sparkles,
  MessageSquare,
  AlertCircle,
  X,
} from "lucide-react";
import {
  Avatar,
  Textarea,
  buttonClasses,
  cn,
  formatDate,
} from "@da/ui";
import type {
  CommunityAccess,
  ForumReplyNode,
  ForumTopicDetail,
} from "@/lib/community-queries";
import {
  createForumReply,
  upvoteReply,
  markReplySolution,
  deleteForumReply,
  deleteForumTopic,
} from "@/lib/community-actions";
import { EmailVerifyBanner, InstructorBadge, MentionText } from "../community-ui";

/* ══════════════════════════════════════════════════════════════════════════
   Fil de discussion : arbre de réponses (parentId), vote, solution,
   suppression, réponse racine et réponses imbriquées.
   ══════════════════════════════════════════════════════════════════════════ */

type ReplyTreeNode = ForumReplyNode & { children: ReplyTreeNode[] };

/** Construit l'arbre des réponses à partir de la liste plate (parentId). */
function buildTree(replies: ForumReplyNode[]): ReplyTreeNode[] {
  const map = new Map<string, ReplyTreeNode>();
  const roots: ReplyTreeNode[] = [];
  replies.forEach((r) => map.set(r.id, { ...r, children: [] }));
  replies.forEach((r) => {
    const node = map.get(r.id)!;
    if (r.parentId && map.has(r.parentId)) {
      map.get(r.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export function TopicThread({
  slug,
  topic,
  access,
}: {
  slug: string;
  topic: ForumTopicDetail;
  access: CommunityAccess;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const canModerate = access.isPrivileged || topic.isOwner;
  const tree = React.useMemo(() => buildTree(topic.replies), [topic.replies]);
  const total = topic.replies.length;

  function refresh() {
    router.refresh();
  }

  /* ── Suppression du sujet ── */
  function handleDeleteTopic() {
    if (!window.confirm("Supprimer définitivement ce sujet et toutes ses réponses ?")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteForumTopic(slug, topic.id);
      if (res.ok) {
        router.push(`/courses/${slug}/forum`);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="mt-8">
      {/* Barre de modération du sujet */}
      {(topic.isOwner || access.isPrivileged) && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-navy/[0.07] bg-surface-secondary/60 px-4 py-2.5">
          <span className="text-xs font-medium text-text-muted">
            Vous gérez ce sujet
          </span>
          <button
            type="button"
            onClick={handleDeleteTopic}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/10"
          >
            <Trash2 size={14} /> Supprimer le sujet
          </button>
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-error/30 bg-error/[0.06] px-3.5 py-2.5 text-sm font-medium text-error">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Titre du fil */}
      <div className="flex items-center gap-3">
        <span aria-hidden className="h-px w-8 rounded-full bg-gradient-da" />
        <h2 className="font-display text-lg font-bold tracking-tight text-navy sm:text-xl">
          {total} réponse{total > 1 ? "s" : ""}
        </h2>
      </div>

      {/* Liste des réponses */}
      <div className="mt-5">
        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-navy/15 bg-surface-secondary/50 px-6 py-10 text-center">
            <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-da text-white shadow-brand">
              <MessageSquare size={22} />
            </span>
            <p className="font-display text-base font-bold text-navy">
              Aucune réponse pour l&apos;instant
            </p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-text-secondary">
              {access.canPost
                ? "Soyez la première personne à aider ou à réagir."
                : "Les réponses de la communauté apparaîtront ici."}
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            <AnimatePresence initial={false}>
              {tree.map((node) => (
                <ReplyCard
                  key={node.id}
                  node={node}
                  depth={0}
                  slug={slug}
                  topicId={topic.id}
                  access={access}
                  canModerate={canModerate}
                  onChanged={refresh}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      {/* Formulaire de réponse racine */}
      <div className="mt-8">
        {access.canPost ? (
          <ReplyForm slug={slug} topicId={topic.id} onDone={refresh} rootForm />
        ) : (
          <EmailVerifyBanner />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────── Carte réponse ─────────────────────────── */

function ReplyCard({
  node,
  depth,
  slug,
  topicId,
  access,
  canModerate,
  onChanged,
}: {
  node: ReplyTreeNode;
  depth: number;
  slug: string;
  topicId: string;
  access: CommunityAccess;
  canModerate: boolean;
  onChanged: () => void;
}) {
  const [pending, startTransition] = React.useTransition();
  const [replying, setReplying] = React.useState(false);
  const [voted, setVoted] = React.useState(false);
  const [count, setCount] = React.useState(node.upvotes);
  const [votePending, setVotePending] = React.useState(false);

  const isOwnReply = access.currentUser?.id === node.author.id;
  const canDelete = isOwnReply || access.isPrivileged;
  // Limite l'indentation visuelle pour rester lisible sur mobile.
  const indent = Math.min(depth, 3);

  async function handleVote() {
    if (votePending || !access.canView) return;
    const next = !voted;
    setVoted(next);
    setCount((c) => c + (next ? 1 : -1));
    setVotePending(true);
    const res = await upvoteReply(slug, node.id, next);
    setVotePending(false);
    if (!res.ok) {
      setVoted(!next);
      setCount((c) => c + (next ? -1 : 1));
    } else {
      onChanged();
    }
  }

  function handleSolution() {
    startTransition(async () => {
      const res = await markReplySolution(slug, topicId, node.id);
      if (res.ok) onChanged();
    });
  }

  function handleDelete() {
    if (!window.confirm("Supprimer cette réponse ?")) return;
    startTransition(async () => {
      const res = await deleteForumReply(slug, node.id);
      if (res.ok) onChanged();
    });
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className={cn(
        indent > 0 &&
          "ml-3 border-l-2 border-brand-blue-vif/20 pl-3 sm:ml-5 sm:pl-5",
      )}
    >
      <div
        className={cn(
          "overflow-hidden rounded-2xl border bg-surface-primary transition-shadow",
          node.isSolution
            ? "border-success/40 shadow-[0_0_0_1px_rgba(5,150,105,0.15)]"
            : "border-navy/[0.07]",
        )}
      >
        {/* Bandeau solution */}
        {node.isSolution && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-success to-brand-cyan px-4 py-2 text-sm font-semibold text-white">
            <Sparkles size={15} /> Solution retenue
          </div>
        )}

        <div className="flex gap-3 p-4 sm:gap-4 sm:p-5">
          {/* Vote */}
          <button
            type="button"
            onClick={handleVote}
            disabled={!access.canView}
            aria-pressed={voted}
            aria-label={voted ? "Retirer mon vote" : "Voter pour cette réponse"}
            className={cn(
              "flex h-13 w-10 shrink-0 flex-col items-center justify-center gap-0.5 self-start rounded-lg border py-1.5 text-xs font-bold transition-all duration-200",
              voted
                ? "border-transparent bg-gradient-da text-white shadow-brand"
                : "border-navy/10 bg-surface-secondary text-navy hover:border-brand-blue-vif/50 hover:text-brand-blue-royal",
              !access.canView && "cursor-not-allowed opacity-60",
            )}
          >
            <ChevronUp size={15} className={cn("transition-transform", voted && "-translate-y-0.5")} />
            <span>{count}</span>
          </button>

          <div className="min-w-0 flex-1">
            {/* Auteur */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <Avatar
                name={node.author.name}
                src={node.author.avatar ?? undefined}
                className="h-6 w-6 text-[0.6rem]"
              />
              <span className="font-semibold text-navy">{node.author.name}</span>
              {node.author.isInstructor && <InstructorBadge />}
              <span aria-hidden className="text-text-muted">·</span>
              <span className="text-xs text-text-muted">{formatDate(node.createdAt)}</span>
            </div>

            {/* Contenu avec mentions surlignées */}
            <MentionText text={node.content} className="mt-2.5 text-[0.95rem]" />

            {/* Actions */}
            <div className="mt-3 flex flex-wrap items-center gap-1">
              {access.canPost && (
                <button
                  type="button"
                  onClick={() => setReplying((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-brand-blue-vif/10 hover:text-brand-blue-royal"
                >
                  <ReplyIcon size={14} /> Répondre
                </button>
              )}
              {canModerate && !node.isSolution && (
                <button
                  type="button"
                  onClick={handleSolution}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-success transition-colors hover:bg-success/10"
                >
                  <CheckCircle2 size={14} /> Marquer comme solution
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/10"
                >
                  <Trash2 size={14} /> Supprimer
                </button>
              )}
            </div>

            {/* Formulaire de réponse imbriquée */}
            <AnimatePresence>
              {replying && access.canPost && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-xl border border-navy/[0.07] bg-surface-secondary/60 p-3">
                    <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-text-muted">
                      <CornerDownRight size={13} /> Réponse à {node.author.name}
                    </p>
                    <ReplyForm
                      slug={slug}
                      topicId={topicId}
                      parentId={node.id}
                      compact
                      onDone={() => {
                        setReplying(false);
                        onChanged();
                      }}
                      onCancel={() => setReplying(false)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Enfants */}
      {node.children.length > 0 && (
        <ul className="mt-4 space-y-4">
          <AnimatePresence initial={false}>
            {node.children.map((child) => (
              <ReplyCard
                key={child.id}
                node={child}
                depth={depth + 1}
                slug={slug}
                topicId={topicId}
                access={access}
                canModerate={canModerate}
                onChanged={onChanged}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </motion.li>
  );
}

/* ─────────────────────────────── Formulaire réponse ────────────────────── */

function ReplyForm({
  slug,
  topicId,
  parentId,
  onDone,
  onCancel,
  compact,
  rootForm,
}: {
  slug: string;
  topicId: string;
  parentId?: string | null;
  onDone: () => void;
  onCancel?: () => void;
  compact?: boolean;
  rootForm?: boolean;
}) {
  const [pending, startTransition] = React.useTransition();
  const [content, setContent] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await createForumReply(slug, topicId, {
        content,
        parentId: parentId ?? null,
      });
      if (res.ok) {
        setContent("");
        onDone();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {rootForm && (
        <div className="mb-3 flex items-center gap-3">
          <span aria-hidden className="h-px w-8 rounded-full bg-gradient-da" />
          <h3 className="font-display text-base font-bold tracking-tight text-navy">
            Votre réponse
          </h3>
        </div>
      )}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          compact
            ? "Écrire une réponse… (mentionnez avec @prénom)"
            : "Partagez votre réponse ou votre aide… Utilisez @prénom pour mentionner quelqu'un."
        }
        rows={compact ? 2 : 4}
        maxLength={8000}
        error={Boolean(error)}
        className={cn(compact && "min-h-16")}
      />
      {error && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-error">
          <AlertCircle size={13} /> {error}
        </p>
      )}
      <div className="mt-3 flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={buttonClasses({ variant: "ghost", size: "sm" })}
          >
            <X size={15} /> Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={pending || !content.trim()}
          className={buttonClasses({ variant: "primary", size: compact ? "sm" : "md" })}
        >
          {pending ? "Envoi…" : compact ? "Répondre" : "Publier la réponse"}
        </button>
      </div>
    </form>
  );
}
