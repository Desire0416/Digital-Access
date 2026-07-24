import type { Metadata } from "next";
import Link from "next/link";
import {
  UsersRound,
  ArrowRight,
  BookOpen,
  Route as RouteIcon,
  CalendarDays,
  CalendarClock,
} from "lucide-react";
import { StaggerGroup, StaggerItem, cn } from "@da/ui";
import type { CohortType, CohortStatus } from "@da/academy-db/client";
import { requireUser } from "@/lib/guards";
import { getMyCohorts, type MyCohort } from "@/lib/cohorts";
import { EmptyState } from "@/components/EmptyState";
import { EspaceHeader } from "@/components/espace/parts";
import { ProgressBar } from "@/components/espace/ProgressBar";

export const metadata: Metadata = { title: "Mes cohortes" };

/* ── Libellés FR (§23) ── */
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
  DRAFT: "bg-navy/[0.06] text-text-muted",
  OPEN: "bg-success/10 text-success",
  RUNNING: "bg-info/10 text-info",
  COMPLETED: "bg-navy/[0.06] text-navy/70",
  CANCELLED: "bg-error/10 text-error",
};

const dfDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const dfDateTime = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
function formatDate(d: Date) {
  return dfDate.format(d);
}
function formatDateTime(d: Date) {
  return dfDateTime.format(d);
}

function periodLabel(c: MyCohort): string {
  if (c.endDate) return `Du ${formatDate(c.startDate)} au ${formatDate(c.endDate)}`;
  return `Débute le ${formatDate(c.startDate)}`;
}

export default async function MyCohortsPage() {
  const user = await requireUser("/espace/cohortes");
  const cohorts = await getMyCohorts(user.id);

  return (
    <div>
      <EspaceHeader
        title="Mes cohortes"
        subtitle="Les promotions que vous suivez : sessions en direct, encadrants et annonces réunis au même endroit."
      />

      {cohorts.length === 0 ? (
        <EmptyState
          icon={<UsersRound size={40} className="text-brand-blue-vif/40" />}
          title="Vous ne faites partie d'aucune cohorte"
          description="Rejoignez une cohorte pour apprendre en promotion : rythme partagé, sessions en direct et accompagnement des formateurs."
          action={{ label: "Découvrir les formations", href: "/formations" }}
        />
      ) : (
        <StaggerGroup className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {cohorts.map((c) => {
            const isPath = c.target?.kind === "careerPath";
            return (
              <StaggerItem key={c.id}>
                <Link
                  href={`/espace/cohortes/${c.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary transition-all hover:-translate-y-1 hover:border-brand-blue-vif/40 hover:shadow-xl"
                >
                  <span className="h-1 w-full bg-gradient-da" aria-hidden />

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-violet/15 to-brand-cyan/15 text-brand-violet"
                        aria-hidden
                      >
                        <UsersRound size={20} />
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          STATUS_BADGE[c.status],
                        )}
                      >
                        {COHORT_STATUS_LABEL[c.status]}
                      </span>
                    </div>

                    <span className="mt-3.5 inline-flex w-fit items-center rounded-full bg-brand-violet/[0.08] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-violet">
                      {COHORT_TYPE_LABEL[c.type]}
                    </span>
                    <h2 className="mt-1.5 font-display text-base font-bold leading-snug text-navy group-hover:text-brand-blue-royal">
                      {c.name}
                    </h2>

                    {c.target && (
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-text-secondary">
                        {isPath ? <RouteIcon size={12} aria-hidden /> : <BookOpen size={12} aria-hidden />}
                        <span className="min-w-0 truncate">{c.target.title}</span>
                      </p>
                    )}

                    <p className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-text-secondary">
                      <CalendarDays size={12} aria-hidden />
                      {periodLabel(c)}
                    </p>

                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="text-text-secondary">Progression</span>
                        <span className="font-bold tabular-nums text-navy">{Math.round(c.progress)}%</span>
                      </div>
                      <ProgressBar value={c.progress} height="h-1.5" />
                    </div>

                    {c.nextSession ? (
                      <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-brand-blue-vif/[0.05] px-3 py-2 text-xs leading-relaxed text-navy">
                        <CalendarClock size={13} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                        <span className="min-w-0">
                          <span className="font-semibold">Prochaine session : </span>
                          {c.nextSession.title}
                          <span className="block text-text-secondary">
                            {formatDateTime(c.nextSession.startAt)}
                          </span>
                        </span>
                      </p>
                    ) : (
                      <p className="mt-4 text-xs text-text-muted">Aucune session à venir programmée.</p>
                    )}

                    <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-brand-blue-royal">
                      Ouvrir l'espace cohorte
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </div>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      )}
    </div>
  );
}
