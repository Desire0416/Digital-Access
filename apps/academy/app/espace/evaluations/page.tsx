import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardCheck, CheckCircle2, XCircle, RotateCcw, PlayCircle, ArrowRight, HelpCircle } from "lucide-react";
import { cn } from "@da/ui";
import { requireUser } from "@/lib/guards";
import { getMyAssessments, type MyAssessmentState } from "@/lib/learn-queries";
import { EmptyState } from "@/components/EmptyState";
import { EspaceHeader, Panel } from "@/components/espace/parts";

export const metadata: Metadata = { title: "Mes évaluations" };

const ASSESSMENT_TYPE_LABEL: Record<string, string> = { QUIZ: "Quiz", ASSIGNMENT: "Devoir", EXAM: "Examen" };

const STATE_META: Record<
  MyAssessmentState,
  { label: string; badge: string; icon: typeof CheckCircle2; cta: string; ctaIcon: typeof PlayCircle }
> = {
  reussie: { label: "Réussie", badge: "bg-success/10 text-success", icon: CheckCircle2, cta: "Revoir", ctaIcon: RotateCcw },
  "a-faire": { label: "À faire", badge: "bg-info/10 text-info", icon: HelpCircle, cta: "Commencer", ctaIcon: PlayCircle },
  "a-reprendre": {
    label: "À reprendre",
    badge: "bg-warning/10 text-[#B45309]",
    icon: RotateCcw,
    cta: "Réessayer",
    ctaIcon: RotateCcw,
  },
  echouee: { label: "Échouée", badge: "bg-error/10 text-error", icon: XCircle, cta: "Consulter", ctaIcon: ArrowRight },
};

const ORDER: MyAssessmentState[] = ["a-faire", "a-reprendre", "echouee", "reussie"];

export default async function MyAssessmentsPage() {
  const user = await requireUser("/espace/evaluations");
  const assessments = await getMyAssessments(user.id);

  const counts = assessments.reduce<Record<string, number>>((acc, a) => {
    acc[a.state] = (acc[a.state] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <EspaceHeader
        title="Mes évaluations"
        subtitle="Quiz, devoirs et examens de vos formations, regroupés par statut."
      />

      {assessments.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck size={40} className="text-brand-blue-royal/40" />}
          title="Aucune évaluation disponible"
          description="Inscrivez-vous à une formation pour accéder à ses quiz et examens."
          action={{ label: "Parcourir les formations", href: "/formations" }}
        />
      ) : (
        <div className="space-y-6">
          {/* Résumé */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ORDER.map((state) => {
              const meta = STATE_META[state];
              const Icon = meta.icon;
              return (
                <div key={state} className="flex items-center gap-3 rounded-2xl border border-navy/[0.07] bg-surface-primary p-4">
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", meta.badge)} aria-hidden>
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="font-display text-xl font-bold leading-none text-navy">{counts[state] ?? 0}</p>
                    <p className="mt-1 text-xs text-text-secondary">{meta.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Groupes par statut */}
          {ORDER.map((state) => {
            const list = assessments.filter((a) => a.state === state);
            if (list.length === 0) return null;
            const meta = STATE_META[state];
            return (
              <Panel key={state} title={`${meta.label} · ${list.length}`}>
                <ul className="divide-y divide-navy/[0.06]">
                  {list.map((a) => {
                    const CtaIcon = meta.ctaIcon;
                    return (
                      <li key={a.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-brand-blue-vif/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-blue-royal">
                              {ASSESSMENT_TYPE_LABEL[a.type] ?? a.type}
                            </span>
                            {a.isRequired && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-warning">Requise</span>
                            )}
                          </div>
                          <p className="mt-1 truncate font-display text-sm font-bold text-navy">{a.title}</p>
                          <p className="truncate text-xs text-text-secondary">{a.course.title}</p>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-text-secondary">
                          <span className="hidden sm:inline">
                            {a.questionsCount} question{a.questionsCount > 1 ? "s" : ""}
                          </span>
                          <span>
                            Seuil <span className="font-semibold text-navy">{a.passingScore}%</span>
                          </span>
                          {a.bestScore !== null && (
                            <span className={cn("font-bold tabular-nums", a.state === "reussie" ? "text-success" : "text-navy")}>
                              {a.bestScore}%
                            </span>
                          )}
                          <span className="hidden text-text-muted md:inline">
                            {a.attemptsUsed}
                            {a.attemptsAllowed > 0 ? `/${a.attemptsAllowed}` : ""} tentative
                            {a.attemptsUsed > 1 ? "s" : ""}
                          </span>
                        </div>

                        <Link
                          href={`/apprendre/${a.course.slug}`}
                          className={cn(
                            "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                            state === "reussie"
                              ? "border border-navy/10 text-navy hover:bg-navy/[0.04]"
                              : "bg-gradient-da text-white shadow-brand",
                          )}
                        >
                          <CtaIcon size={13} aria-hidden />
                          {meta.cta}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
