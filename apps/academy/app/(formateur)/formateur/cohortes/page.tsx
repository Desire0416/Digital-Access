import type { Metadata } from "next";
import Link from "next/link";
import { Users, Calendar, BookOpen, GraduationCap, Megaphone, CalendarDays } from "lucide-react";
import { StaggerGroup, StaggerItem } from "@da/ui";
import { requireRole } from "@/lib/guards";
import { getInstructorCohorts } from "@/lib/instructor-cohort-queries";
import { EspaceHeader } from "@/components/espace/parts";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill, type PillTone } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Mes cohortes — Studio formateur" };

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

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default async function FormateurCohortesPage() {
  const user = await requireRole(["INSTRUCTOR", "ACADEMIC_ADMIN", "SALES_ADMIN"], "/formateur/cohortes");
  const cohorts = await getInstructorCohorts(user);

  return (
    <div>
      <EspaceHeader
        title="Mes cohortes"
        subtitle="Suivez les cohortes dont vous êtes encadrant : participants, progression, événements et annonces."
      />

      {cohorts.length === 0 ? (
        <EmptyState
          icon={<Users size={40} className="text-brand-blue-royal/40" />}
          title="Aucune cohorte assignée"
          description="Vous serez notifié lorsqu'un administrateur vous assignera comme encadrant d'une cohorte."
        />
      ) : (
        <>
          <p className="mb-4 text-xs text-text-muted">
            {cohorts.length} cohorte{cohorts.length > 1 ? "s" : ""}
          </p>
          <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cohorts.map((c) => (
              <StaggerItem key={c.id}>
                <Link
                  href={`/formateur/cohortes/${c.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary transition-shadow hover:shadow-lg"
                >
                  {/* Cover */}
                  <div className="relative aspect-[16/7] overflow-hidden">
                    {c.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.coverImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div
                        className="relative h-full w-full"
                        style={{ background: "linear-gradient(125deg,#5b3fa8,#2b5cc6 45%,#1e8fe1 72%,#00bcd4)" }}
                        aria-hidden
                      >
                        <span className="absolute inset-0 bg-grid opacity-30" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3">
                      <StatusPill
                        label={COHORT_STATUS_LABEL[c.status] ?? c.status}
                        tone={COHORT_STATUS_TONE[c.status] ?? "neutral"}
                      />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-base font-bold leading-snug text-navy group-hover:text-brand-blue-royal">
                      {c.name}
                    </h3>

                    {/* Formation / Parcours cible */}
                    {(c.course || c.careerPath) && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-secondary">
                        {c.course ? (
                          <>
                            <BookOpen size={13} className="shrink-0 text-brand-blue-royal" aria-hidden />
                            <span className="truncate">{c.course.title}</span>
                          </>
                        ) : (
                          <>
                            <GraduationCap size={13} className="shrink-0 text-brand-violet" aria-hidden />
                            <span className="truncate">{c.careerPath!.title}</span>
                          </>
                        )}
                      </p>
                    )}

                    {/* Dates */}
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                      <Calendar size={12} aria-hidden />
                      {dateFmt.format(c.startDate)}
                      {c.endDate && ` — ${dateFmt.format(c.endDate)}`}
                    </p>

                    {/* Compteurs */}
                    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-xs text-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <Users size={13} aria-hidden />
                        {c._count.members} participant{c._count.members > 1 ? "s" : ""}
                      </span>
                      {c._count.events > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={13} aria-hidden />
                          {c._count.events}
                        </span>
                      )}
                      {c._count.announcements > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Megaphone size={13} aria-hidden />
                          {c._count.announcements}
                        </span>
                      )}
                      {c.capacity && (
                        <span className="text-text-muted">
                          {c._count.members}/{c.capacity} places
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </>
      )}
    </div>
  );
}
