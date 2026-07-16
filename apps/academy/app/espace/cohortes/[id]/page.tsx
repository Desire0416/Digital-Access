import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  UsersRound,
  ArrowLeft,
  BookOpen,
  Route as RouteIcon,
  CalendarDays,
  CalendarClock,
  Clock,
  MapPin,
  Video,
  PlayCircle,
  Megaphone,
  Pin,
  GraduationCap,
  ScrollText,
  History,
  Radio,
  MonitorPlay,
  Wrench,
  Presentation,
  MessagesSquare,
  Mic,
  MessageCircleQuestion,
  type LucideIcon,
} from "lucide-react";
import { Avatar, cn } from "@da/ui";
import type { CohortType, CohortStatus, EventType } from "@da/academy-db/client";
import { requireUser } from "@/lib/guards";
import { getCohortForMember, type CohortSessionView, type CohortMemberView } from "@/lib/cohorts";
import { Markdown } from "@/components/Markdown";
import { Panel } from "@/components/espace/parts";
import { ProgressBar } from "@/components/espace/ProgressBar";
import {
  AnnouncementComposer,
  AnnouncementDeleteButton,
} from "@/components/cohort/AnnouncementComposer";
import { CohortLeaveButton } from "@/components/cohort/CohortLeaveButton";

export const metadata: Metadata = { title: "Espace cohorte" };

/* ── Libellés FR (§23-§24) ── */
const COHORT_TYPE_LABEL: Record<CohortType, string> = {
  AUTONOMOUS: "Autonome",
  GUIDED: "Accompagnée",
  INTENSIVE: "Intensive",
  ENTERPRISE: "Entreprise",
  HYBRID: "Hybride",
  VIRTUAL_CLASS: "Classe virtuelle",
};
const COHORT_STATUS_LABEL: Record<CohortStatus, string> = {
  DRAFT: "Brouillon",
  OPEN: "Inscriptions ouvertes",
  RUNNING: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};
const STATUS_BADGE: Record<CohortStatus, string> = {
  DRAFT: "bg-white/15 text-white",
  OPEN: "bg-success/25 text-white",
  RUNNING: "bg-brand-cyan/30 text-white",
  COMPLETED: "bg-white/15 text-white",
  CANCELLED: "bg-error/30 text-white",
};
const EVENT_TYPE_LABEL: Record<EventType, string> = {
  WEBINAR: "Webinaire",
  VIRTUAL_CLASS: "Classe virtuelle",
  WORKSHOP: "Atelier",
  DEFENSE: "Soutenance",
  MENTORING: "Mentorat",
  CONFERENCE: "Conférence",
  QA_SESSION: "Questions-réponses",
};
const EVENT_TYPE_ICON: Record<EventType, LucideIcon> = {
  WEBINAR: Radio,
  VIRTUAL_CLASS: MonitorPlay,
  WORKSHOP: Wrench,
  DEFENSE: Presentation,
  MENTORING: MessagesSquare,
  CONFERENCE: Mic,
  QA_SESSION: MessageCircleQuestion,
};

const dfDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const dfDateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
const dfClock = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
function formatDate(d: Date) {
  return dfDate.format(d);
}
function formatDateTime(d: Date) {
  return dfDateTime.format(d);
}
function formatClock(d: Date) {
  return dfClock.format(d);
}

function periodLabel(v: CohortMemberView): string {
  if (v.endDate) return `Du ${formatDate(v.startDate)} au ${formatDate(v.endDate)}`;
  return `Débute le ${formatDate(v.startDate)}`;
}

