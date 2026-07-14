"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck, X, Loader2, CheckCircle2, Link2 } from "lucide-react";
import { cn } from "@da/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { submitEquivalenceRequest } from "@/lib/equivalence-actions";
import {
  EVIDENCE_TYPES,
  EVIDENCE_TYPE_LABEL,
  EVIDENCE_TYPE_HINT,
} from "@/lib/equivalence-labels";
import type { EquivalenceEvidenceType } from "@da/academy-db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Dépôt d'une demande d'équivalence (cahier §22.3). Bouton discret sur la
   fiche formation → modale : type de preuve, description, lien externe et/ou
   capture. INVARIANT : le dépôt ne donne jamais accès (une demande PENDING est
   créée côté serveur ; seule la validation admin ouvre l'accès).
   ══════════════════════════════════════════════════════════════════════════ */

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-navy/60 backdrop-blur-sm"
      />
      <div className="fixed inset-0 z-[61] grid place-items-center overflow-y-auto p-4" onClick={onClose}>
        {children}
      </div>
    </>,
    document.body,
  );
}

export function EquivalenceRequestForm({
  courseSlug,
  courseTitle,
}: {
  courseSlug: string;
  courseTitle: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState("");

  const [evidenceType, setEvidenceType] = React.useState<EquivalenceEvidenceType>("CERTIFICATE");
  const [description, setDescription] = React.useState("");
  const [proofLink, setProofLink] = React.useState("");
  const [proofUrl, setProofUrl] = React.useState<string | null>(null);

  function reset() {
    setDone(false);
    setError("");
    setEvidenceType("CERTIFICATE");
    setDescription("");
    setProofLink("");
    setProofUrl(null);
  }

  function close() {
    if (pending) return;
    setOpen(false);
    // Laisse l'animation de sortie se jouer avant de réinitialiser.
    setTimeout(reset, 250);
  }

  function submit() {
    setError("");
    startTransition(async () => {
      const res = await submitEquivalenceRequest({
        courseSlug,
        evidenceType,
        description,
        proofLink: proofLink.trim() || "",
        proofUrl: proofUrl ?? "",
      });
      if (res.ok) setDone(true);
      else setError(res.error);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-brand-blue-royal/25 bg-brand-blue-royal/[0.04] px-4 py-2.5 text-center text-sm font-semibold text-brand-blue-royal transition-colors hover:bg-brand-blue-royal/[0.09]"
      >
        <BadgeCheck size={16} className="shrink-0" />
        Faire reconnaître une équivalence
      </button>

      <AnimatePresence>
        {open && (
          <Modal onClose={close}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Demande d'équivalence"
              className="my-8 w-full max-w-lg overflow-hidden rounded-2xl bg-surface-primary text-left shadow-2xl"
            >
              {/* En-tête dégradé signature */}
              <div className="relative bg-gradient-da px-6 py-5 text-white">
                <button
                  type="button"
                  onClick={close}
                  aria-label="Fermer"
                  className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
                    <BadgeCheck size={19} />
                  </span>
                  <div className="min-w-0 pr-8">
                    <p className="font-display text-lg font-bold leading-tight">Faire reconnaître une équivalence</p>
                    <p className="truncate text-sm text-white/85">{courseTitle}</p>
                  </div>
                </div>
              </div>

              {done ? (
                <div className="px-6 py-10 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/10 text-success">
                    <CheckCircle2 size={30} />
                  </span>
                  <p className="mt-4 font-display text-lg font-bold text-navy">Demande envoyée !</p>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm text-text-secondary">
                    Notre équipe examine votre preuve et vous notifiera de sa décision. Suivez son avancement dans
                    « Mes équivalences ».
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-5 rounded-xl bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
                  >
                    J'ai compris
                  </button>
                </div>
              ) : (
                <div className="max-h-[calc(100vh-14rem)] space-y-5 overflow-y-auto px-6 py-5">
                  {/* Type de preuve */}
                  <div>
                    <p className="mb-2 text-sm font-semibold text-navy">Type de preuve</p>
                    <div className="flex flex-wrap gap-2">
                      {EVIDENCE_TYPES.map((t) => {
                        const active = evidenceType === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setEvidenceType(t)}
                            aria-pressed={active}
                            className={cn(
                              "rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                              active
                                ? "border-transparent bg-gradient-da text-white shadow-brand"
                                : "border-navy/12 bg-surface-primary text-navy/70 hover:border-navy/25 hover:text-navy",
                            )}
                          >
                            {EVIDENCE_TYPE_LABEL[t]}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-text-muted">{EVIDENCE_TYPE_HINT[evidenceType]}</p>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="equiv-desc" className="mb-1.5 block text-sm font-semibold text-navy">
                      Décrivez votre preuve
                    </label>
                    <textarea
                      id="equiv-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      maxLength={2000}
                      placeholder="Ex. J'ai obtenu le certificat X en 2024, ou 3 ans d'expérience comme analyste de données sur…"
                      className="w-full resize-none rounded-xl border border-navy/12 bg-surface-primary px-3.5 py-2.5 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-royal/50"
                    />
                    <p className="mt-1 text-right text-xs text-text-muted">{description.trim().length}/2000</p>
                  </div>

                  {/* Lien externe */}
                  <div>
                    <label htmlFor="equiv-link" className="mb-1.5 block text-sm font-semibold text-navy">
                      Lien vers la preuve <span className="font-normal text-text-muted">(optionnel)</span>
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-navy/12 bg-surface-primary px-3 focus-within:border-brand-blue-royal/50">
                      <Link2 size={16} className="shrink-0 text-text-muted" />
                      <input
                        id="equiv-link"
                        type="url"
                        inputMode="url"
                        value={proofLink}
                        onChange={(e) => setProofLink(e.target.value)}
                        placeholder="https://…"
                        className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-navy outline-none placeholder:text-text-muted"
                      />
                    </div>
                  </div>

                  {/* Capture / document */}
                  <div>
                    <p className="mb-1.5 text-sm font-semibold text-navy">
                      Capture ou document <span className="font-normal text-text-muted">(optionnel)</span>
                    </p>
                    <ImageUpload
                      value={proofUrl}
                      onChange={setProofUrl}
                      folder="equivalences"
                      hint="Capture d'un certificat, diplôme ou justificatif — PNG, JPG ou WebP, 5 Mo max"
                    />
                  </div>

                  <p className="rounded-xl bg-surface-secondary px-3.5 py-2.5 text-xs text-text-secondary">
                    Joignez au moins une preuve (lien ou capture). Le dépôt n'ouvre pas l'accès : notre équipe valide
                    chaque demande manuellement.
                  </p>

                  {error && <p className="text-sm font-medium text-error">{error}</p>}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={close}
                      disabled={pending}
                      className="rounded-xl px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-navy/[0.05]"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={pending}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] disabled:opacity-60"
                    >
                      {pending && <Loader2 size={15} className="animate-spin" />}
                      Envoyer la demande
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
