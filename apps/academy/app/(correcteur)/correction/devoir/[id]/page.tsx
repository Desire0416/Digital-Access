import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  ClipboardList,
  History,
  Link2,
  MessageSquare,
  BookOpen,
  FileText,
  Download,
  UploadCloud,
} from "lucide-react";
import { Avatar } from "@da/ui";
import { requireRole } from "@/lib/guards";
import { getAssignmentForReview } from "@/lib/correction-queries";
import { Markdown } from "@/components/Markdown";
import { Panel } from "@/components/espace/parts";
import { AssignmentReviewForm } from "./AssignmentReviewForm";

export const metadata: Metadata = { title: "Corriger un devoir" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_LABEL: Record<string, { label: string; badge: string }> = {
  SUBMITTED: { label: "En attente", badge: "bg-info/10 text-info" },
  PASSED: { label: "Validé", badge: "bg-success/10 text-success" },
  FAILED: { label: "Non validé", badge: "bg-error/10 text-error" },
  RETAKE_REQUIRED: { label: "À retravailler", badge: "bg-warning/10 text-warning" },
  GRADED: { label: "Corrigé", badge: "bg-info/10 text-info" },
  IN_PROGRESS: { label: "Brouillon", badge: "bg-navy/10 text-text-secondary" },
};

export default async function AssignmentCorrectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole(["GRADER", "INSTRUCTOR", "ACADEMIC_ADMIN", "SALES_ADMIN"], `/correction/devoir/${id}`);
  const sub = await getAssignmentForReview(id, user);
  if (!sub) notFound();

  const a = sub.assessment;

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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-brand-cyan">
            <UploadCloud size={12} aria-hidden />
            Devoir
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">{a.title}</h1>
          {a.course && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/70">
              <BookOpen size={14} aria-hidden />
              {a.course.title}
              {a.moduleTitle ? ` · ${a.moduleTitle}` : ""}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">Note minimale {a.passingScore}/100</span>
            <span className="rounded-full bg-white/10 px-3 py-1 font-semibold">
              {a.attemptsAllowed > 0 ? `${a.attemptsAllowed} dépôt${a.attemptsAllowed > 1 ? "s" : ""}` : "Dépôts illimités"}
            </span>
            {a.isRequired && <span className="rounded-full bg-warning/20 px-3 py-1 font-semibold text-warning">Obligatoire</span>}
          </div>
          <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/[0.06] p-3">
            <Avatar name={sub.learner.name} src={sub.learner.avatar ?? undefined} className="h-10 w-10" />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold">{sub.learner.name}</p>
              <p className="truncate text-xs text-white/60">{sub.learner.email}</p>
            </div>
            <span className="ml-auto shrink-0 rounded-full bg-brand-cyan/20 px-2.5 py-1 text-[11px] font-semibold text-brand-cyan">
              Dépôt {sub.attemptNumber}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── Colonne gauche ── */}
        <div className="space-y-6">
          {a.description && (
            <Panel
              title={
                <span className="inline-flex items-center gap-2">
                  <ClipboardList size={16} className="text-brand-blue-royal" aria-hidden />
                  Consignes
                </span>
              }
            >
              <Markdown className="prose-sm sm:prose-base">{a.description}</Markdown>
            </Panel>
          )}

          {/* Dépôt courant */}
          <Panel
            title={
              <span className="inline-flex items-center gap-2">
                <FileText size={16} className="text-brand-blue-royal" aria-hidden />
                Dépôt à corriger
              </span>
            }
          >
            <p className="mb-3 text-xs text-text-muted">
              Déposé le {sub.submittedAt ? dateFmt.format(sub.submittedAt) : "—"}
            </p>

            {sub.files.length > 0 && (
              <ul className="mb-4 space-y-2">
                {sub.files.map((f, i) => (
                  <li key={i}>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-lg border border-navy/[0.08] bg-surface-secondary/40 px-3.5 py-2.5 transition-colors hover:border-brand-blue-vif/40"
                    >
                      <FileText size={16} className="shrink-0 text-brand-blue-vif" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy">{f.name}</span>
                      <Download size={15} className="shrink-0 text-text-muted transition-colors group-hover:text-brand-blue-royal" aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {sub.content ? (
              <div className="whitespace-pre-wrap rounded-lg bg-surface-secondary/60 p-4 text-sm leading-relaxed text-navy/85">
                {sub.content}
              </div>
            ) : (
              sub.files.length === 0 && <p className="text-sm italic text-text-muted">Aucun contenu fourni.</p>
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
          </Panel>

          {/* Historique */}
          {sub.history.length > 0 && (
            <Panel
              title={
                <span className="inline-flex items-center gap-2">
                  <History size={16} className="text-brand-blue-royal" aria-hidden />
                  Dépôts précédents
                </span>
              }
            >
              <ol className="space-y-3">
                {sub.history.map((h) => {
                  const meta = STATUS_LABEL[h.status] ?? STATUS_LABEL.SUBMITTED;
                  return (
                    <li key={h.id} className="rounded-xl border border-navy/[0.07] p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-sm font-bold text-navy">Dépôt {h.attemptNumber}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badge}`}>{meta.label}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-text-muted">
                        {h.gradedAt
                          ? `Corrigé le ${dateFmt.format(h.gradedAt)}`
                          : h.submittedAt
                            ? `Déposé le ${dateFmt.format(h.submittedAt)}`
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

        {/* ── Colonne droite : correction ── */}
        <div>
          <div className="lg:sticky lg:top-24">
            <AssignmentReviewForm attemptId={sub.id} passingScore={a.passingScore} />
          </div>
        </div>
      </div>
    </div>
  );
}
