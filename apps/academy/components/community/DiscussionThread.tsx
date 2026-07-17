"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Heart,
  Bell,
  BellRing,
  Flag,
  Pin,
  Lock,
  LockOpen,
  Trash2,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  MessagesSquare,
  Reply as ReplyIcon,
  CornerDownRight,
} from "lucide-react";
import { Avatar, cn } from "@da/ui";
import { Markdown } from "@/components/Markdown";
import { ReplyForm } from "./ReplyForm";
import type { DiscussionView, ReplyNode, CommunityAttachment } from "@/lib/community";
import { toggleReaction, toggleFollow, submitReport, markSolution } from "@/lib/community-actions";
import {
  setDiscussionPinned,
  setDiscussionLocked,
  deleteDiscussion,
  deleteReply,
} from "@/lib/moderation-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Fil de discussion communautaire (§25.2) — orchestrateur client. Gère les
   interactions autour de la discussion (réaction, suivi, signalement, modération)
   ET le fil des réponses (réaction, réponse imbriquée, solution, signalement,
   suppression). Toute autorisation est REVÉRIFIÉE côté serveur ; l'UI se contente
   de refléter les capacités connues (`canPost`, `isModerator`, `locked`).
   Les contrôles réservés (solution / suppression) s'affichent aux modérateurs :
   la vue ne porte pas l'identité de l'auteur, aussi les chemins « auteur » sont
   laissés au serveur (jamais de bouton qui échoue).
   ══════════════════════════════════════════════════════════════════════════ */

type ReactTarget = "DISCUSSION" | "REPLY";

/* Heure relative en français, sans dépendance externe. */
function relativeTime(value: Date): string {
  const diff = Date.now() - value.getTime();
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) return "à l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `il y a ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `il y a ${days} j`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `il y a ${weeks} sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(days / 365);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
}

