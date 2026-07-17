import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Search,
  MessagesSquare,
  MessageSquare,
  Heart,
  Pin,
  Lock,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Route as RouteIcon,
  GraduationCap,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Avatar, StaggerGroup, StaggerItem } from "@da/ui";
import { requireUser } from "@/lib/guards";
import {
  getDiscussions,
  type CommunityContext,
  type CommunityContextType,
} from "@/lib/community";
import { EmptyState } from "@/components/EmptyState";
import { DiscussionComposer } from "@/components/community/DiscussionComposer";

export const metadata: Metadata = { title: "Espace communautaire" };

/* ══════════════════════════════════════════════════════════════════════════
   Espace communautaire (§25.1) — liste des discussions d'un contexte (formation,
   parcours, école ou cohorte). Recherche par titre (form GET). Publication
   réservée aux membres à l'email vérifié (access.canPost). Cloisonnement : une
   vue null (accès refusé) → notFound.
   ══════════════════════════════════════════════════════════════════════════ */

const VALID_TYPES = ["course", "careerPath", "school", "cohort"] as const;
type CtxType = (typeof VALID_TYPES)[number];

const TYPE_LABEL: Record<CommunityContextType, string> = {
  course: "Formation",
  careerPath: "Parcours",
  school: "École",
  cohort: "Cohorte",
};
const TYPE_ICON: Record<CommunityContextType, LucideIcon> = {
  course: BookOpen,
  careerPath: RouteIcon,
  school: GraduationCap,
  cohort: UsersRound,
};

function buildCtx(type: CtxType, id: string): CommunityContext {
  switch (type) {
    case "course":
      return { courseId: id };
    case "careerPath":
      return { careerPathId: id };
    case "school":
      return { schoolId: id };
    case "cohort":
      return { cohortId: id };
  }
}

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

export default async function CommunitySpacePage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { type, id } = await params;
  if (!VALID_TYPES.includes(type as CtxType)) notFound();
  const t = type as CtxType;

  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const user = await requireUser(`/espace/communaute/${type}/${id}`);
  const ctx = buildCtx(t, id);
  const data = await getDiscussions(ctx, user.id, { q: query || undefined });
  if (!data) notFound();

  const { access, discussions } = data;
  const contextType = access.contextType ?? t;
  const TypeIcon = TYPE_ICON[contextType];

  return (
    <div className="space-y-6">
      {/* Fil d'Ariane */}
      <Link
        href="/espace/communaute"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft size={15} aria-hidden />
        Communauté
      </Link>

      {/* En-tête */}
      <section className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-7">
        <span
          className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-brand-violet/30 blur-3xl"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-brand-cyan/20 blur-3xl"
          aria-hidden
        />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />

        <div className="relative min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-cyan">
            <TypeIcon size={13} aria-hidden />
            {TYPE_LABEL[contextType]}
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">
            {access.contextTitle}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
            <span className="inline-flex items-center gap-1.5">
              <MessagesSquare size={14} aria-hidden />
              {discussions.length === 0
                ? "Aucune discussion"
                : `${discussions.length} discussion${discussions.length > 1 ? "s" : ""}`}
            </span>
            {access.contextHref && (
              <Link href={access.contextHref} className="inline-flex items-center gap-1.5 hover:text-white">
                <ExternalLink size={14} aria-hidden />
                Voir {TYPE_LABEL[contextType].toLowerCase()}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Barre : recherche + nouvelle discussion */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form method="get" className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Rechercher une discussion…"
            aria-label="Rechercher une discussion"
            className="w-full rounded-xl border border-navy/12 bg-surface-primary py-2.5 pl-9 pr-3 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-royal/50"
          />
        </form>

        {access.canPost ? (
          <DiscussionComposer ctx={ctx} />
        ) : (
          <p className="rounded-xl border border-navy/[0.1] bg-surface-secondary/60 px-3.5 py-2.5 text-xs text-text-secondary">
            Confirmez votre adresse email pour lancer une discussion.
          </p>
        )}
      </div>

      {/* Liste des discussions */}
      {discussions.length === 0 ? (
        <EmptyState
          icon={<MessagesSquare size={40} className="text-brand-blue-vif/40" />}
          title={query ? "Aucun résultat" : "Aucune discussion pour l'instant"}
          description={
            query
              ? `Aucune discussion ne correspond à « ${query} ».`
              : access.canPost
                ? "Soyez le premier à lancer une discussion dans cet espace."
                : "Les discussions de cet espace apparaîtront ici."
          }
        />
      ) : (
        <StaggerGroup className="space-y-3">
          {discussions.map((d) => (
            <StaggerItem key={d.id}>
              <Link
                href={`/espace/communaute/sujet/${d.id}`}
                className="group flex gap-3.5 rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-all hover:-translate-y-0.5 hover:border-brand-blue-vif/40 hover:shadow-lg sm:p-5"
              >
                <Avatar
                  name={d.author.name ?? "Membre"}
                  src={d.author.avatar ?? undefined}
                  className="h-10 w-10 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {d.pinned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-violet/[0.12] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-violet">
                        <Pin size={10} className="fill-brand-violet/30" aria-hidden />
                        Épinglée
                      </span>
                    )}
                    {d.solved && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
                        <CheckCircle2 size={10} aria-hidden />
                        Résolue
                      </span>
                    )}
                    {d.locked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/[0.12] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#B45309]">
                        <Lock size={10} aria-hidden />
                        Verrouillée
                      </span>
                    )}
                  </div>

                  <h2 className="mt-1 font-display text-sm font-bold leading-snug text-navy group-hover:text-brand-blue-royal sm:text-base">
                    {d.title}
                  </h2>
                  {d.excerpt && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-secondary sm:text-sm">
                      {d.excerpt}
                    </p>
                  )}

                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-text-muted">
                    <span className="font-medium text-text-secondary">{d.author.name ?? "Membre"}</span>
                    <span aria-hidden>·</span>
                    <span>{relativeTime(d.lastActivityAt)}</span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare size={12} aria-hidden />
                      {d.replyCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart size={12} aria-hidden />
                      {d.reactionCount}
                    </span>
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      )}
    </div>
  );
}
