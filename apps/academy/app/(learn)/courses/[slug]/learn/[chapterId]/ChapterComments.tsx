"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  MessagesSquare,
  Send,
  Reply as ReplyIcon,
  CornerDownRight,
  Pin,
  PinOff,
  Trash2,
  AlertCircle,
  MailWarning,
  X,
} from "lucide-react";
import { Avatar, Textarea, buttonClasses, cn } from "@da/ui";
import {
  postChapterComment,
  pinComment,
  deleteComment,
} from "@/lib/community-actions";
import { InstructorBadge } from "@/app/(site)/courses/[slug]/forum/community-ui";

/* ══════════════════════════════════════════════════════════════════════════
   Discussion de chapitre — intégré dans le lecteur immersif.
   Composant autonome (helpers @mentions + date relative locaux), fond clair.
   Formulaire d'ajout, épinglés en tête, réponses imbriquées (parentId),
   modération (épingler / supprimer) selon droits. Design DA soigné, responsive.
   ══════════════════════════════════════════════════════════════════════════ */

export type ChapterComment = {
  id: string;
  content: string;
  pinned: boolean;
  parentId: string | null;
  author: {
    id: string;
    name: string;
    avatar: string | null;
    isInstructor: boolean;
  };
  createdAt: string;
};

type CommentNode = ChapterComment & { children: CommentNode[] };

/* ─────────────────────────────── Helpers locaux ────────────────────────── */

/**
 * Découpe un texte brut et surligne les @mentions
 * (lettres / chiffres / points / tirets) sans casser le reste du contenu.
 */
