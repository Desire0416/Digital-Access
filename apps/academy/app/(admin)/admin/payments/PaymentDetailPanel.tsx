"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CircleUserRound,
  ExternalLink,
  Fingerprint,
  Hash,
  ImageOff,
  Loader2,
  Mail,
  Receipt,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User2,
  X,
} from "lucide-react";
import Link from "next/link";
import { Avatar, Button, Textarea, cn, formatFCFA, formatDate } from "@da/ui";
import {
  StatusPill,
  PAYMENT_STATUS,
  PAYMENT_TYPE,
  PAYMENT_PROVIDER,
  type Tone,
} from "@/components/admin/ui";
import { approvePayment, rejectPayment } from "@/lib/payment-actions";
import { fetchPaymentDetail } from "./actions";
import type { AdminPaymentDetail } from "@/lib/payment-queries";

/* ══════════════════════════════════════════════════════════════════════════
   Panneau de détail d'un paiement (slide-over en portail, AnimatePresence).
   Charge le détail complet à l'ouverture (preuve incluse), affiche l'apprenant,
   l'article payé, la référence, l'horodatage et la preuve Mobile Money, et
   expose les actions d'approbation / de rejet (avec motif) pour les PENDING.
   Invariant : seule l'approbation admin crée l'inscription et ouvre l'accès.
   ══════════════════════════════════════════════════════════════════════════ */

const OPERATOR_COLORS: Record<string, string> = {
  ORANGE: "#FF7900",
  MTN: "#D4A900",
  WAVE: "#00A5D0",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  COURSE: <Sparkles size={15} />,
  SUBSCRIPTION: <BadgeCheck size={15} />,
  INVOICE: <Receipt size={15} />,
};

type Feedback = { tone: "ok" | "error"; message: string } | null;

export type PanelMode = "idle" | "confirm-approve" | "reject";

