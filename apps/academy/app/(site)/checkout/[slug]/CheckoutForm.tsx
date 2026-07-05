"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Copy,
  ImagePlus,
  Phone,
  Send,
  Smartphone,
  User,
  X,
} from "lucide-react";
import { Button, Field, Input, buttonClasses, cn } from "@da/ui";
import { paymentConfig, type OperatorId } from "@/lib/site";
import { createManualPayment } from "@/lib/payment-actions";

/** Compresse une image côté client (max 1000px, JPEG qualité 0.8) → dataURL. */
async function compressImage(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const MAX = 1000;
  const scale = Math.min(1, MAX / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.8);
}

type Errors = Partial<Record<"payerName" | "payerPhone" | "transactionId", string>>;

export function CheckoutForm({
  courseSlug,
  amountLabel,
  lastRejection,
}: {
  courseSlug: string;
  amountLabel: string;
  lastRejection: { reference: string; reason: string | null } | null;
}) {
  const [operator, setOperator] = React.useState<OperatorId>("ORANGE");
  const [payerName, setPayerName] = React.useState("");
  const [payerPhone, setPayerPhone] = React.useState("");
  const [transactionId, setTransactionId] = React.useState("");
  const [proofImage, setProofImage] = React.useState<string | null>(null);
  const [proofError, setProofError] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [success, setSuccess] = React.useState<string | null>(null);

  const selected = paymentConfig.operators.find((o) => o.id === operator)!;

  async function copyNumber(number: string) {
    try {
      await navigator.clipboard.writeText(number.replace(/\s/g, ""));
      setCopied(number);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* presse-papiers indisponible — l'utilisateur copiera manuellement */
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setProofError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProofError("Choisissez une image (capture d'écran du SMS ou du reçu).");
      return;
    }
    try {
      const compressed = await compressImage(file);
      if (compressed.length > 1_400_000) {
        setProofError("Image trop lourde même compressée — réessayez avec une capture simple.");
        return;
      }
      setProofImage(compressed);
    } catch {
      setProofError("Impossible de lire cette image.");
    }
  }

  function validate(): Errors {
    const next: Errors = {};
    if (payerName.trim().length < 2) next.payerName = "Le nom utilisé pour le paiement est requis.";
    if (!/^[+0-9 ]{8,}$/.test(payerPhone.trim()))
      next.payerPhone = "Numéro invalide (ex : +225 07 00 00 00 00).";
    if (transactionId.trim().length < 6)
      next.transactionId = "L'ID de transaction figure dans le SMS de confirmation.";
    return next;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    startTransition(async () => {
      const res = await createManualPayment({
        courseSlug,
        operator,
        payerName: payerName.trim(),
        payerPhone: payerPhone.trim(),
        transactionId: transactionId.trim(),
        ...(proofImage ? { proofImage } : {}),
      });
      if (res.ok) {
        setSuccess(res.reference);
      } else {
        setErrors((res.fieldErrors as Errors) ?? {});
        setFormError(res.error);
      }
    });
  }

  /* ───────────────────────── Écran de confirmation ──────────────────────── */
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="card-gradient-border rounded-2xl p-8 text-center sm:p-10"
      >
        <motion.span
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 15, delay: 0.15 }}
          className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-da text-white shadow-brand"
        >
          <Send size={32} />
        </motion.span>
        <h2 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-navy">
          Preuve bien reçue !
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
          Votre référence :{" "}
          <span className="font-mono font-bold text-navy">{success}</span>.
          Notre équipe vérifie votre paiement {paymentConfig.reviewDelay} — vous
          recevrez un email dès que votre accès sera ouvert.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className={buttonClasses({ variant: "primary", size: "md" })}>
            Aller à mon dashboard
          </Link>
          <Link href="/courses" className={buttonClasses({ variant: "outline", size: "md" })}>
            Explorer le catalogue
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rejet précédent */}
      {lastRejection && (
        <div className="flex items-start gap-3 rounded-xl border border-error/25 bg-error/[0.05] p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-error" />
          <div className="text-sm">
            <p className="font-semibold text-navy">
              Votre précédente preuve ({lastRejection.reference}) n'a pas été validée.
            </p>
            {lastRejection.reason && (
              <p className="mt-0.5 text-text-secondary">Motif : {lastRejection.reason}</p>
            )}
            <p className="mt-0.5 text-text-secondary">
              Vérifiez l'ID de transaction et soumettez à nouveau ci-dessous.
            </p>
          </div>
        </div>
      )}

      {/* Étape 1 — Choisir l'opérateur et envoyer */}
      <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-7">
        <h2 className="flex items-center gap-3 font-display text-lg font-bold text-navy">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-da text-sm font-extrabold text-white">
            1
          </span>
          Envoyez {amountLabel} par Mobile Money
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {paymentConfig.operators.map((op) => (
            <button
              key={op.id}
              type="button"
              onClick={() => setOperator(op.id)}
              className={cn(
                "rounded-xl border-2 p-4 text-left transition-all",
                operator === op.id
                  ? "border-brand-blue-vif bg-brand-blue-vif/[0.06] shadow-brand"
                  : "border-navy/10 hover:border-brand-blue-vif/40",
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  className="grid h-8 w-8 place-items-center rounded-lg text-white"
                  style={{ backgroundColor: op.color }}
                >
                  <Smartphone size={16} />
                </span>
                <span className="text-sm font-bold text-navy">{op.name}</span>
              </span>
            </button>
          ))}
        </div>

        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl bg-surface-secondary p-5"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {selected.name} · {paymentConfig.holderName}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <span className="font-mono text-xl font-extrabold tracking-wide text-navy">
              {selected.number}
            </span>
            <button
              type="button"
              onClick={() => copyNumber(selected.number)}
              className={cn(
                buttonClasses({ variant: "outline", size: "sm" }),
                "h-8 px-3 text-xs",
              )}
            >
              {copied === selected.number ? (
                <>
                  <Check size={13} className="text-success" /> Copié
                </>
              ) : (
                <>
                  <Copy size={13} /> Copier
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-text-secondary">{selected.instructions}</p>
          <p className="mt-3 rounded-lg bg-brand-blue-vif/[0.07] px-3 py-2 text-xs font-medium text-brand-blue-royal">
            💡 Envoyez exactement <b>{amountLabel}</b> — un montant différent
            retarde la validation.
          </p>
        </motion.div>
      </div>

      {/* Étape 2 — Transmettre la preuve */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-7"
      >
        <h2 className="flex items-center gap-3 font-display text-lg font-bold text-navy">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-da text-sm font-extrabold text-white">
            2
          </span>
          Transmettez votre preuve de paiement
        </h2>

        <AnimatePresence>
          {formError && (
            <motion.p
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 16 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="overflow-hidden rounded-lg border border-error/25 bg-error/5 px-4 py-3 text-sm font-medium text-error"
            >
              {formError}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Nom utilisé pour le paiement" htmlFor="payerName" error={errors.payerName} required>
            <div className="relative">
              <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                id="payerName"
                value={payerName}
                error={!!errors.payerName}
                onChange={(e) => {
                  setPayerName(e.target.value);
                  if (errors.payerName) setErrors((p) => ({ ...p, payerName: undefined }));
                }}
                placeholder="Nom sur le compte Mobile Money"
                className="pl-10"
              />
            </div>
          </Field>

          <Field label="Numéro ayant payé" htmlFor="payerPhone" error={errors.payerPhone} required>
            <div className="relative">
              <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                id="payerPhone"
                type="tel"
                value={payerPhone}
                error={!!errors.payerPhone}
                onChange={(e) => {
                  setPayerPhone(e.target.value);
                  if (errors.payerPhone) setErrors((p) => ({ ...p, payerPhone: undefined }));
                }}
                placeholder="+225 07 00 00 00 00"
                className="pl-10"
              />
            </div>
          </Field>
        </div>

        <div className="mt-5">
          <Field
            label="ID de transaction"
            htmlFor="transactionId"
            error={errors.transactionId}
            hint="Il figure dans le SMS de confirmation de votre opérateur (ex : PP240705.1234.A56789)."
            required
          >
            <Input
              id="transactionId"
              value={transactionId}
              error={!!errors.transactionId}
              onChange={(e) => {
                setTransactionId(e.target.value);
                if (errors.transactionId) setErrors((p) => ({ ...p, transactionId: undefined }));
              }}
              placeholder="ID unique du transfert"
              className="font-mono"
            />
          </Field>
        </div>

        {/* Capture d'écran (optionnelle) */}
        <div className="mt-5">
          <span className="block text-sm font-medium text-navy">
            Capture d'écran du reçu <span className="text-text-muted">(recommandé)</span>
          </span>
          {proofImage ? (
            <div className="mt-2 flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proofImage}
                alt="Preuve de paiement"
                className="max-h-44 rounded-xl border border-navy/10 object-contain"
              />
              <button
                type="button"
                onClick={() => setProofImage(null)}
                className={cn(buttonClasses({ variant: "ghost", size: "sm" }), "text-error")}
              >
                <X size={15} /> Retirer
              </button>
            </div>
          ) : (
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy/15 bg-surface-secondary/60 px-6 py-8 text-center transition-colors hover:border-brand-blue-vif/50">
              <ImagePlus size={26} className="text-brand-blue-royal" />
              <span className="text-sm font-medium text-navy">
                Ajouter la capture du SMS ou du reçu
              </span>
              <span className="text-xs text-text-muted">
                JPEG/PNG — compressée automatiquement avant envoi
              </span>
              <input type="file" accept="image/*" onChange={handleFile} className="sr-only" />
            </label>
          )}
          {proofError && (
            <p className="mt-2 text-xs font-medium text-error">{proofError}</p>
          )}
        </div>

        <Button type="submit" size="lg" loading={pending} className="mt-7 w-full">
          {pending ? "Envoi de la preuve…" : "Envoyer ma preuve de paiement"}
          {!pending && <Send size={17} />}
        </Button>

        <p className="mt-3 text-center text-xs text-text-muted">
          L'accès s'ouvre après vérification par notre équipe ({paymentConfig.reviewDelay}).
        </p>
      </form>
    </div>
  );
}
