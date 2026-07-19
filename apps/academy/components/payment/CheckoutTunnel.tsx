"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Copy,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Clock,
  Smartphone,
  Hash,
  Sparkles,
  Ticket,
  X,
} from "lucide-react";
import { Button, Field, Input, cn } from "@da/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { paymentConfig, formatFCFA } from "@/lib/site";
import { submitManualPayment, previewCoupon } from "@/lib/payments";

/* ══════════════════════════════════════════════════════════════════════════
   Tunnel de paiement Mobile Money MANUEL (cahier §27).
   Étape 1 — choix de l'opérateur : révèle le numéro bénéficiaire DIGITAL
   ACCESS, le montant exact et les instructions (avec bouton copier).
   Étape 2 — dépôt de preuve : téléphone payeur + ID de transaction (obligatoire)
   + capture. À la soumission → submitManualPayment (crée un Payment PENDING et
   RIEN d'autre — seule l'approbation admin ouvre l'accès).
   ══════════════════════════════════════════════════════════════════════════ */

type OperatorId = "ORANGE" | "MTN" | "WAVE";

interface CheckoutTunnelProps {
  type: "formation" | "parcours" | "cohorte";
  slug: string;
  amount: number;
  title: string;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          /* clipboard indisponible — sans conséquence */
        }
      }}
      aria-label={`Copier ${label}`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors",
        copied
          ? "border-success/40 bg-success/10 text-success"
          : "border-navy/15 bg-surface-primary text-navy hover:border-brand-blue-vif/60 hover:text-brand-blue-royal",
      )}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copié" : "Copier"}
    </button>
  );
}