export default async function CohortSpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/espace/cohortes/${id}`);
  const view = await getCohortForMember(id, user.id);
  if (!view) notFound();

  const targetHref = view.target
    ? view.target.kind === "course"
      ? `/formations/${view.target.slug}`
      : `/parcours-metiers/${view.target.slug}`
    : null;
  const isPath = view.target?.kind === "careerPath";

  return (
    <div className="space-y-6">
      <Link
        href="/espace/cohortes"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft size={15} aria-hidden />
        Mes cohortes
      </Link>

      {/* ── En-tête ── */}
      <section className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-8">
        <span className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-violet/30 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-brand-cyan/20 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />

        <div className="relative min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-cyan">
              <UsersRound size={13} aria-hidden />
              {COHORT_TYPE_LABEL[view.type]}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
                STATUS_BADGE[view.status],
              )}
            >
              {COHORT_STATUS_LABEL[view.status]}
            </span>
          </div>

          <h1 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">{view.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
            {view.target &&
              (targetHref ? (
                <Link href={targetHref} className="inline-flex items-center gap-1.5 hover:text-white">
                  {isPath ? <RouteIcon size={14} aria-hidden /> : <BookOpen size={14} aria-hidden />}
                  <span className="min-w-0 truncate">{view.target.title}</span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  {isPath ? <RouteIcon size={14} aria-hidden /> : <BookOpen size={14} aria-hidden />}
                  {view.target.title}
                </span>
              ))}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} aria-hidden />
              {periodLabel(view)}
            </span>
            {view.rhythm && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} aria-hidden />
                {view.rhythm}
              </span>
            )}
          </div>

          <div className="mt-5 max-w-md">
            <div className="mb-1.5 flex items-center justify-between text-xs text-white/70">
              <span>Votre progression</span>
              <span className="font-bold text-white">{Math.round(view.myProgress)}%</span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-white/15">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-cyan to-white"
                style={{ width: `${Math.max(3, Math.round(view.myProgress))}%` }}
                aria-hidden
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Colonne principale ── */}
        <div className="space-y-6 lg:col-span-2">
          {/* À propos + règles */}
          {(view.description || view.rules) && (
            <Panel
              title={
                <span className="inline-flex items-center gap-2">
                  <ScrollText size={16} className="text-brand-blue-royal" aria-hidden />
                  À propos de la cohorte
                </span>
              }
            >
              <div className="space-y-5">
                {view.description && <Markdown>{view.description}</Markdown>}
                {view.rules && (
                  <div className="rounded-xl border border-navy/[0.07] bg-surface-secondary/50 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-violet">
                      Règles de la cohorte
                    </p>
                    <Markdown className="prose-sm">{view.rules}</Markdown>
                  </div>
                )}
              </div>
            </Panel>
          )}

          {/* Sessions à venir */}
          <Panel
            title={
              <span className="inline-flex items-center gap-2">
                <CalendarClock size={16} className="text-brand-blue-royal" aria-hidden />
                Prochaines sessions
              </span>
            }
          >
            {view.upcomingSessions.length > 0 ? (
              <ul className="space-y-3">
                {view.upcomingSessions.map((s) => (
                  <li key={s.id}>
                    <SessionCard session={s} past={false} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-text-secondary">
                Aucune session programmée pour le moment. Vous serez notifié dès qu'une nouvelle date est fixée.
              </p>
            )}
          </Panel>

          {/* Sessions passées */}
          {view.pastSessions.length > 0 && (
            <Panel
              title={
                <span className="inline-flex items-center gap-2">
                  <History size={16} className="text-text-muted" aria-hidden />
                  Sessions passées
                </span>
              }
            >
              <ul className="space-y-3">
                {view.pastSessions.map((s) => (
                  <li key={s.id}>
                    <SessionCard session={s} past />
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {/* Annonces */}
          <Panel
            title={
              <span className="inline-flex items-center gap-2">
                <Megaphone size={16} className="text-brand-blue-royal" aria-hidden />
                Annonces
              </span>
            }
          >
            <div className="space-y-4">
              {view.canPost && <AnnouncementComposer cohortId={view.id} />}

              {view.announcements.length > 0 ? (
                <ul className="space-y-3">
                  {view.announcements.map((a) => (
                    <li
                      key={a.id}
                      className={cn(
                        "rounded-xl border p-4",
                        a.pinned
                          ? "border-brand-violet/25 bg-brand-violet/[0.04]"
                          : "border-navy/[0.07] bg-surface-primary",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {a.pinned && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-brand-violet/[0.12] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-violet">
                                <Pin size={10} className="fill-brand-violet/30" aria-hidden />
                                Épinglée
                              </span>
                            )}
                            <h3 className="font-display text-sm font-bold text-navy">{a.title}</h3>
                          </div>
                        </div>
                        {view.canPost && <AnnouncementDeleteButton announcementId={a.id} />}
                      </div>

                      <div className="mt-2">
                        <Markdown className="prose-sm">{a.body}</Markdown>
                      </div>

                      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-text-muted">
                        {a.author && <span className="font-medium text-text-secondary">{a.author}</span>}
                        {a.author && <span aria-hidden>·</span>}
                        <span>{formatDateTime(a.createdAt)}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                !view.canPost && (
                  <p className="py-4 text-center text-sm text-text-secondary">
                    Aucune annonce pour l'instant.
                  </p>
                )
              )}
            </div>
          </Panel>
        </div>

        {/* ── Colonne latérale ── */}
        <aside className="space-y-6">
          {/* Encadrants */}
          {view.instructors.length > 0 && (
            <Panel
              title={
                <span className="inline-flex items-center gap-2">
                  <GraduationCap size={16} className="text-brand-violet" aria-hidden />
                  Encadrants
                </span>
              }
            >
              <ul className="space-y-3">
                {view.instructors.map((ins, i) => (
                  <li key={`${ins.name}-${i}`} className="flex items-center gap-3">
                    <Avatar name={ins.name} className="h-10 w-10 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy">{ins.name}</p>
                      <p className="truncate text-xs text-text-secondary">{ins.roleLabel}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {/* Membres */}
          <Panel
            title={
              <span className="inline-flex items-center gap-2">
                <UsersRound size={16} className="text-brand-blue-royal" aria-hidden />
                Membres
                <span className="rounded-full bg-navy/[0.06] px-2 py-0.5 text-xs font-bold text-navy/70">
                  {view.memberCount}
                </span>
              </span>
            }
          >
            {view.members.length > 0 ? (
              <ul className="space-y-2.5">
                {view.members.map((m, i) => (
                  <li key={`${m.name}-${i}`} className="flex items-center gap-3">
                    <Avatar name={m.name} src={m.avatar ?? undefined} className="h-8 w-8 shrink-0" />
                    <p className="min-w-0 truncate text-sm font-medium text-navy">{m.name}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-3 text-center text-sm text-text-secondary">Aucun membre pour l'instant.</p>
            )}
          </Panel>

          <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
            <p className="mb-3 text-xs leading-relaxed text-text-secondary">
              Quitter la cohorte vous retire de la promotion, mais vous conservez l'accès à la formation ou au
              parcours déjà déverrouillé.
            </p>
            <CohortLeaveButton cohortId={view.id} />
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ─── Carte de session (§24) — variante à venir / passée ───────────────────── */
function SessionCard({ session: s, past }: { session: CohortSessionView; past: boolean }) {
  const Icon = EVENT_TYPE_ICON[s.type] ?? CalendarClock;
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        past ? "border-navy/[0.06] bg-surface-secondary/40" : "border-navy/[0.07] bg-surface-primary",
      )}
    >
      <div className="flex items-start gap-3.5">
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
            past
              ? "bg-navy/[0.05] text-text-muted"
              : "bg-gradient-to-br from-brand-violet/15 to-brand-cyan/15 text-brand-violet",
          )}
          aria-hidden
        >
          <Icon size={19} />
        </span>

        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center rounded-full bg-navy/[0.05] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy/70">
            {EVENT_TYPE_LABEL[s.type] ?? s.type}
          </span>
          <h3 className="mt-1.5 font-display text-sm font-bold leading-snug text-navy">{s.title}</h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} className="text-brand-blue-vif" aria-hidden />
              {formatDateTime(s.startAt)}
              {s.endAt && <span className="text-text-muted"> → {formatClock(s.endAt)}</span>}
            </span>
            {s.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={12} aria-hidden />
                {s.location}
              </span>
            )}
          </div>

          {/* Actions à venir */}
          {!past && s.meetingUrl && (
            <a
              href={s.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-da px-3.5 py-2 text-xs font-semibold text-white shadow-brand transition-transform hover:scale-[1.03] active:scale-95"
            >
              <Video size={14} aria-hidden />
              Rejoindre la session
            </a>
          )}

          {/* Compte rendu + replay (passées) */}
          {past && (
            <div className="mt-3 space-y-2.5">
              {s.replayUrl && (
                <a
                  href={s.replayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-blue-royal/25 bg-brand-blue-royal/[0.04] px-3 py-1.5 text-xs font-semibold text-brand-blue-royal transition-colors hover:bg-brand-blue-royal/[0.09]"
                >
                  <PlayCircle size={14} aria-hidden />
                  Voir le replay
                </a>
              )}
              {s.summary && (
                <div className="rounded-lg border border-navy/[0.06] bg-surface-primary p-3">
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-text-muted">
                    Compte rendu
                  </p>
                  <Markdown className="prose-sm">{s.summary}</Markdown>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
