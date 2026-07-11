"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, ShieldCheck, Loader2, ArrowRight, Smartphone, Hash, CheckCircle2, Sparkles } from "lucide-react";
import { Button, formatFCFA, cn } from "@da/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { submitManualPayment } from "@/lib/payment-actions";

type Operator = {
  id: string;
  name: string;
  number: string;
  color: string;
  instructions: string;
};

/* ══════════════════════════════════════════════════════════════════════════
   Tunnel de paiement Mobile Money manuel.
   1. L'apprenant choisit un opérateur → voit le numéro, le bénéficiaire et le
      montant EXACT à envoyer.
   2. Il paie depuis son téléphone, puis dépose sa preuve : numéro émetteur,
      ID de transaction et capture d'écran.
   3. submitManualPayment enregistre un paiement EN ATTENTE — aucun accès n'est
      ouvert ici. L'accès est activé par l'admin après vérification.
   ══════════════════════════════════════════════════════════════════════════ */

export function CheckoutForm({
  slug,
  title,
  price,
  operators,
  holderName,
  reviewDelay,
}: {
  slug: string;
  title: string;
  price: number;
  operators: Operator[];
  holderName: string;
  reviewDelay: string;
}) {
  const router = useRouter();
  const [operatorId, setOperatorId] = React.useState<string | null>(null);
  const [phone, setPhone] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [proofUrl, setProofUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [busy, startTransition] = React.useTransition();

  const selected = operators.find((o) => o.id === operatorId) ?? null;
  const amount = formatFCFA(price);

  async function copyNumber(num: string) {
    try {
      await navigator.clipboard.writeText(num.replace(/\s+/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard indisponible — l'apprenant recopie manuellement */
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!operatorId) return setError("Choisissez d'abord votre moyen de paiement.");
    if (reference.trim().length < 4) return setError("Renseignez l'identifiant (ID) de la transaction.");
    if (!proofUrl) return setError("Joignez la capture d'écran de votre paiement.");

    startTransition(async () => {
      const res = await submitManualPayment({
        slug,
        operator: operatorId,
        reference: reference.trim(),
        phone: phone.trim(),
        proofUrl,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
    });
  }

  /* ─── Écran de confirmation ────────────────────────────────────────────── */
  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-success/25 bg-white p-8 text-center shadow-sm sm:p-10"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/12 text-success"
        >
          <CheckCircle2 size={34} />
        </motion.div>
        <h2 className="mt-5 font-display text-2xl font-extrabold text-navy">Preuve envoyée !</h2>
        <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-text-secondary">
          Merci. Notre équipe vérifie votre paiement pour <span className="font-semibold text-navy">« {title} »</span> {reviewDelay}.
          Vous recevrez une notification dès l'ouverture de votre accès.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard/mes-cours" className="inline-flex h-12 items-center gap-2 rounded-lg bg-gradient-da px-6 text-[0.95rem] font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5">
            Mon tableau de bord <ArrowRight size={16} />
          </Link>
          <Link href={`/career-paths/${slug}`} className="inline-flex h-12 items-center gap-2 rounded-lg border border-navy/15 px-6 text-[0.95rem] font-semibold text-navy transition-colors hover:bg-navy/[0.04]">
            Revoir la formation
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {/* Étape 1 — Choix de l'opérateur */}
      <section className="rounded-3xl border border-navy/[0.08] bg-white p-6 shadow-sm sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-da text-sm font-bold text-white">1</span>
          <h2 className="font-display text-lg font-bold text-navy">Choisissez votre moyen de paiement</h2>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {operators.map((op) => {
            const active = op.id === operatorId;
            return (
              <button
                key={op.id}
                type="button"
                onClick={() => { setOperatorId(op.id); setError(null); }}
                aria-pressed={active}
                className={cn(
                  "group relative flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all",
                  active ? "border-transparent shadow-md" : "border-navy/[0.08] hover:border-navy/20",
                )}
                style={active ? { boxShadow: `0 0 0 2px ${op.color}` } : undefined}
              >
                <span
                  className="grid h-10 w-10 place-items-center rounded-xl font-display text-sm font-black text-white"
                  style={{ backgroundColor: op.color }}
                >
                  {op.id === "WAVE" ? "W" : op.id === "MTN" ? "M" : "O"}
                </span>
                <span className="font-semibold text-navy">{op.name}</span>
                {active && (
                  <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-white" style={{ backgroundColor: op.color }}>
                    <Check size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence initial={false}>
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-5 rounded-2xl border border-navy/[0.08] bg-surface-secondary/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Envoyez exactement</p>
                <p className="mt-1 font-display text-3xl font-extrabold" style={{ color: selected.color }}>{amount}</p>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-navy/[0.08] bg-white p-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Numéro {selected.name}</p>
                    <p className="truncate font-mono text-lg font-bold text-navy">{selected.number}</p>
                    <p className="mt-0.5 text-xs text-text-secondary">Bénéficiaire : <span className="font-semibold text-navy">{holderName}</span></p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyNumber(selected.number)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-navy/15 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/[0.04]"
                  >
                    {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    {copied ? "Copié" : "Copier"}
                  </button>
                </div>

                <p className="mt-3 text-sm text-text-secondary">
                  <span className="font-semibold text-navy">Comment payer :</span> {selected.instructions}, vers le numéro ci-dessus, montant <span className="font-semibold text-navy">{amount}</span>.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Étape 2 — Preuve de paiement */}
      <section className={cn("rounded-3xl border border-navy/[0.08] bg-white p-6 shadow-sm transition-opacity sm:p-7", !selected && "pointer-events-none opacity-50")}>
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-da text-sm font-bold text-white">2</span>
          <h2 className="font-display text-lg font-bold text-navy">Confirmez votre paiement</h2>
        </div>
        <p className="mt-2 text-sm text-text-secondary">Après avoir payé, déposez votre preuve. Notre équipe l'associe à votre compte.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy"><Smartphone size={15} className="text-brand-blue-royal" /> Votre numéro payeur</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              placeholder="Ex. 07 00 00 00 00"
              className="h-11 rounded-lg border border-navy/15 bg-white px-3 text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-royal focus:ring-2 focus:ring-brand-blue-royal/20"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy"><Hash size={15} className="text-brand-blue-royal" /> ID de la transaction <span className="text-error">*</span></span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex. MP240711.1523.A45678"
              className="h-11 rounded-lg border border-navy/15 bg-white px-3 font-mono text-navy outline-none transition-colors placeholder:font-sans placeholder:text-text-muted focus:border-brand-blue-royal focus:ring-2 focus:ring-brand-blue-royal/20"
            />
          </label>
        </div>

        <div className="mt-4">
          <span className="mb-1.5 block text-sm font-semibold text-navy">Capture d'écran du paiement <span className="text-error">*</span></span>
          <ImageUpload
            value={proofUrl}
            onChange={setProofUrl}
            folder="payment-proofs"
            aspect="4 / 3"
            hint="Capture du reçu Mobile Money — PNG, JPG ou WebP, 5 Mo max"
          />
        </div>

        {error && <p className="mt-4 text-sm font-medium text-error">{error}</p>}

        <Button type="submit" size="lg" loading={busy} disabled={!selected} className="mt-5 w-full sm:w-auto">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
          J'ai payé — soumettre ma preuve
        </Button>

        <p className="mt-4 flex items-start gap-2 text-xs text-text-muted">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-brand-violet" />
          Votre accès s'ouvre après vérification de la preuve par notre équipe ({reviewDelay}). Aucun accès n'est délivré automatiquement.
        </p>
      </section>
    </form>
  );
}
