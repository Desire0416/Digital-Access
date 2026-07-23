"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Link2,
  Plus,
  X,
  RotateCcw,
  Award,
  Eye,
  Download,
} from "lucide-react";
import { Button, Field, Input, Textarea, cn } from "@da/ui";
import { FileUpload } from "@/components/FileUpload";
import { Markdown } from "@/components/Markdown";
import { submitAssignment } from "@/lib/learn-actions";
import type { LearnerAssignment } from "@/lib/learn-queries";

/* ══════════════════════════════════════════════════════════════════════════
   Dépôt de DEVOIR (AssessmentType.ASSIGNMENT) dans le lecteur — l'apprenant
   dépose un ou plusieurs fichiers (+ texte / liens) ; un formateur corrige
   (note + retour) depuis l'espace de correction. À la manière d'un « devoir »
   Moodle, avec historique des dépôts et statut de correction.
   ══════════════════════════════════════════════════════════════════════════ */

type Attempt = LearnerAssignment["attempts"][number];
type FileEntry = { name: string; url: string };

const STATUS_META: Record<string, { label: string; tone: string; Icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  SUBMITTED: { label: "En attente de correction", tone: "info", Icon: Clock },
  IN_PROGRESS: { label: "Brouillon", tone: "muted", Icon: Clock },
  GRADED: { label: "Corrigé", tone: "info", Icon: CheckCircle2 },
  PASSED: { label: "Validé", tone: "success", Icon: Award },
  FAILED: { label: "Non validé", tone: "error", Icon: X },
  RETAKE_REQUIRED: { label: "À retravailler", tone: "warning", Icon: RotateCcw },
};

const TONE_CLASS: Record<string, string> = {
  success: "border-success/30 bg-success/5 text-success",
  error: "border-error/30 bg-error/5 text-error",
  warning: "border-warning/30 bg-warning/5 text-warning",
  info: "border-brand-blue-vif/30 bg-brand-blue-vif/5 text-brand-blue-royal",
  muted: "border-navy/15 bg-surface-secondary text-text-secondary",
};