/* Aplati → ordre threadé (enfants regroupés sous leur parent), avec profondeur. */
function threadOrder(replies: ReplyNode[]): { node: ReplyNode; depth: number }[] {
  const ids = new Set(replies.map((r) => r.id));
  const byParent = new Map<string | null, ReplyNode[]>();
  for (const r of replies) {
    const key = r.parentId && ids.has(r.parentId) ? r.parentId : null;
    const bucket = byParent.get(key);
    if (bucket) bucket.push(r);
    else byParent.set(key, [r]);
  }
  const out: { node: ReplyNode; depth: number }[] = [];
  const walk = (parentKey: string | null, depth: number) => {
    const kids = byParent.get(parentKey);
    if (!kids) return;
    for (const k of kids) {
      out.push({ node: k, depth });
      walk(k.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

/* ─── Galerie de pièces jointes (images) ───────────────────────────────────── */
function AttachmentGallery({ items }: { items: CommunityAttachment[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((a) => (
        <a
          key={a.url}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block aspect-video overflow-hidden rounded-lg border border-navy/[0.08]"
          title={a.name}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={a.url}
            alt={a.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
          />
        </a>
      ))}
    </div>
  );
}

/* ─── Bouton réaction « j'aime » (optimiste, self-contained) ───────────────── */
function ReactionButton({
  targetType,
  targetId,
  initialReacted,
  initialCount,
}: {
  targetType: ReactTarget;
  targetId: string;
  initialReacted: boolean;
  initialCount: number;
}) {
  const [reacted, setReacted] = React.useState(initialReacted);
  const [count, setCount] = React.useState(initialCount);
  const [pending, start] = React.useTransition();

  function toggle() {
    start(async () => {
      const res = await toggleReaction(targetType, targetId);
      if (res.ok) {
        setReacted(res.reacted);
        setCount(res.count);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={reacted}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60",
        reacted
          ? "border-transparent bg-error/[0.08] text-error"
          : "border-navy/12 text-text-secondary hover:border-navy/25 hover:text-navy",
      )}
    >
      <Heart size={14} className={reacted ? "fill-error" : ""} aria-hidden />
      <span className="tabular-nums">{count}</span>
      <span className="sr-only">J'aime</span>
    </button>
  );
}

/* ─── Bouton signaler (générique) ──────────────────────────────────────────── */
function ReportButton({ targetType, targetId }: { targetType: ReactTarget; targetId: string }) {
  const [pending, start] = React.useTransition();
  const [notice, setNotice] = React.useState<{ tone: "ok" | "err"; text: string } | null>(null);

  function go() {
    const reason = window.prompt("Pourquoi signaler ce contenu ? Indiquez un motif (min. 3 caractères).");
    if (reason == null) return;
    start(async () => {
      const res = await submitReport(targetType, targetId, reason);
      if (res.ok) setNotice({ tone: "ok", text: res.message ?? "Signalement transmis." });
      else setNotice({ tone: "err", text: res.error ?? "Échec du signalement." });
      setTimeout(() => setNotice(null), 3200);
    });
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={go}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-navy disabled:opacity-60"
      >
        {pending ? <Loader2 size={13} className="animate-spin" aria-hidden /> : <Flag size={13} aria-hidden />}
        Signaler
      </button>
      {notice && (
        <span className={cn("text-[11px] font-medium", notice.tone === "ok" ? "text-success" : "text-error")}>
          {notice.text}
        </span>
      )}
    </span>
  );
}

/* ─── Une réponse du fil ───────────────────────────────────────────────────── */
function ReplyItem({
  reply,
  depth,
  discussion,
}: {
  reply: ReplyNode;
  depth: number;
  discussion: DiscussionView;
}) {
  const router = useRouter();
  const [replying, setReplying] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState("");

  const canReply = discussion.canPost && !discussion.locked;
  const canModerate = discussion.isModerator;
  const indent = Math.min(depth, 4);

  function onMarkSolution() {
    setError("");
    start(async () => {
      const res = await markSolution(reply.id);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Action impossible.");
    });
  }

  function onDelete() {
    setError("");
    start(async () => {
      const res = await deleteReply(reply.id);
      if (res.ok) {
        setConfirmingDelete(false);
        router.refresh();
      } else {
        setError(res.error);
        setConfirmingDelete(false);
      }
    });
  }

  return (
    <div id={`reponse-${reply.id}`} className="scroll-mt-24" style={{ marginLeft: indent * 14 }}>
      <div
        className={cn(
          "rounded-xl border p-4",
          depth > 0 && "border-l-[3px]",
          reply.isSolution
            ? "border-success/30 bg-success/[0.04]"
            : "border-navy/[0.07] bg-surface-primary",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {depth > 0 && (
              <CornerDownRight size={14} className="shrink-0 text-text-muted" aria-hidden />
            )}
            <Avatar
              name={reply.author.name ?? "Membre"}
              src={reply.author.avatar ?? undefined}
              className="h-8 w-8 shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-navy">
                {reply.author.name ?? "Membre"}
              </p>
              <p className="text-[11px] text-text-muted">{relativeTime(reply.createdAt)}</p>
            </div>
          </div>
          {reply.isSolution && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
              <CheckCircle2 size={11} aria-hidden />
              Solution
            </span>
          )}
        </div>

        <div className="mt-2.5">
          <Markdown className="prose-sm">{reply.body}</Markdown>
        </div>

        <AttachmentGallery items={reply.attachments} />

        <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-2">
          <ReactionButton
            targetType="REPLY"
            targetId={reply.id}
            initialReacted={reply.reacted}
            initialCount={reply.reactionCount}
          />

          {canReply && (
            <button
              type="button"
              onClick={() => setReplying((v) => !v)}
              aria-expanded={replying}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-navy/[0.05] hover:text-navy"
            >
              <ReplyIcon size={13} aria-hidden />
              Répondre
            </button>
          )}

          {(discussion.isAuthor || canModerate) && !reply.isSolution && (
            <button
              type="button"
              onClick={onMarkSolution}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success/[0.08] disabled:opacity-60"
            >
              {pending ? (
                <Loader2 size={13} className="animate-spin" aria-hidden />
              ) : (
                <CheckCircle2 size={13} aria-hidden />
              )}
              Marquer comme solution
            </button>
          )}

          <ReportButton targetType="REPLY" targetId={reply.id} />

          {(reply.isOwn || canModerate) &&
            (confirmingDelete ? (
              <span className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={pending}
                  className="inline-flex items-center gap-1 rounded-lg bg-error px-2.5 py-1 text-[11px] font-semibold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                >
                  {pending && <Loader2 size={11} className="animate-spin" aria-hidden />}
                  Confirmer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={pending}
                  className="rounded-lg px-2 py-1 text-[11px] font-medium text-text-muted transition-colors hover:bg-navy/[0.05]"
                >
                  Annuler
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                aria-label="Supprimer la réponse"
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-error/[0.08] hover:text-error"
              >
                <Trash2 size={13} aria-hidden />
                Supprimer
              </button>
            ))}
        </div>

        {error && <p className="mt-2 text-xs font-medium text-error">{error}</p>}
      </div>

      {replying && (
        <div className="mt-2.5">
          <ReplyForm
            discussionId={discussion.id}
            parentId={reply.id}
            autoFocus
            placeholder={`Répondre à ${reply.author.name ?? "ce membre"}…`}
            onDone={() => setReplying(false)}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Orchestrateur du fil ─────────────────────────────────────────────────── */
export function DiscussionThread({ discussion }: { discussion: DiscussionView }) {
  const router = useRouter();
  const reduce = useReducedMotion();

  const [following, setFollowing] = React.useState(discussion.following);
  const [followPending, startFollow] = React.useTransition();

  const [modPending, startMod] = React.useTransition();
  const [modError, setModError] = React.useState("");
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  const ordered = React.useMemo(() => threadOrder(discussion.replies), [discussion.replies]);

  function onFollow() {
    startFollow(async () => {
      const res = await toggleFollow(discussion.id);
      if (res.ok) setFollowing(res.following);
    });
  }

  function onPin() {
    setModError("");
    startMod(async () => {
      const res = await setDiscussionPinned(discussion.id, !discussion.pinned);
      if (res.ok) router.refresh();
      else setModError(res.error);
    });
  }

  function onLock() {
    setModError("");
    startMod(async () => {
      const res = await setDiscussionLocked(discussion.id, !discussion.locked);
      if (res.ok) router.refresh();
      else setModError(res.error);
    });
  }

  function onDeleteDiscussion() {
    setModError("");
    startMod(async () => {
      const res = await deleteDiscussion(discussion.id);
      if (res.ok) router.push(discussion.context.href);
      else {
        setModError(res.error);
        setConfirmingDelete(false);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Barre d'actions de la discussion ── */}
      <div className="rounded-2xl border border-navy/[0.07] bg-surface-secondary/50 p-3.5">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          <ReactionButton
            targetType="DISCUSSION"
            targetId={discussion.id}
            initialReacted={discussion.reacted}
            initialCount={discussion.reactionCount}
          />

          <button
            type="button"
            onClick={onFollow}
            disabled={followPending}
            aria-pressed={following}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60",
              following
                ? "border-transparent bg-brand-violet/[0.1] text-brand-violet"
                : "border-navy/12 text-text-secondary hover:border-navy/25 hover:text-navy",
            )}
          >
            {followPending ? (
              <Loader2 size={13} className="animate-spin" aria-hidden />
            ) : following ? (
              <BellRing size={13} aria-hidden />
            ) : (
              <Bell size={13} aria-hidden />
            )}
            {following ? "Suivi" : "Suivre"}
          </button>

          <ReportButton targetType="DISCUSSION" targetId={discussion.id} />

          {/* ── Contrôles modérateur ── */}
          {discussion.isModerator && (
            <span className="ml-auto flex flex-wrap items-center gap-1.5">
              <span className="mr-0.5 hidden items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-brand-violet sm:inline-flex">
                <ShieldCheck size={12} aria-hidden />
                Modération
              </span>
              <button
                type="button"
                onClick={onPin}
                disabled={modPending}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60",
                  discussion.pinned
                    ? "border-transparent bg-brand-violet/[0.1] text-brand-violet"
                    : "border-navy/12 text-text-secondary hover:border-navy/25 hover:text-navy",
                )}
              >
                <Pin size={13} className={discussion.pinned ? "fill-brand-violet/30" : ""} aria-hidden />
                {discussion.pinned ? "Désépingler" : "Épingler"}
              </button>
              <button
                type="button"
                onClick={onLock}
                disabled={modPending}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60",
                  discussion.locked
                    ? "border-transparent bg-warning/[0.12] text-[#B45309]"
                    : "border-navy/12 text-text-secondary hover:border-navy/25 hover:text-navy",
                )}
              >
                {discussion.locked ? <LockOpen size={13} aria-hidden /> : <Lock size={13} aria-hidden />}
                {discussion.locked ? "Déverrouiller" : "Verrouiller"}
              </button>

              {confirmingDelete ? (
                <span className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onDeleteDiscussion}
                    disabled={modPending}
                    className="inline-flex items-center gap-1 rounded-lg bg-error px-2.5 py-1.5 text-[11px] font-semibold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                  >
                    {modPending && <Loader2 size={11} className="animate-spin" aria-hidden />}
                    Supprimer définitivement
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={modPending}
                    className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-text-muted transition-colors hover:bg-navy/[0.05]"
                  >
                    Annuler
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-error/[0.08] hover:text-error"
                >
                  <Trash2 size={13} aria-hidden />
                  Supprimer
                </button>
              )}
            </span>
          )}

          {/* Suppression par l'auteur (non-modérateur) de sa propre discussion */}
          {discussion.isAuthor && !discussion.isModerator && (
            <span className="ml-auto">
              {confirmingDelete ? (
                <span className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onDeleteDiscussion}
                    disabled={modPending}
                    className="inline-flex items-center gap-1 rounded-lg bg-error px-2.5 py-1.5 text-[11px] font-semibold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
                  >
                    {modPending && <Loader2 size={11} className="animate-spin" aria-hidden />}
                    Supprimer définitivement
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={modPending}
                    className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-text-muted transition-colors hover:bg-navy/[0.05]"
                  >
                    Annuler
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-error/[0.08] hover:text-error"
                >
                  <Trash2 size={13} aria-hidden />
                  Supprimer
                </button>
              )}
            </span>
          )}
        </div>
        {modError && <p className="mt-2 text-xs font-medium text-error">{modError}</p>}
      </div>

      {/* ── Fil des réponses ── */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-navy sm:text-lg">
          <MessagesSquare size={17} className="text-brand-blue-royal" aria-hidden />
          {discussion.replies.length > 0
            ? `${discussion.replies.length} réponse${discussion.replies.length > 1 ? "s" : ""}`
            : "Réponses"}
        </h2>

        {ordered.length > 0 ? (
          <motion.ul
            initial={reduce ? false : "hidden"}
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
            className="space-y-2.5"
          >
            {ordered.map(({ node, depth }) => (
              <motion.li
                key={node.id}
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              >
                <ReplyItem reply={node} depth={depth} discussion={discussion} />
              </motion.li>
            ))}
          </motion.ul>
        ) : (
          <p className="rounded-xl border border-dashed border-navy/[0.12] bg-surface-secondary/50 px-4 py-6 text-center text-sm text-text-secondary">
            Aucune réponse pour l'instant. Lancez la conversation ci-dessous.
          </p>
        )}
      </section>

      {/* ── Zone de réponse ── */}
      {discussion.locked ? (
        <p className="inline-flex items-center gap-2 rounded-xl border border-warning/25 bg-warning/[0.06] px-4 py-3 text-sm font-medium text-[#B45309]">
          <Lock size={15} aria-hidden />
          Cette discussion est verrouillée : les nouvelles réponses sont désactivées.
        </p>
      ) : discussion.canPost ? (
        <div>
          <h3 className="mb-2.5 font-display text-sm font-bold text-navy">Votre réponse</h3>
          <ReplyForm discussionId={discussion.id} />
        </div>
      ) : (
        <p className="rounded-xl border border-navy/[0.1] bg-surface-secondary/60 px-4 py-3 text-sm text-text-secondary">
          Confirmez votre adresse email pour participer à cette discussion.
        </p>
      )}
    </div>
  );
}

export default DiscussionThread;
