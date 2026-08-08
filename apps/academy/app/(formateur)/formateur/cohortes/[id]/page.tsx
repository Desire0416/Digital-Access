import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Users,
  Calendar,
  BookOpen,
  GraduationCap,
  TrendingUp,
  CheckCircle2,
  Clock,
  Megaphone,
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ClipboardCheck,
  FileText,
  FolderKanban,
} from "lucide-react";
import { StaggerGroup, StaggerItem, Avatar } from "@da/ui";
import { requireRole } from "@/lib/guards";
import { getInstructorCohortDetail } from "@/lib/instructor-cohort-queries";
import { EspaceHeader } from "@/components/espace/parts";
import { StatusPill, type PillTone } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Cohorte — Studio formateur" };

const COHORT_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  OPEN: "Inscriptions ouvertes",
  RUNNING: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

const COHORT_STATUS_TONE: Record<string, PillTone> = {
  DRAFT: "neutral",
  OPEN: "info",
  RUNNING: "success",
  COMPLETED: "violet",
  CANCELLED: "danger",
};

const MEMBER_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  ACTIVE: "Actif",
  COMPLETED: "Terminé",
  SUSPENDED: "Suspendu",
  WITHDRAWN: "Retiré",
};

const MEMBER_STATUS_TONE: Record<string, PillTone> = {
  PENDING: "warning",
  ACTIVE: "success",
  COMPLETED: "violet",
  SUSPENDED: "danger",
  WITHDRAWN: "neutral",
};

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const STAT_ACCENTS = {
  violet: "from-brand-violet to-brand-blue-royal",
  blue: "from-brand-blue-royal to-brand-blue-vif",
  cyan: "from-brand-blue-vif to-brand-cyan",
  amber: "from-warning to-[#fbbf24]",
} as const;

function StatTile({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  accent: keyof typeof STAT_ACCENTS;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
      <span
        className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r opacity-90 ${STAT_ACCENTS[accent]}`}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-text-secondary">{label}</p>
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm ${STAT_ACCENTS[accent]}`}
          aria-hidden
        >
          {icon}
        </span>
      </div>
      <p className="mt-2 font-display text-[1.9rem] font-bold leading-none tracking-tight text-navy">{value}</p>
    </div>
  );
}

