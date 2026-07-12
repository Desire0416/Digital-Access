import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Users,
  Star,
  CheckCircle2,
  ClipboardCheck,
  ArrowRight,
  Layers,
  ChevronRight,
} from "lucide-react";
import { StaggerGroup, StaggerItem } from "@da/ui";
import { requireRole } from "@/lib/guards";
import { getInstructorDashboard } from "@/lib/instructor-queries";
import { LEVEL_LABEL } from "@/lib/site";
import { EspaceHeader } from "@/components/espace/parts";
import { StatusPill, CONTENT_STATUS_LABEL, CONTENT_STATUS_TONE } from "@/components/admin/ui";
import { EmptyState } from "@/components/EmptyState";
import { CreateCourseButton } from "./formations/CreateCourseButton";

export const metadata: Metadata = { title: "Studio formateur" };

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

export default async function FormateurDashboardPage() {
  const user = await requireRole(["INSTRUCTOR", "ACADEMIC_ADMIN", "SALES_ADMIN"], "/formateur");
  const { courses, stats, pendingReviews } = await getInstructorDashboard(user);

  return (
    <div>
      <EspaceHeader
        title="Studio formateur"
        subtitle="Pilotez vos formations, suivez vos apprenants et corrigez leurs livrables — le tout depuis un seul endroit."
      />

      {/* Statistiques */}
      <StaggerGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatTile icon={<BookOpen size={17} />} value={stats.courseCount} label="Formations encadrées" accent="violet" />
        </StaggerItem>
        <StaggerItem>
          <StatTile icon={<CheckCircle2 size={17} />} value={stats.publishedCount} label="Publiées" accent="cyan" />
        </StaggerItem>
        <StaggerItem>
          <StatTile icon={<Users size={17} />} value={stats.learnerCount} label="Apprenants" accent="blue" />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            icon={<Star size={17} />}
            value={stats.avgRating != null ? stats.avgRating.toFixed(1) : "—"}
            label="Note moyenne"
            accent="amber"
          />
        </StaggerItem>
      </StaggerGroup>

      {/* Corrections en attente */}
      {pendingReviews > 0 && (
        <Link
          href="/correction"
          className="group mt-6 flex items-center gap-4 overflow-hidden rounded-2xl border border-warning/30 bg-warning/[0.05] p-5 transition-colors hover:bg-warning/[0.08]"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-warning/15 text-[#b45309]" aria-hidden>
            <ClipboardCheck size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-bold text-navy">
              {pendingReviews} livrable{pendingReviews > 1 ? "s" : ""} à corriger
            </p>
            <p className="mt-0.5 text-sm text-text-secondary">
              Des apprenants attendent votre évaluation. Chaque validation débloque la suite de leur parcours.
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[#b45309]">
            Corriger
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </Link>
      )}

      {/* Mes formations */}
      <div className="mt-8 mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-navy">Mes formations</h2>
        <div className="flex items-center gap-2">
          <Link
            href="/formateur/formations"
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
          >
            Tout voir
            <ChevronRight size={15} aria-hidden />
          </Link>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="space-y-5">
          <EmptyState
            icon={<BookOpen size={40} className="text-brand-blue-royal/40" />}
            title="Vous n'encadrez aucune formation"
            description="Créez votre première formation : vous en composerez le programme, puis la soumettrez à validation avant publication."
          />
          <div className="flex justify-center">
            <CreateCourseButton />
          </div>
        </div>
      ) : (
        <>
          <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <StaggerItem key={c.id}>
                <Link
                  href={`/formateur/formations/${c.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary transition-shadow hover:shadow-lg"
                >
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
                      <StatusPill label={CONTENT_STATUS_LABEL[c.status]} tone={CONTENT_STATUS_TONE[c.status]} />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-base font-bold leading-snug text-navy group-hover:text-brand-blue-royal">
                      {c.title}
                    </h3>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        <Layers size={13} aria-hidden />
                        {LEVEL_LABEL[c.level] ?? c.level}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={13} aria-hidden />
                        {c.learnerCount}
                      </span>
                      {c.avgRating != null && (
                        <span className="inline-flex items-center gap-1">
                          <Star size={13} className="text-warning" aria-hidden />
                          {c.avgRating.toFixed(1)}
                          <span className="text-text-muted">({c.reviewCount})</span>
                        </span>
                      )}
                    </div>
                    <p className="mt-auto pt-4 text-xs text-text-muted">
                      {c.moduleCount} module{c.moduleCount > 1 ? "s" : ""} · {c.lessonCount} leçon
                      {c.lessonCount > 1 ? "s" : ""}
                    </p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <div className="mt-6">
            <CreateCourseButton />
          </div>
        </>
      )}
    </div>
  );
}
