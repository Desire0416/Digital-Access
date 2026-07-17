"use client";

import * as React from "react";
import { MessagesSquare, Lock } from "lucide-react";
import { cn } from "@da/ui";
import { CommentItem, CommentComposer } from "./CommentItem";
import type { CommentNode } from "@/lib/lesson-comments";

/* ══════════════════════════════════════════════════════════════════════════
   LessonComments (§7.3) — fil de discussion sous le contenu d'une leçon.
   · Accès : seul un inscrit (ou formateur/admin) voit et poste — l'enveloppe
     `initial` est calculée côté serveur (getLessonComments), jamais ici.
   · Structure : les racines (parentId null) d'abord, épinglées en tête, puis
     leurs descendants (regroupés par parentId côté composant) indentés dessous.
   · Toutes les mutations passent par les actions serveur ; ici on ne fait que
     de l'orchestration d'affichage + `router.refresh()` (dans CommentItem).
   ══════════════════════════════════════════════════════════════════════════ */

export interface LessonCommentsProps {
  lessonId: string;
  initial: {
    canView: boolean;
    canPost: boolean;
    isModerator: boolean;
    comments: CommentNode[];
  };
}

/** Descendants transitifs d'une racine, aplatis sur un seul niveau d'indentation,
 *  triés chronologiquement — robuste aux réponses de réponses et aux orphelins. */
function collectDescendants(
  rootId: string,
  childrenByParent: Map<string, CommentNode[]>,
): CommentNode[] {
  const out: CommentNode[] = [];
  const seen = new Set<string>();
  const stack = [...(childrenByParent.get(rootId) ?? [])];
  while (stack.length) {
    const node = stack.shift()!;
    if (seen.has(node.id)) continue; // garde-fou anti-cycle
    seen.add(node.id);
    out.push(node);
    const kids = childrenByParent.get(node.id);
    if (kids) stack.push(...kids);
  }
  out.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return out;
}

export function LessonComments({ lessonId, initial }: LessonCommentsProps) {
  const { canView, canPost, isModerator, comments } = initial;

  const { roots, childrenByParent } = React.useMemo(() => {
    const ids = new Set(comments.map((c) => c.id));
    const byParent = new Map<string, CommentNode[]>();
    const rootList: CommentNode[] = [];
    for (const c of comments) {
      // Racine si pas de parent, ou parent absent du lot (défensif : parent supprimé).
      if (!c.parentId || !ids.has(c.parentId)) {
        rootList.push(c);
      } else {
        const arr = byParent.get(c.parentId) ?? [];
        arr.push(c);
        byParent.set(c.parentId, arr);
      }
    }
    // Épinglés d'abord, puis chronologique (les plus anciens en tête).
    rootList.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    return { roots: rootList, childrenByParent: byParent };
  }, [comments]);

  const total = comments.length;

  return (
    <section aria-labelledby="discussion-heading" className="mt-10">
      {/* En-tête de section */}
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand" aria-hidden>
          <MessagesSquare size={18} />
        </span>
        <div className="min-w-0">
          <h2 id="discussion-heading" className="font-display text-lg font-bold text-navy">
            Discussion
            {total > 0 && (
              <span className="ml-2 align-middle text-sm font-semibold text-text-muted">
                {total}
              </span>
            )}
          </h2>
          <span className="mt-0.5 block h-0.5 w-10 rounded-full bg-gradient-da" aria-hidden />
        </div>
      </div>

      {!canView ? (
        <div className="flex items-center gap-3 rounded-2xl border border-navy/[0.08] bg-surface-secondary/60 px-4 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy/[0.05] text-text-muted" aria-hidden>
            <Lock size={16} />
          </span>
          <p className="text-sm text-text-secondary">
            Inscrivez-vous à cette formation pour participer à la discussion et échanger avec les
            autres apprenants.
          </p>
        </div>
      ) : (
        <>
          {/* Formulaire de commentaire — visible seulement si l'utilisateur peut poster. */}
          {canPost ? (
            <div className="mb-6">
              <CommentComposer lessonId={lessonId} />
            </div>
          ) : (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-warning/25 bg-warning/[0.06] px-4 py-3">
              <Lock size={16} className="shrink-0 text-warning" aria-hidden />
              <p className="text-sm text-text-secondary">
                Confirmez votre adresse email pour participer aux discussions.
              </p>
            </div>
          )}

          {/* Fil */}
          {roots.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-navy/[0.12] bg-surface-secondary/40 px-4 py-10 text-center">
              <span className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-navy/[0.04] text-text-muted" aria-hidden>
                <MessagesSquare size={20} />
              </span>
              <p className="text-sm font-medium text-navy">Aucun commentaire pour l'instant</p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {canPost
                  ? "Lancez la discussion : posez une question ou partagez un retour."
                  : "Soyez le premier à participer une fois votre email confirmé."}
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {roots.map((root) => {
                const descendants = collectDescendants(root.id, childrenByParent);
                return (
                  <li key={root.id}>
                    <CommentItem
                      comment={root}
                      lessonId={lessonId}
                      canPost={canPost}
                      isModerator={isModerator}
                    />
                    {descendants.length > 0 && (
                      <ul
                        className={cn(
                          "mt-3 space-y-3 border-l-2 border-navy/[0.06]",
                          "pl-3 sm:pl-5",
                        )}
                      >
                        {descendants.map((child) => (
                          <li key={child.id}>
                            <CommentItem
                              comment={child}
                              lessonId={lessonId}
                              canPost={canPost}
                              isModerator={isModerator}
                              depth={1}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

export default LessonComments;
