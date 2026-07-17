import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pin,
  Lock,
  CheckCircle2,
  BookOpen,
  Route as RouteIcon,
  GraduationCap,
  UsersRound,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";
import { Avatar, cn } from "@da/ui";
import { requireUser } from "@/lib/guards";
import { getDiscussion, type CommunityContextType } from "@/lib/community";
import { Markdown } from "@/components/Markdown";
import { DiscussionThread } from "@/components/community/DiscussionThread";

export const metadata: Metadata = { title: "Discussion" };

/* ══════════════════════════════════════════════════════════════════════════
   Détail d'une discussion (§25.2) — en-tête + corps + pièces jointes rendus côté
   serveur ; le fil (réponses, réactions, suivi, modération) est confié au
   composant client <DiscussionThread>. Cloisonnement : getDiscussion renvoie null
   si l'espace est inaccessible → notFound.
   ══════════════════════════════════════════════════════════════════════════ */

const CONTEXT_ICON: Record<CommunityContextType, LucideIcon> = {
  course: BookOpen,
  careerPath: RouteIcon,
  school: GraduationCap,
  cohort: UsersRound,
};

const dfDateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });

export default async function DiscussionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/espace/communaute/sujet/${id}`);
  const view = await getDiscussion(id, user.id);
  if (!view) notFound();

  const ContextIcon = view.context.type ? CONTEXT_ICON[view.context.type] : MessagesSquare;

  return (
    <div className="space-y-6">
      {/* Fil d'Ariane */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-secondary">
        <Link
          href="/espace/communaute"
          className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-navy"
        >
          <ArrowLeft size={15} aria-hidden />
          Communauté
        </Link>
        {view.context.title && (
          <>
            <span aria-hidden>/</span>
            <Link
              href={view.context.href}
              className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-navy"
            >
              <ContextIcon size={14} aria-hidden />
              <span className="min-w-0 max-w-[60vw] truncate">{view.context.title}</span>
            </Link>
          </>
        )}
      </div>

      {/* En-tête de la discussion */}
      <article className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {view.pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-violet/[0.12] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-violet">
              <Pin size={10} className="fill-brand-violet/30" aria-hidden />
              Épinglée
            </span>
          )}
          {view.solved && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
              <CheckCircle2 size={10} aria-hidden />
              Résolue
            </span>
          )}
          {view.locked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/[0.12] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#B45309]">
              <Lock size={10} aria-hidden />
              Verrouillée
            </span>
          )}
        </div>

        <h1 className="mt-2 font-display text-xl font-bold leading-tight text-navy sm:text-2xl">
          {view.title}
        </h1>

        <div className="mt-3 flex items-center gap-3 border-b border-navy/[0.06] pb-4">
          <Avatar
            name={view.author.name ?? "Membre"}
            src={view.author.avatar ?? undefined}
            className="h-10 w-10 shrink-0"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-navy">{view.author.name ?? "Membre"}</p>
            <p className="text-xs text-text-muted">{dfDateTime.format(view.createdAt)}</p>
          </div>
        </div>

        <div className="mt-4">
          <Markdown>{view.body}</Markdown>
        </div>

        {/* Pièces jointes (images) */}
        {view.attachments.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {view.attachments.map((a) => (
              <a
                key={a.url}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                title={a.name}
                className="group relative block aspect-video overflow-hidden rounded-lg border border-navy/[0.08]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt={a.name}
                  className={cn(
                    "h-full w-full object-cover transition-transform group-hover:scale-[1.03]",
                  )}
                />
              </a>
            ))}
          </div>
        )}
      </article>

      {/* Actions + fil (client) */}
      <DiscussionThread discussion={view} />
    </div>
  );
}