export default async function FormateurCohortDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["INSTRUCTOR", "ACADEMIC_ADMIN", "SALES_ADMIN"], "/formateur/cohortes");
  const cohort = await getInstructorCohortDetail(id, user);
  if (!cohort) notFound();

  const target = cohort.course ?? cohort.careerPath;
  const targetType = cohort.course ? "formation" : "parcours";

  // Les participants ayant des dépôts à corriger remontent en tête (action à mener).
  const members = [...cohort.membersWithProgress].sort((a, b) => b.pendingReviews - a.pendingReviews);

  return (
    <div>
      {/* Breadcrumb */}
      <Link
        href="/formateur/cohortes"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft size={15} aria-hidden />
        Mes cohortes
      </Link>

      <EspaceHeader
        title={cohort.name}
        subtitle={
          target
            ? `${targetType === "formation" ? "Formation" : "Parcours"} : ${target.title}`
            : undefined
        }
      />

      {/* Status + dates */}
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
        <StatusPill
          label={COHORT_STATUS_LABEL[cohort.status] ?? cohort.status}
          tone={COHORT_STATUS_TONE[cohort.status] ?? "neutral"}
        />
        <span className="inline-flex items-center gap-1.5">
          <Calendar size={14} aria-hidden />
          {dateFmt.format(cohort.startDate)}
          {cohort.endDate && ` — ${dateFmt.format(cohort.endDate)}`}
        </span>
        {cohort.rhythm && <span className="text-text-muted">· {cohort.rhythm}</span>}
        {cohort.capacity && (
          <span className="text-text-muted">
            · {cohort.stats.totalMembers}/{cohort.capacity} places
          </span>
        )}
      </div>

      {/* Statistiques */}
      <StaggerGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatTile icon={<Users size={17} />} value={cohort.stats.totalMembers} label="Participants" accent="violet" />
        </StaggerItem>
        <StaggerItem>
          <StatTile icon={<CheckCircle2 size={17} />} value={cohort.stats.activeCount} label="Actifs" accent="cyan" />
        </StaggerItem>
        <StaggerItem>
          <StatTile icon={<GraduationCap size={17} />} value={cohort.stats.completedCount} label="Terminés" accent="blue" />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            icon={<TrendingUp size={17} />}
            value={`${cohort.stats.avgProgress}%`}
            label="Progression moyenne"
            accent="amber"
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Livrables à corriger — action concrète : lien direct vers chaque fiche */}
      {cohort.pendingReviews.length > 0 && (
        <section className="mt-6">
          <div className="overflow-hidden rounded-2xl border border-warning/30 bg-warning/[0.04]">
            <div className="flex items-center gap-3 border-b border-warning/20 px-5 py-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning/15 text-[#b45309]" aria-hidden>
                <ClipboardCheck size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold text-navy">
                  {cohort.pendingReviews.length} livrable{cohort.pendingReviews.length > 1 ? "s" : ""} à corriger
                </h2>
                <p className="text-xs text-text-secondary">
                  Déposés par les participants de cette cohorte. Chaque validation débloque la suite de leur parcours.
                </p>
              </div>
            </div>
            <ul className="divide-y divide-navy/[0.06]">
              {cohort.pendingReviews.map((r) => (
                <li key={`${r.kind}-${r.id}`}>
                  <Link
                    href={r.href}
                    className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-primary"
                  >
                    <Avatar name={r.learnerName} src={r.learnerAvatar ?? undefined} className="h-9 w-9 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy">{r.learnerName}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-text-secondary">
                        {r.kind === "assignment" ? (
                          <FileText size={12} className="shrink-0 text-brand-blue-royal" aria-hidden />
                        ) : (
                          <FolderKanban size={12} className="shrink-0 text-brand-violet" aria-hidden />
                        )}
                        <span className="truncate">{r.title}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusPill
                        label={r.kind === "assignment" ? "Devoir" : "Projet"}
                        tone={r.kind === "assignment" ? "info" : "violet"}
                      />
                      {r.submittedAt && (
                        <span className="hidden text-[11px] text-text-muted sm:inline">{dateFmt.format(r.submittedAt)}</span>
                      )}
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#b45309]">
                        Corriger
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Tout corrigé — état positif quand la cohorte cible une formation avec des membres */}
      {cohort.pendingReviews.length === 0 && cohort.courseId && cohort.stats.totalMembers > 0 && (
        <section className="mt-6">
          <div className="flex items-center gap-3 rounded-2xl border border-success/25 bg-success/[0.05] px-5 py-4">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success/15 text-success" aria-hidden>
              <CheckCircle2 size={20} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-navy">Tout est corrigé</p>
              <p className="text-xs text-text-secondary">
                Aucun livrable en attente. Les nouveaux dépôts des participants apparaîtront ici.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Encadrants */}
      {cohort.instructors.length > 1 && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-base font-bold text-navy">Équipe d'encadrement</h2>
          <div className="flex flex-wrap gap-3">
            {cohort.instructors.map((inst) => (
              <div
                key={inst.id}
                className="inline-flex items-center gap-2.5 rounded-full border border-navy/[0.07] bg-surface-primary px-4 py-2"
              >
                <Avatar name={inst.user.name} src={inst.user.avatar ?? undefined} className="h-7 w-7" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">{inst.user.name}</p>
                  <p className="truncate text-[11px] text-text-muted">{inst.roleLabel}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Participants + progression */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-navy">
            Participants ({cohort.stats.totalMembers})
          </h2>
          <div className="flex items-center gap-4">
            <Link
              href="/correction"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
            >
              <ClipboardCheck size={12} aria-hidden />
              File de correction
            </Link>
            {target && targetType === "formation" && (
              <Link
                href={`/formations/${(cohort.course!).slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
              >
                Voir la formation
                <ExternalLink size={12} aria-hidden />
              </Link>
            )}
          </div>
        </div>

        {members.length === 0 ? (
          <p className="rounded-xl bg-surface-secondary/60 py-8 text-center text-sm text-text-muted">
            Aucun participant inscrit pour le moment.
          </p>
        ) : (
          <StaggerGroup className="space-y-3">
            {members.map((m) => (
              <StaggerItem key={m.id}>
                <article className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* Identité */}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={m.user.name} src={m.user.avatar ?? undefined} className="h-11 w-11 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-bold text-navy">{m.user.name}</p>
                        <p className="truncate text-xs text-text-secondary">{m.user.email}</p>
                      </div>
                    </div>

                    {/* Statut membre + dépôts à corriger */}
                    <div className="flex shrink-0 items-center gap-2">
                      {m.pendingReviews > 0 && (
                        <Link
                          href="/correction"
                          className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-bold text-[#b45309] transition-colors hover:bg-warning/25"
                        >
                          <ClipboardCheck size={12} aria-hidden />
                          {m.pendingReviews} à corriger
                        </Link>
                      )}
                      <StatusPill
                        label={MEMBER_STATUS_LABEL[m.status] ?? m.status}
                        tone={MEMBER_STATUS_TONE[m.status] ?? "neutral"}
                      />
                    </div>

                    {/* Progression + activité */}
                    <div className="flex shrink-0 flex-col gap-2 sm:w-52">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-text-secondary">Progression</span>
                        <span className="text-xs font-bold tabular-nums text-navy">{m.progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-navy/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-da"
                          style={{ width: `${m.progress}%` }}
                          aria-hidden
                        />
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
                        <Clock size={11} aria-hidden />
                        {m.user.lastActiveAt
                          ? `Actif le ${dateFmt.format(m.user.lastActiveAt)}`
                          : "Jamais actif"}
                      </span>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </section>

      {/* Événements à venir */}
      {cohort.events.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-display text-base font-bold text-navy">
            <CalendarDays size={16} className="mr-1.5 inline-block align-[-2px] text-brand-blue-vif" aria-hidden />
            Événements ({cohort.events.length})
          </h2>
          <div className="space-y-3">
            {cohort.events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-4 rounded-xl border border-navy/[0.07] bg-surface-primary p-4"
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-blue-vif/10 text-brand-blue-vif">
                  <CalendarDays size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-navy">{ev.title}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {timeFmt.format(ev.startAt)}
                    {ev.endAt && ` — ${timeFmt.format(ev.endAt)}`}
                  </p>
                  {ev.location && <p className="mt-0.5 truncate text-xs text-text-muted">{ev.location}</p>}
                </div>
                <StatusPill
                  label={ev.status === "CANCELLED" ? "Annulé" : ev.type === "WEBINAR" ? "Webinaire" : "Classe virtuelle"}
                  tone={ev.status === "CANCELLED" ? "danger" : "info"}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Annonces */}
      {cohort.announcements.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-display text-base font-bold text-navy">
            <Megaphone size={16} className="mr-1.5 inline-block align-[-2px] text-brand-violet" aria-hidden />
            Annonces ({cohort.announcements.length})
          </h2>
          <div className="space-y-3">
            {cohort.announcements.map((ann) => (
              <div
                key={ann.id}
                className={`rounded-xl border p-4 ${
                  ann.pinned
                    ? "border-brand-violet/20 bg-brand-violet/[0.03]"
                    : "border-navy/[0.07] bg-surface-primary"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold text-navy">
                      {ann.pinned && (
                        <span className="mr-1.5 inline-block rounded bg-brand-violet/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand-violet">
                          Épinglé
                        </span>
                      )}
                      {ann.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-secondary">{ann.body}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-text-muted">{dateFmt.format(ann.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Description / Règles */}
      {(cohort.description || cohort.rules) && (
        <section className="mt-8 space-y-4">
          {cohort.description && (
            <div className="rounded-xl border border-navy/[0.07] bg-surface-primary p-5">
              <h3 className="mb-2 font-display text-sm font-bold text-navy">Description</h3>
              <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-line">{cohort.description}</p>
            </div>
          )}
          {cohort.rules && (
            <div className="rounded-xl border border-navy/[0.07] bg-surface-primary p-5">
              <h3 className="mb-2 font-display text-sm font-bold text-navy">Règles de la cohorte</h3>
              <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-line">{cohort.rules}</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
