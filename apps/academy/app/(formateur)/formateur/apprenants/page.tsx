import type { Metadata } from "next";
import { Users, BookOpen, Clock } from "lucide-react";
import { StaggerGroup, StaggerItem, Avatar } from "@da/ui";
import { requireRole } from "@/lib/guards";
import { getInstructorLearners } from "@/lib/instructor-queries";
import { EspaceHeader, EnrollmentBadge } from "@/components/espace/parts";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "Apprenants — Studio formateur" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default async function FormateurLearnersPage() {
  const user = await requireRole(["INSTRUCTOR", "ACADEMIC_ADMIN", "SALES_ADMIN"], "/formateur/apprenants");
  const learners = await getInstructorLearners(user);

  return (
    <div>
      <EspaceHeader
        title="Mes apprenants"
        subtitle="Une ligne par apprenant et par formation. Suivez leur progression et leur dernière activité."
      />

      {learners.length === 0 ? (
        <EmptyState
          icon={<Users size={40} className="text-brand-blue-royal/40" />}
          title="Aucun apprenant pour le moment"
          description="Dès qu'un apprenant s'inscrit à l'une de vos formations, il apparaîtra ici avec sa progression."
        />
      ) : (
        <>
          <p className="mb-4 text-xs text-text-muted">
            {learners.length} inscription{learners.length > 1 ? "s" : ""}
          </p>
          <StaggerGroup className="space-y-3">
            {learners.map((l) => (
              <StaggerItem key={`${l.userId}-${l.courseId}`}>
                <article className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* Identité */}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={l.name} src={l.avatar ?? undefined} className="h-11 w-11 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-bold text-navy">{l.name}</p>
                        <p className="truncate text-xs text-text-secondary">{l.email}</p>
                      </div>
                    </div>

                    {/* Formation */}
                    <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm text-text-secondary">
                      <BookOpen size={14} className="shrink-0 text-brand-blue-royal" aria-hidden />
                      <span className="truncate">{l.courseTitle}</span>
                    </div>

                    {/* Statut + progression */}
                    <div className="flex shrink-0 flex-col gap-2 sm:w-52">
                      <div className="flex items-center justify-between gap-3">
                        <EnrollmentBadge status={l.enrollmentStatus} />
                        <span className="text-xs font-bold tabular-nums text-navy">{l.progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-navy/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-da"
                          style={{ width: `${l.progress}%` }}
                          aria-hidden
                        />
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
                        <Clock size={11} aria-hidden />
                        {l.lastActiveAt ? `Actif le ${dateFmt.format(l.lastActiveAt)}` : "Jamais actif"}
                      </span>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </>
      )}
    </div>
  );
}
