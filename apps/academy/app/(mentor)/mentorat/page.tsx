import type { Metadata } from "next";
import Link from "next/link";
import {
  HeartHandshake,
  Users,
  LifeBuoy,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Container, StaggerGroup, StaggerItem, Avatar, cn } from "@da/ui";
import { requireRole } from "@/lib/guards";
import { getMentorDashboard, type MenteeSummary } from "@/lib/mentor";
import { EmptyState } from "@/components/EmptyState";
import { ProgressBar } from "@/components/espace/ProgressBar";

export const metadata: Metadata = { title: "Mentorat" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function MentorDashboardPage() {
  const user = await requireRole(["MENTOR", "ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"], "/mentorat");
  const { menteeCount, needAttention, mentees } = await getMentorDashboard(user.id);

  return (
    <Container className="py-10 sm:py-14">
      {/* En-tête brandé */}
      <div className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-8">
        <span className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-violet/25 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute -bottom-16 left-1/4 h-44 w-44 rounded-full bg-brand-cyan/20 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
        <div className="relative">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-brand-cyan" aria-hidden>
            <HeartHandshake size={24} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold leading-tight sm:text-3xl">Mentorat</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            Accompagnez vos apprenants tout au long de leur parcours. Suivez leur progression, échangez avec
            eux et repérez ceux qui ont besoin d&apos;un coup de pouce.
          </p>

          {menteeCount > 0 && (
            <div className="mt-5 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
                <Users size={13} aria-hidden />
                {menteeCount} mentoré{menteeCount > 1 ? "s" : ""}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
                  needAttention.length > 0 ? "bg-warning/25 text-white" : "bg-white/10 text-white/80",
                )}
              >
                <LifeBuoy size={13} aria-hidden />
                {needAttention.length} à accompagner
              </span>
            </div>
          )}
        </div>
      </div>

      {menteeCount === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<HeartHandshake size={40} className="text-brand-violet/40" />}
            title="Aucun mentoré pour le moment"
            description="Aucun apprenant ne vous est encore assigné. Contactez l'administration pédagogique pour prendre en charge une promotion."
          />
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {/* À accompagner en priorité */}
          {needAttention.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-warning/10 text-[#B45309]" aria-hidden>
                  <AlertTriangle size={16} />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold text-navy">À accompagner en priorité</h2>
                  <p className="text-xs text-text-secondary">
                    Progression moyenne inférieure à 25 % sur les formations en cours.
                  </p>
                </div>
              </div>
              <StaggerGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {needAttention.map((m) => (
                  <StaggerItem key={m.learnerId}>
                    <MenteeCard mentee={m} priority />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            </section>
          )}

          {/* Tous les mentorés */}
          <section>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-blue-royal/10 text-brand-blue-royal" aria-hidden>
                <Users size={16} />
              </span>
              <h2 className="font-display text-lg font-bold text-navy">Tous mes mentorés</h2>
            </div>
            <StaggerGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {mentees.map((m) => (
                <StaggerItem key={m.learnerId}>
                  <MenteeCard mentee={m} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </section>
        </div>
      )}
    </Container>
  );
}

/* ─── Carte de mentoré ──────────────────────────────────────────────────────── */
function MenteeCard({ mentee: m, priority = false }: { mentee: MenteeSummary; priority?: boolean }) {
  return (
    <Link
      href={`/mentorat/${m.learnerId}`}
      className={cn(
        "group flex h-full flex-col rounded-2xl border bg-surface-primary p-5 transition-shadow hover:shadow-lg",
        priority ? "border-warning/30" : "border-navy/[0.07]",
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar name={m.name} src={m.avatar ?? undefined} className="h-11 w-11 shrink-0" />
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-navy">{m.name}</p>
          <p className="truncate text-xs text-text-secondary">{m.email}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-info/10 px-2.5 py-1 text-[11px] font-semibold text-info">
          <BookOpen size={12} aria-hidden />
          {m.activeCourses} en cours
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
          <GraduationCap size={12} aria-hidden />
          {m.completedCourses} terminée{m.completedCourses > 1 ? "s" : ""}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-text-secondary">Progression moyenne</span>
          <span className="font-display font-bold tabular-nums text-navy">{m.avgProgress}%</span>
        </div>
        <ProgressBar value={m.avgProgress} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-navy/[0.06] pt-3">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-text-muted">
          <Clock size={13} aria-hidden />
          <span className="truncate">
            {m.lastActiveAt ? `Actif le ${dateFmt.format(m.lastActiveAt)}` : "Jamais connecté"}
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-blue-royal transition-colors group-hover:text-brand-violet">
          Suivre
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
