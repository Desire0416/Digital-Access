import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  ClipboardList,
  Target,
  ListChecks,
  History,
  Link2,
  MessageSquare,
  CheckCircle2,
  BookOpen,
  Route as RouteIcon,
  FileText,
} from "lucide-react";
import { Avatar } from "@da/ui";
import { requireRole } from "@/lib/guards";
import { getSubmissionForReview } from "@/lib/correction-queries";
import { Markdown } from "@/components/Markdown";
import { Panel } from "@/components/espace/parts";
import { SUBMISSION_META } from "@/components/submission-meta";
import { ReviewForm } from "./ReviewForm";

export const metadata: Metadata = { title: "Corriger une soumission" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function CorrectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["GRADER", "INSTRUCTOR", "ACADEMIC_ADMIN", "SALES_ADMIN"], `/correction/${id}`);
  const sub = await getSubmissionForReview(id, user);
  if (!sub) notFound();

  const project = sub.project;
  const source = project.course ?? project.careerPath ?? null;
  const isPath = !project.course && !!project.careerPath;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <Link
        href="/correction"
        className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
      >
        <ChevronLeft size={16} aria-hidden />
        File de correction
      </Link>

      {/* En-tête */}
      <div className="relative mt-4 overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-7">
        <span className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-blue-vif/25 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
        <div className="relative">
          <h1 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{project.title}</h1>
          {source && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/70">
              {isPath ? <RouteIcon size={14} aria-hidden /> : <BookOpen size={14} aria-hidden />}
              {source.title}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">Note minimale {project.minScore}/100</span>
            <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">
              {project.maxAttempts > 0
                ? `${project.maxAttempts} tentative${project.maxAttempts > 1 ? "s" : ""}`
                : "Tentatives illimitées"}
            </span>
            {project.isRequired && (
              <span className="rounded-full bg-warning/20 px-3 py-1 font-semibold text-warning">Obligatoire</span>
            )}
          </div>
          {/* Apprenant */}
          <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/[0.06] p-3">
            <Avatar name={sub.learner.name} src={sub.learner.avatar ?? undefined} className="h-10 w-10" />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold">{sub.learner.name}</p>
              <p className="truncate text-xs text-white/60">{sub.learner.email}</p>
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-brand-cyan/20 px-2.5 py-1 text-[11px] font-semibold text-brand-cyan">
              Tentative {sub.attemptNumber}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── Colonne gauche : consignes + soumission + historique ── */}
        <div className="space-y-6">
          <Panel
            title={
              <span className="inline-flex items-center gap-2">
                <ClipboardList size={16} className="text-brand-blue-royal" aria-hidden />
                Contexte &amp; consignes
              </span>
            }
          >
            <Markdown className="prose-sm sm:prose-base">{project.context}</Markdown>
          </Panel>

          {project.objectives.length > 0 && (
            <Panel
              title={
                <span className="inline-flex items-center gap-2">
                  <Target size={16} className="text-brand-blue-royal" aria-hidden />
                  Objectifs
                </span>
              }
            >
              <ul className="space-y-2">
                {project.objectives.map((o, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-navy/85">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand-blue-vif" aria-hidden />
                    {o}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {project.deliverables.length > 0 && (
            <Panel
              title={
                <span className="inline-flex items-center gap-2">
                  <ListChecks size={16} className="text-brand-blue-royal" aria-hidden />
                  Livrables attendus
                </span>
              }
            >
              <ul className="space-y-2">
                {project.deliverables.map((d, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg border border-navy/[0.06] bg-surface-secondary/40 p-3 text-sm text-navy/85"
                  >
                    <span
                      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-da text-[11px] font-bold text-white"
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    {d}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {project.rubric && (
            <Panel title="Grille d'évaluation">
              <Markdown className="prose-sm">{project.rubric}</Markdown>
            </Panel>
          )}

          {/* Soumission courante */}
          <Panel
            title={
              <span className="inline-flex items-center gap-2">
                <FileText size={16} className="text-brand-blue-royal" aria-hidden />
                Soumission à corriger
              </span>
            }
          >
            <p className="mb-3 text-xs text-text-muted">
              Déposée le {sub.submittedAt ? dateFmt.format(sub.submittedAt) : "—"}
            </p>

            {sub.content ? (
              <div className="whitespace-pre-wrap rounded-lg bg-surface-secondary/60 p-4 text-sm leading-relaxed text-navy/85">
                {sub.content}
              </div>
            ) : (
              <p className="text-sm italic text-text-muted">Aucune description fournie.</p>
            )}

            {sub.links.length > 0 && (
              <div className="mt-4">
                <p className="mb-1.5 text-xs font-semibold text-navy">Liens</p>
                <div className="space-y-1.5">
                  {sub.links.map((l, i) => (
                    <a
                      key={i}
                      href={l}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 truncate text-sm font-medium text-brand-blue-royal hover:text-brand-violet"
                    >
                      <Link2 size={14} className="shrink-0" aria-hidden />
                      <span className="truncate">{l}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {sub.files.length > 0 && (
              <div className="mt-4">
                <p className="mb-1.5 text-xs font-semibold text-navy">Captures</p>
                <div className="flex flex-wrap gap-2">
                  {sub.files.map((f, i) => (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="overflow-hidden rounded-lg border border-navy/10"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt={f.name} className="h-24 w-24 object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          {/* Historique des tentatives précédentes */}
          {sub.history.length > 0 && (
            <Panel
              title={
                <span className="inline-flex items-center gap-2">
                  <History size={16} className="text-brand-blue-royal" aria-hidden />
                  Tentatives précédentes
                </span>
              }
            >
              <ol className="space-y-3">
                {sub.history.map((h) => {
                  const meta = SUBMISSION_META[h.status] ?? SUBMISSION_META.DRAFT;
                  const Icon = meta.icon;
                  return (
                    <li key={h.id} className="rounded-xl border border-navy/[0.07] p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-bold text-navy">Tentative {h.attemptNumber}</span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badge}`}
                        >
                          <Icon size={12} aria-hidden />
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-text-muted">
                        {h.reviewedAt
                          ? `Corrigée le ${dateFmt.format(h.reviewedAt)}`
                          : h.submittedAt
                            ? `Déposée le ${dateFmt.format(h.submittedAt)}`
                            : ""}
                      </p>
                      {h.score !== null && <p className="mt-2 text-xs font-bold text-navy">Note : {h.score}/100</p>}
                      {h.feedback && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg bg-surface-secondary/60 p-2.5">
                          <MessageSquare size={13} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                          <p className="text-xs leading-relaxed text-navy/80">{h.feedback}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </Panel>
          )}
        </div>

        {/* ── Colonne droite : formulaire de correction ── */}
        <div>
          <div className="lg:sticky lg:top-24">
            <ReviewForm submissionId={sub.id} minScore={project.minScore} />
          </div>
        </div>
      </div>
    </div>
  );
}