export function PaymentDetailPanel({
  paymentId,
  initialMode = "idle",
  onClose,
  onDone,
}: {
  paymentId: string;
  /** Ouvre directement le panneau sur une action (raccourci depuis la carte). */
  initialMode?: PanelMode;
  onClose: () => void;
  /** Appelé après une action réussie (approbation / rejet) pour rafraîchir. */
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const [detail, setDetail] = React.useState<AdminPaymentDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [mode, setMode] = React.useState<PanelMode>(initialMode);
  const [reason, setReason] = React.useState("");
  const [feedback, setFeedback] = React.useState<Feedback>(null);
  const [pending, startTransition] = React.useTransition();
  const [showProof, setShowProof] = React.useState(false);

  // Chargement du détail à l'ouverture.
  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    fetchPaymentDetail(paymentId).then((res) => {
      if (!active) return;
      if (res.ok) setDetail(res.detail);
      else setLoadError(res.error);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [paymentId]);

  // Échap ferme le panneau ; verrouille le scroll de l'arrière-plan.
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && mode === "idle") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, mode]);

  const isPending = detail?.status === "PENDING";

  function handleApprove() {
    setFeedback(null);
    startTransition(async () => {
      const res = await approvePayment(paymentId);
      if (!res.ok) {
        setFeedback({ tone: "error", message: res.error });
        setMode("idle");
      } else {
        setFeedback({
          tone: "ok",
          message: "Paiement approuvé — accès ouvert et apprenant notifié.",
        });
        setMode("idle");
        setDetail((d) => (d ? { ...d, status: "COMPLETED" } : d));
        onDone();
      }
    });
  }

  function handleReject() {
    setFeedback(null);
    startTransition(async () => {
      const res = await rejectPayment({
        paymentId,
        reason: reason.trim() || undefined,
      });
      if (!res.ok) {
        setFeedback({ tone: "error", message: res.error });
      } else {
        setFeedback({
          tone: "ok",
          message: "Paiement rejeté — l'apprenant a été notifié du motif.",
        });
        setMode("idle");
        setDetail((d) =>
          d ? { ...d, status: "FAILED", rejectReason: reason.trim() || null } : d,
        );
        onDone();
      }
    });
  }

  const statusMeta = detail
    ? PAYMENT_STATUS[detail.status] ?? { label: detail.status, tone: "slate" as Tone }
    : null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="scrim"
        className="fixed inset-0 z-[210] bg-navy/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={() => mode === "idle" && onClose()}
      />
      <motion.aside
        key="panel"
        role="dialog"
        aria-modal="true"
        aria-label="Détail du paiement"
        initial={reduce ? { opacity: 0 } : { x: "100%" }}
        animate={reduce ? { opacity: 1 } : { x: 0 }}
        exit={reduce ? { opacity: 0 } : { x: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
        onMouseDown={(e) => e.stopPropagation()}
        className="fixed inset-y-0 right-0 z-[220] flex w-full max-w-md flex-col bg-surface-secondary shadow-2xl sm:max-w-lg"
      >
        {/* En-tête */}
        <header className="flex items-center justify-between gap-3 border-b border-navy/[0.08] bg-surface-primary px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-da text-white">
              <Receipt size={17} />
            </span>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-navy">
                Détail du paiement
              </h2>
              <p className="truncate font-mono text-xs text-text-muted">
                {detail?.reference ?? "…"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-text-secondary transition-colors hover:bg-navy/[0.06] hover:text-navy"
            aria-label="Fermer le panneau"
          >
            <X size={19} />
          </button>
        </header>

        {/* Corps défilant */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-5">
          {loading ? (
            <LoadingState />
          ) : loadError || !detail ? (
            <div className="rounded-2xl border border-dashed border-error/30 bg-error/[0.04] p-6 text-center">
              <AlertTriangle size={26} className="mx-auto text-error" />
              <p className="mt-2 text-sm font-semibold text-navy">
                {loadError ?? "Paiement introuvable."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Montant + statut */}
              <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                      Montant
                    </p>
                    <p className="mt-1 font-display text-3xl font-extrabold text-navy">
                      {formatFCFA(detail.amount)}
                    </p>
                  </div>
                  {statusMeta && (
                    <StatusPill label={statusMeta.label} tone={statusMeta.tone} />
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <MetaChip
                    icon={TYPE_ICON[detail.type]}
                    label={PAYMENT_TYPE[detail.type] ?? detail.type}
                  />
                  <MetaChip
                    label={PAYMENT_PROVIDER[detail.provider] ?? detail.provider}
                  />
                </div>
              </div>

              {/* Article payé */}
              <Section title="Article payé" icon={<Sparkles size={15} />}>
                <p className="text-sm font-semibold text-navy">
                  {detail.item.label}
                </p>
                {detail.item.meta && (
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {detail.item.meta}
                  </p>
                )}
                {detail.item.href && (
                  <Link
                    href={detail.item.href}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
                  >
                    Ouvrir la fiche
                    <ExternalLink size={12} />
                  </Link>
                )}
              </Section>

              {/* Apprenant */}
              <Section title="Apprenant" icon={<CircleUserRound size={15} />}>
                <div className="flex items-center gap-3">
                  <Avatar
                    name={detail.learner.name}
                    src={detail.learner.avatar ?? undefined}
                    className="h-11 w-11 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-navy">
                      {detail.learner.name}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-text-secondary">
                      <Mail size={12} className="shrink-0" />
                      {detail.learner.email}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-text-muted">
                  Compte créé le {formatDate(detail.learner.createdAt)}
                </p>
              </Section>

              {/* Références & horodatage */}
              <Section title="Références" icon={<Hash size={15} />}>
                <InfoRow
                  icon={<Hash size={14} />}
                  label="Référence"
                  value={
                    <span className="font-mono text-navy">{detail.reference}</span>
                  }
                />
                <InfoRow
                  icon={<Fingerprint size={14} />}
                  label="ID de transaction"
                  value={
                    <span className="font-mono text-navy">
                      {detail.transactionId ?? "—"}
                    </span>
                  }
                />
                <InfoRow
                  icon={<CalendarClock size={14} />}
                  label="Soumis le"
                  value={formatDate(detail.createdAt)}
                />
              </Section>

              {/* Détails Mobile Money (paiement manuel) */}
              {detail.provider === "MANUAL" &&
                (detail.payerName || detail.operator || detail.payerPhone) && (
                  <Section title="Preuve Mobile Money" icon={<Smartphone size={15} />}>
                    <InfoRow
                      icon={<Smartphone size={14} />}
                      label="Opérateur"
                      value={
                        <span
                          className="font-semibold"
                          style={{
                            color:
                              OPERATOR_COLORS[detail.operator ?? ""] ?? "#1A1A2E",
                          }}
                        >
                          {detail.operator ?? "—"}
                        </span>
                      }
                    />
                    <InfoRow
                      icon={<User2 size={14} />}
                      label="Nom du payeur"
                      value={detail.payerName ?? "—"}
                    />
                    <InfoRow
                      icon={<Smartphone size={14} />}
                      label="Numéro"
                      value={detail.payerPhone ?? "—"}
                    />

                    {/* Capture d'écran */}
                    <div className="mt-3">
                      {detail.proofImage ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowProof((v) => !v)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
                          >
                            {showProof ? "Masquer la capture" : "Afficher la capture"}
                          </button>
                          <AnimatePresence initial={false}>
                            {showProof && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={detail.proofImage}
                                  alt={`Preuve de paiement ${detail.reference}`}
                                  className="mt-3 w-full rounded-xl border border-navy/10 object-contain"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </>
                      ) : (
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-text-muted">
                          <ImageOff size={13} />
                          Aucune capture jointe
                        </p>
                      )}
                    </div>
                  </Section>
                )}

              {/* Motif de rejet (si rejeté) */}
              {detail.status === "FAILED" && detail.rejectReason && (
                <div className="rounded-2xl border border-navy/[0.07] bg-navy/[0.03] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Motif du rejet
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {detail.rejectReason}
                  </p>
                </div>
              )}

              {/* Feedback d'action */}
              <AnimatePresence>
                {feedback && (
                  <motion.p
                    role="status"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      "rounded-xl px-3.5 py-2.5 text-sm font-medium",
                      feedback.tone === "ok"
                        ? "bg-success/10 text-success"
                        : "bg-error/10 text-error",
                    )}
                  >
                    {feedback.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Pied : actions pour les paiements en attente */}
        {!loading && detail && isPending && (
          <footer className="border-t border-navy/[0.08] bg-surface-primary px-5 py-4">
            <AnimatePresence mode="wait">
              {mode === "reject" ? (
                <motion.div
                  key="reject"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <label className="mb-1.5 block text-xs font-semibold text-navy">
                    Motif du rejet (visible par l'apprenant)
                  </label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex. : montant non reçu, ID de transaction introuvable sur nos relevés…"
                    className="min-h-20 text-sm"
                    maxLength={300}
                    autoFocus
                  />
                  <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMode("idle")}
                      disabled={pending}
                    >
                      Annuler
                    </Button>
                    <motion.button
                      type="button"
                      onClick={handleReject}
                      disabled={pending}
                      whileHover={pending ? undefined : { scale: 1.02 }}
                      whileTap={pending ? undefined : { scale: 0.97 }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-error px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <X size={16} strokeWidth={2.5} />
                      )}
                      Confirmer le rejet
                    </motion.button>
                  </div>
                </motion.div>
              ) : mode === "confirm-approve" ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <div className="mb-3 flex items-start gap-2 rounded-xl border border-brand-violet/20 bg-brand-violet/[0.05] px-3.5 py-3">
                    <ShieldCheck
                      size={16}
                      className="mt-0.5 shrink-0 text-brand-violet"
                    />
                    <p className="text-xs text-text-secondary">
                      L'approbation ouvre immédiatement l'accès à{" "}
                      <span className="font-semibold text-navy">
                        {detail.item.label}
                      </span>{" "}
                      et notifie l'apprenant par email. Confirmez uniquement après
                      avoir vérifié la réception sur vos relevés.
                    </p>
                  </div>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMode("idle")}
                      disabled={pending}
                    >
                      Annuler
                    </Button>
                    <motion.button
                      type="button"
                      onClick={handleApprove}
                      disabled={pending}
                      whileHover={pending ? undefined : { scale: 1.02 }}
                      whileTap={pending ? undefined : { scale: 0.97 }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <BadgeCheck size={16} strokeWidth={2.5} />
                      )}
                      Confirmer l'approbation
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="actions"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col-reverse gap-2 sm:flex-row"
                >
                  <motion.button
                    type="button"
                    onClick={() => setMode("reject")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-navy/[0.12] bg-surface-primary px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-error/40 hover:bg-error/[0.04] hover:text-error sm:flex-1"
                  >
                    <X size={16} />
                    Rejeter
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setMode("confirm-approve")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg sm:flex-[2]"
                  >
                    <BadgeCheck size={17} strokeWidth={2.5} />
                    Approuver — ouvrir l'accès
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </footer>
        )}
      </motion.aside>
    </AnimatePresence>,
    document.body,
  );
}

/* ─────────────────────────────── Sous-composants ───────────────────────────── */

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <span className="text-brand-blue-royal">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-navy/[0.05] py-2 text-sm last:border-0">
      <span className="inline-flex items-center gap-1.5 text-text-secondary">
        <span className="text-text-muted">{icon}</span>
        {label}
      </span>
      <span className="min-w-0 truncate text-right font-medium text-navy">
        {value}
      </span>
    </div>
  );
}

function MetaChip({
  icon,
  label,
}: {
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/[0.05] px-2.5 py-1 text-xs font-semibold text-navy">
      {icon && <span className="text-brand-blue-royal">{icon}</span>}
      {label}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-5">
      <div className="h-32 animate-pulse rounded-2xl bg-navy/[0.05]" />
      <div className="h-24 animate-pulse rounded-2xl bg-navy/[0.05]" />
      <div className="h-28 animate-pulse rounded-2xl bg-navy/[0.05]" />
    </div>
  );
}
