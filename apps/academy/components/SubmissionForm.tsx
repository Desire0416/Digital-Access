"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Link2, ImagePlus, Send, Save, CheckCircle2, RotateCcw, X } from "lucide-react";
import { Button, Textarea, cn } from "@da/ui";
import { ImageUpload } from "./ImageUpload";
import { SubmissionBadge } from "./project-ui";
import { saveSubmissionDraft, submitProject } from "@/lib/project-actions";
import type { MySubmission } from "@/lib/project-types";

type LinkRow = { label: string; url: string };

export function SubmissionForm({
  projectId,
  submission,
  enrolled,
}: {
  projectId: string;
  submission: MySubmission | null;
  enrolled: boolean;
}) {
  const router = useRouter();
  const [links, setLinks] = React.useState<LinkRow[]>(
    submission?.links.length ? submission.links : [{ label: "", url: "" }],
  );
  const [images, setImages] = React.useState<string[]>(submission?.files.map((f) => f.url) ?? []);
  const [comment, setComment] = React.useState(submission?.comment ?? "");
  const [aiDeclaration, setAiDeclaration] = React.useState(submission?.aiDeclaration ?? "");
  const [error, setError] = React.useState<string | null>(null);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const status = submission?.status ?? "NOT_STARTED";
  const locked = status === "VALIDATED" || status === "REJECTED";
  const underReview = status === "SUBMITTED" || status === "UNDER_REVIEW";
  const editable = enrolled && !locked && !underReview;

  function payload() {
    return {
      links: links.filter((l) => l.url.trim()).map((l) => ({ label: l.label.trim() || "Lien", url: l.url.trim() })),
      files: images.map((url) => ({ url, name: "Capture" })),
      comment,
      aiDeclaration,
    };
  }

  function run(kind: "save" | "submit") {
    setError(null);
    setOkMsg(null);
    startTransition(async () => {
      const saved = await saveSubmissionDraft(projectId, payload());
      if (!saved.ok) {
        setError(saved.error);
        return;
      }
      if (kind === "save") {
        setOkMsg("Brouillon enregistré.");
        router.refresh();
        return;
      }
      const res = await submitProject(projectId);
      if (!res.ok) {
        setError(res.error);
        router.refresh();
        return;
      }
      setOkMsg("Projet soumis pour évaluation !");
      router.refresh();
    });
  }

  // ── Retour du relecteur (feedback + score) ──
  const feedbackBlock = submission?.feedback && (status === "VALIDATED" || status === "REJECTED" || status === "REVISION_REQUESTED") ? (
    <div
      className={cn(
        "rounded-xl border p-4",
        status === "VALIDATED" ? "border-success/25 bg-success/[0.05]" : status === "REJECTED" ? "border-error/25 bg-error/[0.05]" : "border-warning/30 bg-warning/[0.06]",
      )}
    >
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-sm font-bold text-navy">Retour du relecteur {submission.reviewerName ? `· ${submission.reviewerName}` : ""}</p>
        {submission.score != null && <span className="text-sm font-bold text-navy">{submission.score}%</span>}
      </div>
      <p className="whitespace-pre-wrap text-sm text-text-secondary">{submission.feedback}</p>
    </div>
  ) : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-navy">Votre travail</h2>
        <SubmissionBadge status={status} />
      </div>

      {feedbackBlock}

      {locked ? (
        <div className="rounded-xl border border-navy/10 bg-surface-secondary/50 p-5 text-sm text-text-secondary">
          {status === "VALIDATED" ? (
            <p className="flex items-center gap-2 text-success"><CheckCircle2 size={18} /> Projet validé — il a enrichi votre portfolio et vous a décerné le badge associé.</p>
          ) : (
            <p>Ce projet n'a pas été retenu. Contactez votre mentor pour repartir sur de bonnes bases.</p>
          )}
          <SubmittedRecap submission={submission!} />
        </div>
      ) : underReview ? (
        <div className="rounded-xl border border-accent/25 bg-accent/[0.05] p-5">
          <p className="flex items-center gap-2 text-sm font-semibold text-accent">
            <RotateCcw size={16} /> Votre soumission est en cours d'évaluation.
          </p>
          <p className="mt-1 text-sm text-text-secondary">Vous recevrez une notification dès qu'un relecteur l'aura examinée.</p>
          <SubmittedRecap submission={submission!} />
        </div>
      ) : !enrolled ? (
        <div className="rounded-xl border border-navy/10 bg-surface-secondary/50 p-5 text-sm text-text-secondary">
          Inscrivez-vous au parcours pour déposer ce projet.
        </div>
      ) : (
        <>
          {/* Liens livrables */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy"><Link2 size={15} /> Livrables (liens)</label>
            <p className="mb-2 text-xs text-text-muted">Partagez vos réalisations : Google Drive, Figma, Canva, GitHub, site en ligne…</p>
            <div className="flex flex-col gap-2">
              {links.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={l.label}
                    onChange={(e) => setLinks((p) => p.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                    placeholder="Intitulé"
                    className="h-11 w-32 shrink-0 rounded-lg border border-navy/12 bg-surface-primary px-3 text-sm text-navy placeholder:text-text-muted focus:border-brand-blue-vif focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/20"
                  />
                  <input
                    value={l.url}
                    onChange={(e) => setLinks((p) => p.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                    placeholder="https://…"
                    className="h-11 flex-1 rounded-lg border border-navy/12 bg-surface-primary px-3 text-sm text-navy placeholder:text-text-muted focus:border-brand-blue-vif focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/20"
                  />
                  {links.length > 1 && (
                    <button type="button" onClick={() => setLinks((p) => p.filter((_, j) => j !== i))} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-text-muted hover:bg-error/[0.06] hover:text-error" aria-label="Retirer">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setLinks((p) => [...p, { label: "", url: "" }])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-royal hover:text-brand-violet">
              <Plus size={15} /> Ajouter un lien
            </button>
          </div>

          {/* Captures */}
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-navy"><ImagePlus size={15} /> Captures d'écran (optionnel)</label>
            <div className="flex flex-wrap gap-3">
              {images.map((url) => (
                <div key={url} className="relative h-24 w-32 overflow-hidden rounded-lg border border-navy/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Capture" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setImages((p) => p.filter((u) => u !== url))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-navy/70 text-white hover:bg-error" aria-label="Retirer">
                    <X size={13} />
                  </button>
                </div>
              ))}
              {images.length < 6 && (
                <div className="w-32">
                  <ImageUpload
                    value={null}
                    onChange={(url) => url && setImages((p) => (p.includes(url) ? p : [...p, url]))}
                    folder="submissions"
                    aspect="4/3"
                    hint="Ajouter"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Commentaire */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-navy">Note pour le relecteur (optionnel)</label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Expliquez vos choix, ce dont vous êtes fier, vos difficultés…" />
          </div>

          {/* Déclaration IA */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-navy">
              Déclaration d'utilisation de l'IA <span className="text-error">*</span>
            </label>
            <p className="mb-1.5 text-xs text-text-muted">Par honnêteté : décrivez comment (ou non) vous avez utilisé des outils d'IA. Requis pour soumettre.</p>
            <Textarea value={aiDeclaration} onChange={(e) => setAiDeclaration(e.target.value)} rows={2} placeholder="Ex. : J'ai utilisé une IA pour relire mon code, mais la conception et le contenu sont les miens." />
          </div>

          {error && <p className="text-sm font-medium text-error">{error}</p>}
          <AnimatePresence>
            {okMsg && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium text-success">
                {okMsg}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => run("save")} loading={pending}>
              <Save size={16} /> Enregistrer le brouillon
            </Button>
            <Button onClick={() => run("submit")} loading={pending}>
              <Send size={16} /> Soumettre pour évaluation
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function SubmittedRecap({ submission }: { submission: MySubmission }) {
  if (!submission.links.length && !submission.files.length) return null;
  return (
    <div className="mt-4 border-t border-navy/[0.06] pt-3">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">Vos livrables</p>
      <ul className="flex flex-col gap-1">
        {submission.links.map((l, i) => (
          <li key={i}>
            <a href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue-royal hover:text-brand-violet">
              <Link2 size={13} /> {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