function renderWithMentions(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /@[A-Za-z0-9._-]+/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <span key={`m-${key++}`} className="font-semibold text-brand-blue-royal">
        {match[0]}
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Rend un contenu multi-lignes avec mentions surlignées (préserve les sauts de ligne). */
function CommentBody({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  return (
    <div
      className={cn(
        "whitespace-pre-wrap break-words text-[0.95rem] leading-relaxed text-navy/85",
        className,
      )}
    >
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {renderWithMentions(line)}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
}

/** Date ISO → libellé relatif court en français ("il y a 5 min", "hier"…). */
function relativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "à l'instant";
  const min = Math.round(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `il y a ${hrs} h`;
  const days = Math.round(hrs / 24);
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} j`;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(then);
}

/** Construit l'arbre des commentaires à partir de la liste plate (parentId). */
function buildTree(comments: ChapterComment[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];
  comments.forEach((c) => map.set(c.id, { ...c, children: [] }));
  comments.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  // Épinglés d'abord parmi les racines, puis le reste.
  roots.sort((a, b) => Number(b.pinned) - Number(a.pinned));
  return roots;
}

/* ═════════════════════════════════ Composant ════════════════════════════ */

export function ChapterComments({
  slug,
  chapterId,
  comments,
  canView,
  canPost,
  isPrivileged,
  currentUserId,
}: {
  slug: string;
  chapterId: string;
  comments: ChapterComment[];
  canView: boolean;
  canPost: boolean;
  isPrivileged: boolean;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const tree = React.useMemo(() => buildTree(comments), [comments]);
  const total = comments.length;

  const refresh = React.useCallback(() => router.refresh(), [router]);

  return (
    <section aria-labelledby="chapter-discussion" className="mt-12">
      {/* En-tête de section */}
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-da text-white shadow-brand"
        >
          <MessagesSquare size={19} />
        </span>
        <div className="min-w-0">
          <h2
            id="chapter-discussion"
            className="font-display text-xl font-bold tracking-tight text-navy sm:text-2xl"
          >
            Discussion
          </h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            {total === 0
              ? "Posez vos questions sur ce chapitre"
              : `${total} message${total > 1 ? "s" : ""} · échangez avec la communauté`}
          </p>
        </div>
      </div>

      {/* ── Accès en lecture réservé aux inscrits ── */}
      {!canView ? (
        <JoinGate slug={slug} className="mt-6" />
      ) : (
        <>
          {/* Formulaire d'ajout (racine) — ou bandeau email non vérifié */}
          <div className="mt-6">
            {canPost ? (
              <CommentForm slug={slug} chapterId={chapterId} onDone={refresh} root />
            ) : (
              <VerifyBanner />
            )}
          </div>

          {/* Liste des commentaires */}
          <div className="mt-8">
            {total === 0 ? (
              <EmptyState canPost={canPost} />
            ) : (
              <ul className="space-y-4">
                <AnimatePresence initial={false}>
                  {tree.map((node) => (
                    <CommentCard
                      key={node.id}
                      node={node}
                      depth={0}
                      slug={slug}
                      chapterId={chapterId}
                      canPost={canPost}
                      isPrivileged={isPrivileged}
                      currentUserId={currentUserId}
                      onChanged={refresh}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/* ──────────────────────────────── Carte commentaire ────────────────────── */

function CommentCard({
  node,
  depth,
  slug,
  chapterId,
  canPost,
  isPrivileged,
  currentUserId,
  onChanged,
}: {
  node: CommentNode;
  depth: number;
  slug: string;
  chapterId: string;
  canPost: boolean;
  isPrivileged: boolean;
  currentUserId: string | null;
  onChanged: () => void;
}) {
  const [pending, startTransition] = React.useTransition();
  const [replying, setReplying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isOwner = currentUserId !== null && currentUserId === node.author.id;
  const canDelete = isOwner || isPrivileged;
  // Indentation limitée pour rester lisible sur mobile (375px).
  const indent = Math.min(depth, 3);

  function handlePin(next: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await pinComment(slug, chapterId, node.id, next);
      if (res.ok) onChanged();
      else setError(res.error);
    });
  }

  function handleDelete() {
    if (!window.confirm("Supprimer ce commentaire ?")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteComment(slug, chapterId, node.id);
      if (res.ok) onChanged();
      else setError(res.error);
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
        indent > 0 && "ml-3 border-l-2 border-brand-blue-vif/20 pl-3 sm:ml-5 sm:pl-5",
      )}
    >
      <div
        className={cn(
          "overflow-hidden rounded-2xl border bg-surface-primary transition-shadow hover:shadow-lg",
          node.pinned
            ? "border-brand-violet/30 shadow-[0_0_0_1px_rgba(91,63,168,0.12)]"
            : "border-navy/[0.07]",
        )}
      >
        {/* Bandeau épinglé */}
        {node.pinned && (
          <div className="flex items-center gap-1.5 bg-gradient-da px-4 py-1.5 text-xs font-semibold text-white">
            <Pin size={13} /> Épinglé par l&apos;instructeur
          </div>
        )}

        <div className="p-4 sm:p-5">
          {/* Auteur + date */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <Avatar
              name={node.author.name}
              src={node.author.avatar ?? undefined}
              className="h-7 w-7 text-[0.62rem]"
            />
            <span className="font-semibold text-navy">{node.author.name}</span>
            {node.author.isInstructor && <InstructorBadge />}
            <span aria-hidden className="text-text-muted">
              ·
            </span>
            <span className="text-xs text-text-muted">{relativeDate(node.createdAt)}</span>
          </div>

          {/* Contenu avec mentions surlignées */}
          <CommentBody text={node.content} className="mt-2.5" />

          {error && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-error">
              <AlertCircle size={13} /> {error}
            </p>
          )}

          {/* Actions */}
          <div className="mt-3 flex flex-wrap items-center gap-1">
            {canPost && (
              <button
                type="button"
                onClick={() => setReplying((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-brand-blue-vif/10 hover:text-brand-blue-royal"
              >
                <ReplyIcon size={14} /> Répondre
              </button>
            )}
            {isPrivileged && (
              <button
                type="button"
                onClick={() => handlePin(!node.pinned)}
                disabled={pending}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  node.pinned
                    ? "text-text-secondary hover:bg-navy/[0.06] hover:text-navy"
                    : "text-brand-violet hover:bg-brand-violet/10",
                )}
              >
                {node.pinned ? (
                  <>
                    <PinOff size={14} /> Désépingler
                  </>
                ) : (
                  <>
                    <Pin size={14} /> Épingler
                  </>
                )}
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

          {/* Formulaire de réponse inline */}
          <AnimatePresence>
            {replying && canPost && (
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
                  <CommentForm
                    slug={slug}
                    chapterId={chapterId}
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

      {/* Réponses imbriquées */}
      {node.children.length > 0 && (
        <ul className="mt-4 space-y-4">
          <AnimatePresence initial={false}>
            {node.children.map((child) => (
              <CommentCard
                key={child.id}
                node={child}
                depth={depth + 1}
                slug={slug}
                chapterId={chapterId}
                canPost={canPost}
                isPrivileged={isPrivileged}
                currentUserId={currentUserId}
                onChanged={onChanged}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </motion.li>
  );
}

/* ─────────────────────────────── Formulaire commentaire ────────────────── */

function CommentForm({
  slug,
  chapterId,
  parentId,
  onDone,
  onCancel,
  compact,
  root,
}: {
  slug: string;
  chapterId: string;
  parentId?: string | null;
  onDone: () => void;
  onCancel?: () => void;
  compact?: boolean;
  root?: boolean;
}) {
  const [pending, startTransition] = React.useTransition();
  const [content, setContent] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await postChapterComment(slug, chapterId, {
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
    <form
      onSubmit={handleSubmit}
      className={cn(
        root &&
          "rounded-2xl border border-navy/[0.07] bg-surface-secondary/60 p-4 sm:p-5",
      )}
    >
      {root && (
        <div className="mb-3 flex items-center gap-3">
          <span aria-hidden className="h-px w-8 rounded-full bg-gradient-da" />
          <h3 className="font-display text-base font-bold tracking-tight text-navy">
            Ajouter un commentaire
          </h3>
        </div>
      )}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          compact
            ? "Écrire une réponse… (mentionnez avec @prénom)"
            : "Une question, une remarque ? Partagez-la… Utilisez @prénom pour mentionner quelqu'un."
        }
        rows={compact ? 2 : 3}
        maxLength={4000}
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
          <Send size={15} className={cn(!compact && "sm:mr-0.5")} />
          {pending ? "Envoi…" : compact ? "Répondre" : "Commenter"}
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────────────── États annexes ─────────────────────────── */

/** État vide soigné (aucun commentaire). */
function EmptyState({ canPost }: { canPost: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-navy/15 bg-surface-secondary/50 px-6 py-10 text-center">
      <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-da text-white shadow-brand">
        <MessagesSquare size={22} />
      </span>
      <p className="font-display text-base font-bold text-navy">
        Aucun commentaire pour l&apos;instant
      </p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-text-secondary">
        {canPost
          ? "Ouvrez la discussion : posez une question ou partagez un retour sur ce chapitre."
          : "Les échanges de la communauté sur ce chapitre apparaîtront ici."}
      </p>
    </div>
  );
}

/** Bandeau : peut lire mais email non vérifié → publication bloquée. */
function VerifyBanner() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-warning/30 bg-warning/[0.07] p-4 sm:flex-row sm:items-center sm:gap-4">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-[#B45309]">
        <MailWarning size={20} />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-navy">
          Confirmez votre email pour commenter
        </p>
        <p className="mt-0.5 text-sm text-text-secondary">
          Vous pouvez lire la discussion. Vérifiez votre adresse pour publier un
          commentaire.
        </p>
      </div>
      <Link
        href="/auth/verify-email"
        className={cn(buttonClasses({ variant: "outline", size: "sm" }), "shrink-0")}
      >
        Renvoyer l&apos;email
      </Link>
    </div>
  );
}

/** Accès réservé aux inscrits : invite à rejoindre le cours. */
function JoinGate({ slug, className }: { slug: string; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-navy/[0.07] bg-surface-secondary/60 px-6 py-8 text-center",
        className,
      )}
    >
      <span className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-da text-white shadow-brand">
        <MessagesSquare size={22} />
      </span>
      <p className="font-display text-base font-bold text-navy">
        Rejoignez le cours pour accéder à la discussion
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-text-secondary">
        Échangez avec les autres apprenants et l&apos;instructeur sur chaque chapitre.
      </p>
      <Link
        href={`/courses/${slug}`}
        className={cn(buttonClasses({ variant: "primary", size: "md" }), "mt-5")}
      >
        Rejoindre le cours
      </Link>
    </div>
  );
}