export function CheckoutTunnel({ type, slug, amount, title }: CheckoutTunnelProps) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [operator, setOperator] = React.useState<OperatorId | null>(null);
  const [payerPhone, setPayerPhone] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [proofUrl, setProofUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<{ phone?: string; ref?: string; proof?: string }>({});
  const [submitting, setSubmitting] = React.useState(false);
  // Coupon — l'aperçu (previewCoupon) recalcule le montant CÔTÉ SERVEUR ; le
  // montant réellement facturé est re-vérifié à la soumission (submitManualPayment).
  const [couponInput, setCouponInput] = React.useState("");
  const [appliedCoupon, setAppliedCoupon] = React.useState<{ code: string; discount: number; finalAmount: number } | null>(null);
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [couponLoading, setCouponLoading] = React.useState(false);

  const selected = paymentConfig.operators.find((o) => o.id === operator) ?? null;
  const effectiveAmount = appliedCoupon ? appliedCoupon.finalAmount : amount;
  const amountLabel = formatFCFA(effectiveAmount);

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setCouponError(null);
    setCouponLoading(true);
    const res = await previewCoupon(type, slug, code);
    setCouponLoading(false);
    if (res.ok) {
      setAppliedCoupon({ code: res.code, discount: res.discount, finalAmount: res.finalAmount });
    } else {
      setAppliedCoupon(null);
      setCouponError(res.error);
    }
  }
  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const errs: { phone?: string; ref?: string; proof?: string } = {};
    if (payerPhone.trim().length < 8) errs.phone = "Indiquez le numéro qui a effectué le paiement.";
    if (reference.trim().length < 6) errs.ref = "L'identifiant de transaction est obligatoire (6 caractères min).";
    if (!proofUrl) errs.proof = "Ajoutez la capture de votre reçu Mobile Money.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0 || !operator || !proofUrl) return;

    setSubmitting(true);
    const res = await submitManualPayment({
      type,
      slug,
      operator,
      reference: reference.trim(),
      payerPhone: payerPhone.trim(),
      proofUrl,
      couponCode: appliedCoupon?.code,
    });
    setSubmitting(false);

    if (res.ok) {
      setStep(3);
    } else {
      setError(res.error);
    }
  }

  /* ─── Écran de confirmation ─────────────────────────────────────────────── */
  if (step === 3) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-8 text-center shadow-sm sm:p-10"
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-da text-white shadow-brand"
        >
          <Check size={32} strokeWidth={2.5} />
        </motion.div>
        <h2 className="mt-6 font-display text-2xl font-bold text-navy">Preuve envoyée !</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-secondary">
          Nous avons bien reçu votre paiement de <span className="font-semibold text-navy">{amountLabel}</span> pour
          {" «"} {title} ». Notre équipe le vérifie <span className="font-semibold text-navy">{paymentConfig.reviewDelay}</span>.
          Votre accès sera activé automatiquement dès la validation, et vous recevrez une notification.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/espace/formations"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-gradient-da px-6 text-[0.95rem] font-medium text-white shadow-brand transition-all hover:-translate-y-0.5"
          >
            Voir mes formations
          </Link>
          <Link
            href="/formations"
            className="inline-flex h-11 items-center justify-center rounded-lg border-2 border-navy/15 px-6 text-[0.95rem] font-medium text-navy transition-colors hover:border-brand-blue-vif/60 hover:text-brand-blue-royal"
          >
            Explorer le catalogue
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Fil d'étapes */}
      <ol className="mb-6 flex items-center gap-3">
        {[
          { n: 1, label: "Payer" },
          { n: 2, label: "Preuve" },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <li className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-colors",
                  step >= (s.n as 1 | 2)
                    ? "bg-gradient-da text-white shadow-brand"
                    : "bg-navy/[0.06] text-text-muted",
                )}
              >
                {step > s.n ? <Check size={14} /> : s.n}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  step >= (s.n as 1 | 2) ? "text-navy" : "text-text-muted",
                )}
              >
                {s.label}
              </span>
            </li>
            {i === 0 && <li className="h-px flex-1 bg-navy/10" aria-hidden />}
          </React.Fragment>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        {/* ─── Étape 1 : opérateur + instructions ─────────────────────────── */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            <h2 className="font-display text-lg font-bold text-navy">1. Choisissez votre opérateur Mobile Money</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Effectuez le transfert du montant exact vers le numéro Digital Access indiqué, puis passez à l'étape suivante.
            </p>

            {/* Code promo (facultatif) — remise revérifiée côté serveur */}
            <div className="mt-5 rounded-xl border border-navy/[0.08] bg-surface-secondary/50 p-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-success/10 text-success">
                      <Ticket size={17} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-navy">
                        Code « {appliedCoupon.code} » appliqué
                      </p>
                      <p className="text-xs font-medium text-success">− {formatFCFA(appliedCoupon.discount)} de remise</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-error/[0.06] hover:text-error"
                  >
                    <X size={13} />
                    Retirer
                  </button>
                </div>
              ) : (
                <div>
                  <label htmlFor="coupon" className="flex items-center gap-1.5 text-xs font-semibold text-navy">
                    <Ticket size={14} className="text-brand-blue-vif" />
                    Vous avez un code promo ?
                  </label>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="coupon"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void applyCoupon();
                        }
                      }}
                      placeholder="EX. BOURSE2026"
                      className="h-10 min-w-0 flex-1 rounded-lg border border-navy/10 bg-surface-primary px-3 font-mono text-sm uppercase tracking-wide text-navy outline-none transition-colors placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-text-muted focus:border-brand-blue-vif/60"
                    />
                    <button
                      type="button"
                      onClick={() => void applyCoupon()}
                      disabled={couponLoading || !couponInput.trim()}
                      className="inline-flex h-10 shrink-0 items-center rounded-lg border-2 border-navy/15 px-4 text-sm font-semibold text-navy transition-colors hover:border-brand-blue-vif/60 hover:text-brand-blue-royal disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {couponLoading ? "…" : "Appliquer"}
                    </button>
                  </div>
                  {couponError && <p className="mt-1.5 text-xs font-medium text-error">{couponError}</p>}
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {paymentConfig.operators.map((op) => {
                const active = operator === op.id;
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setOperator(op.id as OperatorId)}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border-2 p-4 text-left transition-all",
                      active
                        ? "border-brand-blue-vif bg-brand-blue-vif/[0.05] shadow-sm"
                        : "border-navy/10 bg-surface-primary hover:border-brand-blue-vif/50 hover:-translate-y-0.5",
                    )}
                  >
                    <span className="relative block h-12 w-12 overflow-hidden rounded-xl bg-white ring-1 ring-navy/[0.08] shadow-sm">
                      <Image
                        src={op.logo}
                        alt={`Logo ${op.name}`}
                        fill
                        sizes="48px"
                        className="object-contain"
                      />
                    </span>
                    <p className="mt-3 text-sm font-bold text-navy">{op.name}</p>
                    {active && (
                      <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-gradient-da text-white">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {selected && (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 rounded-xl border border-navy/[0.08] bg-surface-secondary/60 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/10 pb-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Numéro bénéficiaire</p>
                        <p className="font-mono text-lg font-bold text-navy">{selected.number}</p>
                      </div>
                      <CopyButton value={selected.number.replace(/\s/g, "")} label="le numéro" />
                    </div>

                    <div className="grid gap-4 py-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Bénéficiaire</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-navy">
                          <ShieldCheck size={15} className="text-success" />
                          {paymentConfig.holderName}
                        </p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-xs font-medium uppercase tracking-wide text-text-muted">Montant exact</p>
                        <p className="mt-0.5 bg-gradient-da bg-clip-text font-display text-xl font-extrabold text-transparent">
                          {amountLabel}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-surface-primary p-3">
                      <p className="text-xs font-semibold text-navy">Comment payer</p>
                      <p className="mt-1 text-sm text-text-secondary">{selected.instructions}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end">
                    <Button type="button" onClick={() => setStep(2)}>
                      J'ai effectué le paiement
                      <ChevronRight size={18} />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ─── Étape 2 : preuve ───────────────────────────────────────────── */}
        {step === 2 && (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit}
          >
            <h2 className="font-display text-lg font-bold text-navy">2. Confirmez avec votre preuve de paiement</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Renseignez les informations de votre reçu Mobile Money via {selected?.name ?? "votre opérateur"}. Aucun accès
              n'est ouvert avant la vérification de votre paiement par notre équipe.
            </p>

            <div className="mt-5 space-y-5">
              <Field label="Numéro de téléphone du payeur" htmlFor="payerPhone" required error={fieldErrors.phone}>
                <div className="relative">
                  <Smartphone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="payerPhone"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+225 07 00 00 00 00"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    error={!!fieldErrors.phone}
                    className="pl-10"
                  />
                </div>
              </Field>

              <Field
                label="Identifiant de la transaction"
                htmlFor="reference"
                required
                error={fieldErrors.ref}
                hint="Le code / ID figurant sur le SMS ou le reçu de confirmation."
              >
                <div className="relative">
                  <Hash size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="reference"
                    placeholder="Ex. PP240712.1830.A12345"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    error={!!fieldErrors.ref}
                    className="pl-10 font-mono"
                  />
                </div>
              </Field>

              <Field label="Capture du reçu" required error={fieldErrors.proof}>
                <ImageUpload
                  value={proofUrl}
                  onChange={(url) => {
                    setProofUrl(url);
                    setFieldErrors((f) => ({ ...f, proof: undefined }));
                  }}
                  folder="payment-proofs"
                  aspect="16 / 10"
                  hint="Capture d'écran du reçu — PNG, JPG ou WebP (5 Mo max)"
                />
              </Field>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-lg border border-error/30 bg-error/[0.06] px-3 py-2.5 text-sm font-medium text-error"
              >
                {error}
              </motion.p>
            )}

            <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
              >
                <ChevronLeft size={16} />
                Revenir au paiement
              </button>
              <Button type="submit" loading={submitting} size="lg">
                {submitting ? "Envoi en cours…" : "Envoyer ma preuve"}
                {!submitting && <Sparkles size={18} />}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-text-muted">
        <Clock size={13} />
        Validation manuelle {paymentConfig.reviewDelay} — paiement 100 % sécurisé Digital Access.
      </p>
    </div>
  );
}