export function AssignmentSubmission({ assignment }: { assignment: LearnerAssignment }) {
  const router = useRouter();
  const { attempts, attemptsAllowed, passingScore } = assignment;
  const latest = attempts[0] ?? null;
  const preview = !!assignment.preview;

  const hasPassed = attempts.some((a) => a.status === "PASSED");
  const hasPending = attempts.some((a) => a.status === "SUBMITTED");
  const limitReached = attemptsAllowed > 0 && attempts.length >= attemptsAllowed;
  const canSubmit = !hasPassed && !hasPending && !limitReached;

  const [files, setFiles] = React.useState<FileEntry[]>([]);
  const [content, setContent] = React.useState("");
  const [links, setLinks] = React.useState<string[]>([""]);
  const [uploadKey, setUploadKey] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(attempts.length === 0);

  function addFile(url: string | null) {
    if (!url) return;
    setFiles((prev) => [...prev, { name: fileNameFromUrl(url), url }]);
    setUploadKey((k) => k + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanLinks = links.map((l) => l.trim()).filter(Boolean);
    if (files.length === 0 && cleanLinks.length === 0) {
      setError("Joignez au moins un fichier ou un lien à votre dépôt.");
      return;
    }
    setPending(true);
    const res = await submitAssignment(assignment.id, {
      content: content.trim(),
      links: cleanLinks,
      files,
    });
    setPending(false);
    if (res.ok) {
      setFiles([]);
      setContent("");
      setLinks([""]);
      setShowForm(false);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="space-y-6">
      {preview && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-violet/25 bg-brand-violet/[0.06] px-4 py-3 text-sm font-medium text-brand-blue-royal">
          <Eye size={16} aria-hidden />
          Aperçu administrateur — vous consultez les consignes ; le dépôt est désactivé.
        </div>
      )}
      {/* Consignes */}
      <div className="overflow-hidden rounded-2xl border border-brand-blue-vif/20 bg-gradient-to-br from-brand-blue-vif/[0.05] to-brand-cyan/[0.05] p-6">
        <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
          <UploadCloud size={24} aria-hidden />
        </span>
        <h2 className="font-display text-lg font-bold text-navy">Devoir à rendre</h2>
        {assignment.description ? (
          <div className="mt-3 max-w-none text-sm leading-relaxed text-navy/80">
            <Markdown>{assignment.description}</Markdown>
          </div>
        ) : (
          <p className="mt-2 text-sm text-text-secondary">
            Déposez votre travail ci-dessous. Un formateur le corrigera et vous laissera un retour.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium text-text-secondary">
          <span>Note de passage : <strong className="text-navy">{passingScore} %</strong></span>
          <span>Dépôts autorisés : <strong className="text-navy">{attemptsAllowed === 0 ? "illimités" : attemptsAllowed}</strong></span>
          <span>Déjà déposés : <strong className="text-navy">{attempts.length}</strong></span>
        </div>
      </div>

      {/* Statut du dernier dépôt */}
      {latest && <AttemptStatusCard attempt={latest} />}

      {/* Historique des dépôts précédents */}
      {attempts.length > 1 && (
        <details className="rounded-xl border border-navy/[0.08] bg-surface-secondary/40 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-navy">
            Historique des dépôts ({attempts.length})
          </summary>
          <ul className="mt-3 space-y-3">
            {attempts.slice(1).map((a) => (
              <li key={a.id} className="rounded-lg border border-navy/[0.06] bg-white p-3">
                <AttemptSummary attempt={a} />
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Formulaire de dépôt (désactivé en aperçu administrateur) */}
      {preview ? null : canSubmit ? (
        showForm ? (
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-navy/[0.08] bg-surface-primary p-5">
            <h3 className="font-display text-base font-bold text-navy">
              {attempts.length > 0 ? `Nouveau dépôt (tentative ${attempts.length + 1})` : "Déposer mon travail"}
            </h3>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
                  role="alert"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fichiers */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy">Fichiers du devoir</label>
              {files.length > 0 && (
                <ul className="mb-3 space-y-2">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center gap-2.5 rounded-lg border border-navy/[0.08] bg-surface-secondary/40 px-3 py-2">
                      <FileText size={16} className="shrink-0 text-brand-blue-vif" aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-navy">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                        aria-label="Retirer le fichier"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <FileUpload
                key={uploadKey}
                value={null}
                onChange={addFile}
                folder="submissions"
                hint="PDF, Word, Excel, image, zip… — 100 Mo max. Chaque envoi s'ajoute à la liste."
              />
            </div>

            {/* Texte de présentation */}
            <Field label="Note pour le formateur (facultatif)" htmlFor="assign-content">
              <Textarea
                id="assign-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Expliquez votre démarche, vos choix, les difficultés rencontrées…"
              />
            </Field>

            {/* Liens */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-navy">
                Liens <span className="font-normal text-text-muted">(dépôt en ligne, vidéo, GitHub… — facultatif)</span>
              </label>
              <div className="space-y-2">
                {links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Link2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
                      <Input
                        type="url"
                        value={link}
                        onChange={(e) => setLinks((prev) => prev.map((l, idx) => (idx === i ? e.target.value : l)))}
                        placeholder="https://…"
                        className="pl-9"
                      />
                    </div>
                    {links.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLinks((prev) => prev.filter((_, idx) => idx !== i))}
                        aria-label="Retirer ce lien"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-navy/10 text-text-muted transition-colors hover:border-error/40 hover:text-error"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setLinks((prev) => [...prev, ""])}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-royal hover:text-brand-violet"
              >
                <Plus size={14} aria-hidden />
                Ajouter un lien
              </button>
            </div>

            <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">
              <Send size={16} aria-hidden />
              Déposer mon devoir
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-blue-vif/40 py-4 text-sm font-semibold text-brand-blue-royal transition-colors hover:border-brand-blue-vif hover:bg-brand-blue-vif/[0.04]"
          >
            <RotateCcw size={16} aria-hidden />
            Déposer une nouvelle version
          </button>
        )
      ) : hasPassed ? null : hasPending ? (
        <p className="rounded-xl border border-brand-blue-vif/20 bg-brand-blue-vif/[0.04] px-4 py-3 text-center text-sm text-brand-blue-royal">
          Votre dépôt est en cours de correction. Vous pourrez en redéposer un nouveau si des ajustements sont demandés.
        </p>
      ) : (
        <p className="rounded-xl border border-navy/10 bg-surface-secondary px-4 py-3 text-center text-sm text-text-secondary">
          Vous avez atteint le nombre maximal de dépôts pour ce devoir.
        </p>
      )}
    </div>
  );
}

/* ─── Carte de statut du dépôt courant ─────────────────────────────────────── */

function AttemptStatusCard({ attempt }: { attempt: Attempt }) {
  const meta = STATUS_META[attempt.status] ?? STATUS_META.SUBMITTED;
  const { Icon } = meta;
  return (
    <div className={cn("rounded-2xl border p-5", TONE_CLASS[meta.tone])}>
      <div className="flex flex-wrap items-center gap-2">
        <Icon size={18} aria-hidden />
        <span className="font-display text-sm font-bold">{meta.label}</span>
        {attempt.score != null && (
          <span className="ml-auto rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-bold">
            Note : {attempt.score}%
          </span>
        )}
      </div>
      {attempt.feedback && (
        <div className="mt-3 rounded-lg bg-white/60 p-3 text-sm text-navy/85">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-navy/50">Retour du formateur</p>
          {attempt.feedback}
        </div>
      )}
      <div className="mt-3">
        <DepositFiles attempt={attempt} />
      </div>
    </div>
  );
}

function AttemptSummary({ attempt }: { attempt: Attempt }) {
  const meta = STATUS_META[attempt.status] ?? STATUS_META.SUBMITTED;
  return (
    <div>
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-navy">Tentative {attempt.attemptNumber}</span>
        <span className="text-text-muted">·</span>
        <span className="text-text-secondary">{meta.label}</span>
        {attempt.score != null && <span className="ml-auto text-xs font-bold text-navy">{attempt.score}%</span>}
      </div>
      {attempt.feedback && <p className="mt-1.5 text-sm text-text-secondary">{attempt.feedback}</p>}
      <DepositFiles attempt={attempt} compact />
    </div>
  );
}

function DepositFiles({ attempt, compact = false }: { attempt: Attempt; compact?: boolean }) {
  if (attempt.files.length === 0 && attempt.links.length === 0 && !attempt.content) return null;
  return (
    <div className={cn("space-y-1.5", compact && "mt-2")}>
      {attempt.files.map((f, i) => (
        <a
          key={i}
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 text-sm font-medium text-brand-blue-royal hover:underline"
        >
          <Download size={14} className="shrink-0" aria-hidden />
          <span className="truncate">{f.name}</span>
        </a>
      ))}
      {attempt.links.map((l, i) => (
        <a
          key={i}
          href={l}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-brand-blue-royal hover:underline"
        >
          <Link2 size={14} className="shrink-0" aria-hidden />
          <span className="truncate">{l}</span>
        </a>
      ))}
    </div>
  );
}

function fileNameFromUrl(url: string): string {
  try {
    const raw = decodeURIComponent(new URL(url).pathname.split("/").pop() || url);
    return raw.replace(/-[a-z0-9]{20,}(?=\.[a-z0-9]+$)/i, "");
  } catch {
    return "fichier";
  }
}
