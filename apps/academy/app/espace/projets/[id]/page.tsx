import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  FolderKanban,
  Target,
  ClipboardList,
  ListChecks,
  History,
  Link2,
  MessageSquare,
  CheckCircle2,
  BookOpen,
  Route as RouteIcon,
  Lock,
} from "lucide-react";
import { requireUser } from "@/lib/guards";
import { getProjectForLearner } from "@/lib/learn-queries";
import { Markdown } from "@/components/Markdown";
import { Panel } from "@/components/espace/parts";
import { SubmissionForm } from "./SubmissionForm";
import { SUBMISSION_META } from "@/components/submission-meta";

export const metadata: Metadata = { title: "Projet" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function asLinks(value: unknown): string[] {
  return Array.isArray(value) ? (value.filter((v) => typeof v === "string") as string[]) : [];
}
function asFiles(value: unknown): { name: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is { name: string; url: string } => !!v && typeof v === "object" && "url" in v);
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/espace/projets/${id}`);
  const project = await getProjectForLearner(id, user.id);
  if (!project) notFound();

  const source = project.course ?? project.careerPath ?? null;
  const isPath = !project.course && !!project.careerPath;

  return (
    <div className="space-y-6">
      <Link
        href="/espace/projets"
        className="inline-flex items-center gap-1 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
      >
        <ChevronLeft size={16} aria-hidden />
        Mes projets
      </Link>

      {/* En-tête */}
      <div className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-7">
        <span className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-blue-vif/25 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.12]" aria-hidden />
        <div className="relative">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-brand-cyan" aria-hidden>
            <FolderKanban size={24} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold leading-tight sm:text-3xl">{project.title}</h1>
          {source && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/70">
              {isPath ? <RouteIcon size={14} aria-hidden /> : <BookOpen size={14} aria-hidden />}
              {source.title}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">Note minimale {project.minScore}/100</span>
            <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">
              {project.maxAttempts > 0 ? `${project.maxAttempts} tentative${project.maxAttempts > 1 ? "s" : ""}` : "Tentatives illimitées"}
            </span>
            {project.isRequired && <span className="rounded-full bg-warning/20 px-3 py-1 font-semibold text-warning">Obligatoire</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ── Consignes ── */}
        <div className="space-y-6">
          <Panel title={<span className="inline-flex items-center gap-2"><ClipboardList size={16} className="text-brand-blue-royal" aria-hidden />Contexte &amp; consignes</span>}>
            <Markdown className="prose-sm sm:prose-base">{project.context}</Markdown>
          </Panel>

          {project.objectives.length > 0 && (
            <Panel title={<span className="inline-flex items-center gap-2"><Target size={16} className="text-brand-blue-royal" aria-hidden />Objectifs</span>}>
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
            <Panel title={<span className="inline-flex items-center gap-2"><ListChecks size={16} className="text-brand-blue-royal" aria-hidden />Livrables attendus</span>}>
              <ul className="space-y-2">
                {project.deliverables.map((d, i) => (
                  <li key={i} className="flex items-start gap-2.5 rounded-lg border border-navy/[0.06] bg-surface-secondary/40 p-3 text-sm text-navy/85">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-da text-[11px] font-bold text-white" aria-hidden>
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
        </div>

        {/* ── Ma soumission + historique ── */}
        <div className="space-y-6">
          <Panel title={<span className="inline-flex items-center gap-2"><History size={16} className="text-brand-blue-royal" aria-hidden />Ma soumission</span>}>
            {project.canSubmit ? (
              <SubmissionForm projectId={project.id} nextAttempt={project.attemptsUsed + 1} />
            ) : project.approved ? (
              <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-center">
                <CheckCircle2 size={30} className="mx-auto text-success" aria-hidden />
                <p className="mt-2 font-display text-sm font-bold text-navy">Projet validé</p>
                <p className="mt-0.5 text-xs text-text-secondary">Félicitations, ce projet est réussi.</p>
              </div>
            ) : project.awaitingReview ? (
              <div className="rounded-xl border border-info/30 bg-info/5 p-4 text-center">
                <p className="font-display text-sm font-bold text-navy">Correction en cours</p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  Votre dernière soumission est en cours de correction. Patientez avant d&apos;en déposer une nouvelle.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-navy/10 bg-surface-secondary/50 p-4 text-center">
                <Lock size={24} className="mx-auto text-text-muted" aria-hidden />
                <p className="mt-2 text-sm font-semibold text-navy">Dépôt indisponible</p>
                <p className="mt-0.5 text-xs text-text-secondary">Vous avez épuisé vos tentatives pour ce projet.</p>
              </div>
            )}
          </Panel>

          {/* Historique versionné */}
          {project.submissions.length > 0 && (
            <Panel title="Historique">
              <ol className="space-y-3">
                {project.submissions.map((s) => {
                  const meta = SUBMISSION_META[s.status] ?? SUBMISSION_META.DRAFT;
                  const Icon = meta.icon;
                  const links = asLinks(s.links);
                  const files = asFiles(s.files);
                  return (
                    <li key={s.id} className="rounded-xl border border-navy/[0.07] p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-bold text-navy">Tentative {s.attemptNumber}</span>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badge}`}>
                          <Icon size={12} aria-hidden />
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-text-muted">
                        {s.submittedAt ? dateFmt.format(s.submittedAt) : dateFmt.format(s.createdAt)}
                      </p>
                      {s.content && <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-navy/80">{s.content}</p>}

                      {links.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {links.map((l, i) => (
                            <a
                              key={i}
                              href={l}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 truncate text-xs font-medium text-brand-blue-royal hover:text-brand-violet"
                            >
                              <Link2 size={12} className="shrink-0" aria-hidden />
                              <span className="truncate">{l}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {files.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {files.map((f, i) => (
                            <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-md border border-navy/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={f.url} alt={f.name} className="h-12 w-12 object-cover" />
                            </a>
                          ))}
                        </div>
                      )}

                      {s.score !== null && (
                        <p className="mt-2 text-xs font-bold text-navy">Note : {s.score}/100</p>
                      )}
                      {s.feedback && (
                        <div className="mt-2 flex items-start gap-2 rounded-lg bg-surface-secondary/60 p-2.5">
                          <MessageSquare size={13} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
                          <p className="text-xs leading-relaxed text-navy/80">{s.feedback}</p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
