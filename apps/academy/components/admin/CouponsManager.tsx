"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus,
  X,
  Ticket,
  AlertCircle,
  Power,
  PowerOff,
  Trash2,
  Check,
  Loader2,
  Infinity as InfinityIcon,
} from "lucide-react";
import { Button, Input, Field, cn, formatFCFA } from "@da/ui";
import { Select } from "@/components/Select";
import {
  AdminCard,
  EmptyState,
  StatusPill,
} from "@/components/admin/ui";
import { createCoupon, toggleCoupon, deleteCoupon } from "@/lib/admin-actions";
import type { AdminCouponRow } from "@/lib/admin-types";

/* ══════════════════════════════════════════════════════════════════════════
   Gestion des coupons & bourses.
   - Bouton « Nouveau coupon » → modale de création (code, type, valeur,
     utilisations max, expiration).
   - Par coupon : activer/désactiver (toggleCoupon) et supprimer (deleteCoupon,
     confirmation inline brandée).
   ══════════════════════════════════════════════════════════════════════════ */

const TYPE_LABEL: Record<string, string> = {
  PERCENTAGE: "Pourcentage",
  FIXED: "Montant fixe",
};

const TYPE_OPTIONS = [
  { value: "PERCENTAGE", label: "Pourcentage (%)" },
  { value: "FIXED", label: "Montant fixe (FCFA)" },
];

function discountLabel(type: string, value: number): string {
  return type === "FIXED" ? formatFCFA(value) : `${value} %`;
}

