import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, ArrowRight, BookOpen, Route as RouteIcon, Clock } from "lucide-react";
import { Container, StaggerGroup, StaggerItem, Avatar } from "@da/ui";
import { requireRole } from "@/lib/guards";
import { getSubmissionsToReview } from "@/lib/correction-queries";
import { EmptyState } from "@/components/EmptyState";

export const metadata: Metadata = { title: "Corrections" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function CorrectionQueuePage() {
  const user = await requireRole(["GRADER", "INSTRUCTOR", "ACADEMIC_ADMIN", "SALES_ADMIN"], "/correction");
  const submissions = await getSubmissionsToReview(user);

  return (
    <Container className="py-10 sm:py-14">
      {/* En-tête */}
      <div className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-8">
        <span className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-blue-vif/25 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
        <div className="relative">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-brand-cyan" aria-hidden>
            <ClipboardCheck size={24} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold leading-tight sm:text-3xl">Corrections</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            File d&apos;attente des livrables déposés par les apprenants. Corrigez les soumissions les plus anciennes
            en priorité — chaque validation débloque la suite du parcours.
          </p>
          {submissions.length > 0 && (
            <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              {submissions.length} soumission{submissions.length > 1 ? "s" : ""} à corriger
            </p>
          )}
        </div>
      </div>

      <div className="mt-8">
        {submissions.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck size={40} className="text-brand-blue-vif/40" />}
            title="Aucune soumission à corriger pour le moment"
            description="Les livrables déposés par les apprenants des formations que vous encadrez apparaîtront ici, prêts à être évalués."
          />
        ) : (
          <StaggerGroup className="grid gap-4 sm:grid-cols-2">
            {submissions.map((s) => {
              const source = s.project.course ?? s.project.careerPath ?? null;
              const isPath = !s.project.course && !!s.project.careerPath;
              return (
                <StaggerItem key={s.id}>
                  <Link
                    href={`/correction/${s.id}`}
                    className="group flex h-full flex-col rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 transition-shadow hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={s.user.name} src={s.user.avatar ?? undefined} className="h-10 w-10" />
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-bold text-navy">{s.user.name}</p>
                        <p className="truncate text-xs text-text-secondary">{s.user.email}</p>
                      </div>
                      <span className="ml-auto shrink-0 rounded-full bg-info/10 px-2.5 py-1 text-[11px] font-semibold text-info">
                        Tentative {s.attemptNumber}
                      </span>
                    </div>

                    <h2 className="mt-4 font-display text-base font-bold leading-snug text-navy">{s.project.title}</h2>
                    {source && (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                        {isPath ? <RouteIcon size={13} aria-hidden /> : <BookOpen size={13} aria-hidden />}
                        {source.title}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-navy/[0.06] pt-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                        <Clock size={13} aria-hidden />
                        {s.submittedAt ? dateFmt.format(s.submittedAt) : "—"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal transition-colors group-hover:text-brand-violet">
                        Corriger
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
    </Container>
  );
}
