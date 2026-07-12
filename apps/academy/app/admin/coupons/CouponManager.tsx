"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Plus, Trash2, Power, Loader2, Percent, Wallet, Check, AlertCircle } from "lucide-react";
import { cn } from "@da/ui";
import { Select } from "@/components/Select";
import { EmptyState } from "@/components/EmptyState";
import { AdminCard, StatusPill, type PillTone } from "@/components/admin/ui";
import { formatFCFA } from "@/lib/site";
import { createCoupon, toggleCoupon, deleteCoupon } from "@/lib/coupon-actions";
import type { CouponRow } from "@/lib/coupons";

/* ══════════════════════════════════════════════════════════════════════════
   Gestion des coupons (cahier §27.2 / §30.1). Création + tableau avec statut
   calculé (Actif / Inactif / Expiré / Épuisé) et actions activer/désactiver /
   supprimer. Style DA, micro-interactions Framer Motion, états de chargement.
   ══════════════════════════════════════════════════════════════════════════ */

type DiscountType = "PERCENT" | "FIXED";

type Flash = { ok: boolean; text: string } | null;

/** Statut d'affichage dérivé de l'état du coupon (ordre de priorité). */
function couponStatus(c: CouponRow): { label: string; tone: PillTone } {
  if (!c.active) return { label: "Inactif", tone: "neutral" };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < Date.now()) return { label: "Expiré", tone: "warning" };
  if (c.maxUses != null && c.usedCount >= c.maxUses) return { label: "Épuisé", tone: "danger" };
  return { label: "Actif", tone: "success" };
}

function formatDiscount(c: CouponRow): string {
  return c.discountType === "PERCENT" ? `−${c.value} %` : `−${formatFCFA(c.value)}`;
}

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const inputCls =
  "h-11 w-full rounded-xl border border-navy/[0.12] bg-surface-primary px-3.5 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-vif/60";

export function CouponManager({ coupons }: { coupons: CouponRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
      <CreateForm />
      <CouponList coupons={coupons} />
    </div>
  );
}

/* ─── Formulaire de création ───────────────────────────────────────────────── */