function usesLabel(current: number, max: number | null): React.ReactNode {
  return (
    <span className="inline-flex items-center gap-1 font-medium text-navy">
      {current}
      <span className="text-text-muted">/</span>
      {max === null ? <InfinityIcon size={14} className="text-text-muted" /> : max}
    </span>
  );
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isExpired(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

export function CouponsManager({ coupons }: { coupons: AdminCouponRow[] }) {
  const [creating, setCreating] = React.useState(false);

  if (coupons.length === 0) {
    return (
      <>
        <EmptyState
          icon={<Ticket size={20} />}
          title="Aucun coupon pour l'instant"
          description="Créez un premier code de réduction ou une bourse pour vos apprenants."
        >
          <Button type="button" size="sm" onClick={() => setCreating(true)}>
            <Plus size={16} />
            Nouveau coupon
          </Button>
        </EmptyState>
        <CouponCreateModal open={creating} onClose={() => setCreating(false)} />
      </>
    );
  }

  return (
    <>
      <AdminCard
        bodyClassName="p-0"
        title="Codes de réduction"
        action={
          <Button type="button" size="sm" onClick={() => setCreating(true)}>
            <Plus size={16} />
            Nouveau coupon
          </Button>
        }
      >
        {/* Tablette & desktop : tableau */}
        <div className="hidden overflow-x-auto lg:block">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-navy/[0.08] text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3.5">Code</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5 text-right">Valeur</th>
                    <th className="px-4 py-3.5">Utilisations</th>
                    <th className="px-4 py-3.5">Statut</th>
                    <th className="px-4 py-3.5">Expiration</th>
                    <th className="px-4 py-3.5">Créé le</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => {
                    const expired = isExpired(c.expiresAt);
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-navy/[0.05] transition-colors last:border-0 hover:bg-navy/[0.02]"
                      >
                        <td className="px-5 py-4">
                          <span className="font-mono text-sm font-bold text-navy">{c.code}</span>
                        </td>
                        <td className="px-4 py-4 text-text-secondary">
                          {TYPE_LABEL[c.discountType] ?? c.discountType}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-navy">
                          {discountLabel(c.discountType, c.discountValue)}
                        </td>
                        <td className="px-4 py-4">{usesLabel(c.currentUses, c.maxUses)}</td>
                        <td className="px-4 py-4">
                          <StatusPill
                            label={c.active ? "Actif" : "Inactif"}
                            tone={c.active ? "green" : "slate"}
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {c.expiresAt ? (
                            <span className={cn(expired ? "font-medium text-error" : "text-text-secondary")}>
                              {formatDay(c.expiresAt)}
                              {expired && " · expiré"}
                            </span>
                          ) : (
                            <span className="text-text-muted">Sans limite</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-text-secondary">
                          {formatDay(c.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <CouponRowActions id={c.id} code={c.code} active={c.active} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile & tablette : cartes empilées */}
            <ul className="divide-y divide-navy/[0.06] lg:hidden">
              {coupons.map((c) => {
                const expired = isExpired(c.expiresAt);
                return (
                  <li key={c.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-mono text-sm font-bold text-navy">{c.code}</span>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {TYPE_LABEL[c.discountType] ?? c.discountType} ·{" "}
                          <span className="font-semibold text-navy">
                            {discountLabel(c.discountType, c.discountValue)}
                          </span>
                        </p>
                      </div>
                      <StatusPill
                        label={c.active ? "Actif" : "Inactif"}
                        tone={c.active ? "green" : "slate"}
                      />
                    </div>

                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                      <Meta label="Utilisations" value={usesLabel(c.currentUses, c.maxUses)} />
                      <Meta
                        label="Expiration"
                        value={
                          c.expiresAt ? (
                            <span className={expired ? "font-medium text-error" : undefined}>
                              {formatDay(c.expiresAt)}
                              {expired && " · expiré"}
                            </span>
                          ) : (
                            "Sans limite"
                          )
                        }
                      />
                      <Meta label="Créé le" value={formatDay(c.createdAt)} />
                    </dl>

                    <div className="mt-3 flex justify-end">
                      <CouponRowActions id={c.id} code={c.code} active={c.active} />
                    </div>
                  </li>
                );
              })}
        </ul>
      </AdminCard>

      <CouponCreateModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

/* ─────────────────────── Métadonnée (cartes mobile) ─────────────────────── */

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-text-muted">{label}</dt>
      <dd className="truncate font-medium text-navy">{value}</dd>
    </div>
  );
}

/* ───────────────────── Actions par coupon (activer / supprimer) ─────────── */

function CouponRowActions({ id, code, active }: { id: string; code: string; active: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function runToggle() {
    setError(null);
    startTransition(async () => {
      const res = await toggleCoupon(id, !active);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function runDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteCoupon(id);
      if (!res.ok) {
        setError(res.error);
        setConfirming(false);
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <AnimatePresence mode="wait" initial={false}>
        {confirming ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5"
          >
            <span className="mr-0.5 text-xs font-medium text-text-secondary">
              Supprimer <span className="font-mono font-semibold text-navy">{code}</span> ?
            </span>
            <button
              type="button"
              onClick={runDelete}
              disabled={pending}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-error px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-60"
            >
              {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Confirmer
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-navy/10 px-2.5 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-navy/25 hover:text-navy disabled:opacity-60"
            >
              <X size={13} />
              Annuler
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="trigger"
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            <motion.button
              type="button"
              onClick={runToggle}
              disabled={pending}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60",
                active
                  ? "border-navy/15 text-text-secondary hover:border-warning/40 hover:text-[#B45309]"
                  : "border-success/30 text-success hover:bg-success/10",
              )}
            >
              {pending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : active ? (
                <PowerOff size={13} />
              ) : (
                <Power size={13} />
              )}
              {active ? "Désactiver" : "Activer"}
            </motion.button>
            <motion.button
              type="button"
              onClick={() => {
                setError(null);
                setConfirming(true);
              }}
              disabled={pending}
              whileTap={{ scale: 0.97 }}
              aria-label={`Supprimer le coupon ${code}`}
              className="inline-flex items-center justify-center rounded-lg border border-error/25 p-1.5 text-error transition-colors hover:bg-error/10 disabled:opacity-60"
            >
              <Trash2 size={14} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p className="max-w-[14rem] text-right text-xs font-medium text-error">{error}</p>}
    </div>
  );
}

/* ─────────────────────────── Modale de création ─────────────────────────── */

const DEFAULT_TYPE = "PERCENTAGE";

function CouponCreateModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [code, setCode] = React.useState("");
  const [discountType, setDiscountType] = React.useState(DEFAULT_TYPE);
  const [discountValue, setDiscountValue] = React.useState("");
  const [maxUses, setMaxUses] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");

  React.useEffect(() => setMounted(true), []);

  const reset = React.useCallback(() => {
    setCode("");
    setDiscountType(DEFAULT_TYPE);
    setDiscountValue("");
    setMaxUses("");
    setExpiresAt("");
    setError(null);
  }, []);

  const close = React.useCallback(() => {
    if (pending) return;
    onClose();
  }, [pending, onClose]);

  React.useEffect(() => {
    if (!open) return;
    reset();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, reset]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const value = Number(discountValue);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Saisissez une valeur de réduction valide.");
      return;
    }
    if (discountType === "PERCENTAGE" && value > 100) {
      setError("Un pourcentage ne peut pas dépasser 100 %.");
      return;
    }

    startTransition(async () => {
      const res = await createCoupon({
        code,
        discountType,
        discountValue: value,
        maxUses: maxUses.trim() ? Number(maxUses) : undefined,
        expiresAt: expiresAt.trim() ? expiresAt : undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onClose();
      router.refresh();
    });
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-navy/60 p-4 backdrop-blur-sm"
          onMouseDown={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Créer un coupon"
            className="my-8 w-full max-w-lg overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary shadow-2xl"
          >
            {/* En-tête */}
            <div className="flex items-start justify-between gap-3 border-b border-navy/[0.06] bg-gradient-to-br from-brand-violet/[0.06] to-brand-cyan/[0.06] px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-da text-white">
                  <Ticket size={20} />
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold text-navy">Nouveau coupon</h2>
                  <p className="text-xs text-text-secondary">
                    Un code de réduction ou une bourse pour vos apprenants.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={pending}
                aria-label="Fermer"
                className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.06] hover:text-navy disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={submit} className="space-y-5 px-6 py-6">
              <Field
                label="Code du coupon"
                htmlFor="coupon-code"
                required
                hint="Au moins 3 caractères. Automatiquement en majuscules, sans espace."
              >
                <Input
                  id="coupon-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  placeholder="RENTREE2026"
                  autoFocus
                  maxLength={40}
                  className="font-mono uppercase tracking-wide"
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Type de réduction" htmlFor="coupon-type" required>
                  <Select
                    value={discountType}
                    onChange={setDiscountType}
                    options={TYPE_OPTIONS}
                    ariaLabel="Type de réduction"
                  />
                </Field>

                <Field
                  label={discountType === "PERCENTAGE" ? "Pourcentage" : "Montant (FCFA)"}
                  htmlFor="coupon-value"
                  required
                >
                  <Input
                    id="coupon-value"
                    type="number"
                    min={1}
                    max={discountType === "PERCENTAGE" ? 100 : undefined}
                    step={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "PERCENTAGE" ? "25" : "10000"}
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Utilisations max."
                  htmlFor="coupon-max"
                  hint="Laissez vide pour un usage illimité."
                >
                  <Input
                    id="coupon-max"
                    type="number"
                    min={1}
                    step={1}
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Illimité"
                  />
                </Field>

                <Field
                  label="Expiration"
                  htmlFor="coupon-expires"
                  hint="Optionnel — sans date, le coupon n'expire pas."
                >
                  <Input
                    id="coupon-expires"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </Field>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-error/20 bg-error/[0.06] px-3.5 py-2.5 text-sm text-error">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={close} disabled={pending}>
                  Annuler
                </Button>
                <Button type="submit" size="sm" loading={pending}>
                  Créer le coupon
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