function CreateForm() {
  const [pending, startTransition] = React.useTransition();
  const [flash, setFlash] = React.useState<Flash>(null);

  const [code, setCode] = React.useState("");
  const [discountType, setDiscountType] = React.useState<DiscountType>("PERCENT");
  const [value, setValue] = React.useState("");
  const [maxUses, setMaxUses] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");

  function reset() {
    setCode("");
    setValue("");
    setMaxUses("");
    setExpiresAt("");
    setDiscountType("PERCENT");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setFlash(null);

    const numValue = Number(value);
    if (!code.trim() || code.trim().length < 3) {
      setFlash({ ok: false, text: "Le code doit contenir au moins 3 caractères." });
      return;
    }
    if (!Number.isFinite(numValue) || numValue < 1) {
      setFlash({ ok: false, text: "Indiquez une valeur de remise valide." });
      return;
    }
    if (discountType === "PERCENT" && numValue > 100) {
      setFlash({ ok: false, text: "Un pourcentage doit être compris entre 1 et 100." });
      return;
    }

    startTransition(async () => {
      const res = await createCoupon({
        code: code.trim(),
        discountType,
        value: Math.round(numValue),
        maxUses: maxUses.trim() ? Math.round(Number(maxUses)) : null,
        expiresAt: expiresAt.trim() ? expiresAt : null,
      });
      if (res.ok) {
        setFlash({ ok: true, text: res.message ?? "Coupon créé." });
        reset();
      } else {
        setFlash({ ok: false, text: res.error });
      }
    });
  }

  return (
    <AdminCard className="h-fit p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-da text-white shadow-sm" aria-hidden>
          <Ticket size={17} />
        </span>
        <div>
          <h2 className="font-display text-base font-bold text-navy">Nouveau coupon</h2>
          <p className="text-xs text-text-muted">Pourcentage ou montant fixe</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="coupon-code" className="mb-1.5 block text-sm font-medium text-navy">
            Code
          </label>
          <input
            id="coupon-code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="BIENVENUE10"
            autoComplete="off"
            spellCheck={false}
            className={cn(inputCls, "font-mono uppercase tracking-wide")}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-navy">Type de remise</span>
          <Select
            value={discountType}
            onChange={(v) => setDiscountType(v as DiscountType)}
            ariaLabel="Type de remise"
            options={[
              { value: "PERCENT", label: "Pourcentage (%)", icon: <Percent size={15} /> },
              { value: "FIXED", label: "Montant fixe (FCFA)", icon: <Wallet size={15} /> },
            ]}
          />
        </div>

        <div>
          <label htmlFor="coupon-value" className="mb-1.5 block text-sm font-medium text-navy">
            {discountType === "PERCENT" ? "Pourcentage de réduction" : "Montant de la réduction (FCFA)"}
          </label>
          <div className="relative">
            <input
              id="coupon-value"
              type="number"
              inputMode="numeric"
              min={1}
              max={discountType === "PERCENT" ? 100 : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={discountType === "PERCENT" ? "10" : "5000"}
              className={cn(inputCls, "pr-12")}
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">
              {discountType === "PERCENT" ? "%" : "FCFA"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="coupon-maxuses" className="mb-1.5 block text-sm font-medium text-navy">
              Limite d'usages
            </label>
            <input
              id="coupon-maxuses"
              type="number"
              inputMode="numeric"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="illimité"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="coupon-expires" className="mb-1.5 block text-sm font-medium text-navy">
              Expiration
            </label>
            <input
              id="coupon-expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        <AnimatePresence>
          {flash && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
                flash.ok ? "bg-success/[0.08] text-success" : "bg-error/[0.06] text-error",
              )}
            >
              {flash.ok ? <Check size={14} /> : <AlertCircle size={14} />}
              {flash.text}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={pending}
          whileHover={{ scale: pending ? 1 : 1.02 }}
          whileTap={{ scale: pending ? 1 : 0.98 }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-60"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Créer le coupon
        </motion.button>
      </form>
    </AdminCard>
  );
}

/* ─── Liste des coupons ────────────────────────────────────────────────────── */

function CouponList({ coupons }: { coupons: CouponRow[] }) {
  if (coupons.length === 0) {
    return (
      <EmptyState
        icon={<Ticket size={40} className="text-text-muted opacity-50" />}
        title="Aucun coupon"
        description="Créez votre premier code promotionnel pour offrir des réductions au moment du paiement."
      />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">
        {coupons.length} coupon{coupons.length > 1 ? "s" : ""}
      </p>
      <AnimatePresence initial={false}>
        {coupons.map((c) => (
          <motion.div
            key={c.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <CouponItem coupon={c} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function CouponItem({ coupon }: { coupon: CouponRow }) {
  const [pending, startTransition] = React.useTransition();
  const [flash, setFlash] = React.useState<Flash>(null);
  const status = couponStatus(coupon);

  const usage =
    coupon.maxUses != null ? `${coupon.usedCount} / ${coupon.maxUses}` : `${coupon.usedCount} · illimité`;

  function toggle() {
    setFlash(null);
    startTransition(async () => {
      const res = await toggleCoupon(coupon.id);
      if (!res.ok) setFlash({ ok: false, text: res.error });
    });
  }

  function remove() {
    setFlash(null);
    if (!window.confirm(`Supprimer définitivement le coupon « ${coupon.code} » ?`)) return;
    startTransition(async () => {
      const res = await deleteCoupon(coupon.id);
      if (!res.ok) setFlash({ ok: false, text: res.error });
    });
  }

  return (
    <AdminCard className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-sm",
            coupon.discountType === "PERCENT" ? "bg-gradient-da" : "bg-gradient-to-br from-accent to-brand-violet",
          )}
          aria-hidden
        >
          {coupon.discountType === "PERCENT" ? <Percent size={18} /> : <Wallet size={18} />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-mono text-sm font-bold uppercase tracking-wide text-navy">{coupon.code}</p>
            <span className="rounded-md bg-brand-blue-vif/10 px-1.5 py-0.5 text-[11px] font-bold text-brand-blue-royal">
              {formatDiscount(coupon)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
            <span>Usages : {usage}</span>
            {coupon.expiresAt && <span>· Expire le {dateFmt.format(new Date(coupon.expiresAt))}</span>}
            <span>· Créé le {dateFmt.format(new Date(coupon.createdAt))}</span>
          </div>
          {flash && !flash.ok && <p className="mt-1.5 text-xs text-error">{flash.text}</p>}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 sm:flex-col sm:items-end">
          <StatusPill label={status.label} tone={status.tone} />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggle}
              disabled={pending}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60",
                coupon.active
                  ? "border-warning/30 text-[#b45309] hover:bg-warning/[0.06]"
                  : "border-success/25 text-success hover:bg-success/[0.06]",
              )}
            >
              {pending ? <Loader2 size={13} className="animate-spin" /> : <Power size={13} />}
              {coupon.active ? "Désactiver" : "Activer"}
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              aria-label={`Supprimer le coupon ${coupon.code}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-error/25 px-2.5 py-1.5 text-xs font-semibold text-error transition-colors hover:bg-error/[0.06] disabled:opacity-60"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </AdminCard>
  );
}
