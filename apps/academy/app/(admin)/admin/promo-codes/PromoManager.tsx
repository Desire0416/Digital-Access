"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgePercent,
  CalendarClock,
  Infinity as InfinityIcon,
  Pencil,
  Plus,
  Power,
  Tag,
  Ticket,
  Trash2,
  X,
} from "lucide-react";
import {
  Button,
  Field,
  Input,
  cn,
  formatFCFA,
  formatDate,
} from "@da/ui";
import {
  createPromoCode,
  updatePromoCode,
  togglePromoCode,
  deletePromoCode,
} from "@/lib/admin-actions";
import type { AdminPromoCode } from "@/lib/admin-queries";
import { EmptyState } from "@/components/admin/ui";

/* ══════════════════════════════════════════════════════════════════════════
   PromoManager — un seul composant, deux points de montage :
     slot="header" → le bouton « Nouveau code » (dans AdminPageHeader)
     slot="list"   → la liste (tableau desktop + cartes mobile) + dialogues
   La page reste un Server Component qui fetch les données ; toute
   l'interactivité (dialogues, toggle, suppression) vit ici.
   ══════════════════════════════════════════════════════════════════════════ */

type DiscountType = "PERCENTAGE" | "FIXED";

type FormState = {
  code: string;
  discountType: DiscountType;
  discountValue: string;
  maxUses: string;
  expiresAt: string;
  active: boolean;
};

/** Formate une Date (ou null) en "YYYY-MM-DD" pour un <input type="date">. */
function toDateInput(d: Date | null): string {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toForm(code?: AdminPromoCode): FormState {
  return {
    code: code?.code ?? "",
    discountType: (code?.discountType as DiscountType) ?? "PERCENTAGE",
    discountValue: code ? String(code.discountValue) : "",
    maxUses: code?.maxUses != null ? String(code.maxUses) : "",
    expiresAt: toDateInput(code?.expiresAt ?? null),
    active: code?.active ?? true,
  };
}

/** Libellé de réduction : "20 %" ou "5 000 FCFA". */
function discountLabel(type: string, value: number): string {
  return type === "PERCENTAGE" ? `${value} %` : formatFCFA(value);
}

export function PromoManager({
  codes,
  slot,
}: {
  codes: AdminPromoCode[];
  slot: "header" | "list";
}) {
  if (slot === "header") return <CreateButton />;
  return <PromoList codes={codes} />;
}

/* ───────────────────────── Bouton d'en-tête ─────────────────────────────── */

function CreateButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg"
      >
        <Plus size={16} strokeWidth={2.5} />
        Nouveau code
      </motion.button>

      <AnimatePresence>
        {open && <PromoDialog mode="create" onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

/* ──────────────────────────────── La liste ──────────────────────────────── */

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function PromoList({ codes }: { codes: AdminPromoCode[] }) {
  if (codes.length === 0) {
    return (
      <EmptyState
        icon={<Ticket size={22} />}
        title="Aucun code promo pour l'instant"
        description="Créez votre premier code de réduction pour offrir un pourcentage ou un montant fixe sur les cours et abonnements Academy."
      />
    );
  }

  return (
    <>
      {/* ── Desktop : tableau (≥ lg) ── */}
      <section className="hidden overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-navy/[0.08] text-xs font-semibold uppercase tracking-wide text-text-muted">
                <th className="px-5 py-3.5 font-semibold">Code</th>
                <th className="px-5 py-3.5 font-semibold">Réduction</th>
                <th className="px-5 py-3.5 font-semibold">Utilisation</th>
                <th className="px-5 py-3.5 font-semibold">Expiration</th>
                <th className="px-5 py-3.5 font-semibold">Statut</th>
                <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <motion.tbody variants={container} initial="hidden" animate="show">
              {codes.map((code) => (
                <PromoRow key={code.id} code={code} />
              ))}
            </motion.tbody>
          </table>
        </div>
      </section>

      {/* ── Mobile / tablette : cartes empilées (< lg) ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:hidden"
      >
        {codes.map((code) => (
          <PromoCard key={code.id} code={code} />
        ))}
      </motion.div>
    </>
  );
}

/* ─────────────────────── Sous-éléments réutilisables ─────────────────────── */

/** Badge du code en font-mono majuscule sur fond léger. */
function CodeBadge({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-violet/[0.08] px-2.5 py-1 font-mono text-sm font-bold uppercase tracking-wide text-brand-violet">
      <Tag size={13} strokeWidth={2.5} />
      {code}
    </span>
  );
}

/** Réduction : pastille dégradée pour un % ou fond neutre pour un montant. */
function DiscountBadge({ type, value }: { type: string; value: number }) {
  if (type === "PERCENTAGE") {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-da px-2.5 py-1 text-xs font-semibold text-white">
        <BadgePercent size={12} strokeWidth={2.5} />
        {value} %
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-cyan/15 px-2.5 py-1 text-xs font-semibold text-[#0891a6]">
      {formatFCFA(value)}
    </span>
  );
}

/** Utilisation + barre de progression dégradée si un plafond est fixé. */
function UsageMeter({
  currentUses,
  maxUses,
}: {
  currentUses: number;
  maxUses: number | null;
}) {
  const pct =
    maxUses && maxUses > 0
      ? Math.min(100, Math.round((currentUses / maxUses) * 100))
      : null;

  return (
    <div className="min-w-[7rem] max-w-[11rem]">
      <div className="flex items-center gap-1.5 text-sm font-medium text-navy">
        <span className="tabular-nums">{currentUses}</span>
        <span className="text-text-muted">/</span>
        {maxUses != null ? (
          <span className="tabular-nums">{maxUses}</span>
        ) : (
          <InfinityIcon size={15} className="text-text-muted" aria-label="illimité" />
        )}
      </div>
      {pct != null && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-navy/[0.08]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
        </div>
      )}
    </div>
  );
}

/** Expiration : date formatée ou « Sans limite ». */
function ExpiryLabel({ expiresAt }: { expiresAt: Date | null }) {
  if (!expiresAt) {
    return <span className="text-sm text-text-muted">Sans limite</span>;
  }
  const expired = new Date(expiresAt).getTime() < Date.now();
  return (
    <span
      className={cn(
        "whitespace-nowrap text-sm",
        expired ? "font-medium text-error" : "text-text-secondary",
      )}
    >
      {formatDate(expiresAt)}
    </span>
  );
}

/* ─────────────────────── Toggle actif / inactif ─────────────────────────── */

function ActiveToggle({ code }: { code: AdminPromoCode }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function handleToggle() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await togglePromoCode(code.id, !code.active);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <motion.button
        type="button"
        role="switch"
        aria-checked={code.active}
        aria-label={code.active ? "Désactiver le code" : "Activer le code"}
        onClick={handleToggle}
        disabled={pending}
        whileTap={pending ? undefined : { scale: 0.94 }}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          code.active ? "bg-gradient-da" : "bg-navy/15",
        )}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow-sm",
            code.active ? "ml-[22px]" : "ml-0.5",
          )}
        />
      </motion.button>
      <span
        className={cn(
          "text-xs font-semibold",
          code.active ? "text-success" : "text-text-muted",
        )}
      >
        {code.active ? "Actif" : "Inactif"}
      </span>
      {error && (
        <span className="max-w-[10rem] text-xs font-medium text-error">{error}</span>
      )}
    </div>
  );
}

/* ─────────────────────────── Ligne de tableau ───────────────────────────── */

function PromoRow({ code }: { code: AdminPromoCode }) {
  const [editing, setEditing] = React.useState(false);

  return (
    <motion.tr
      variants={itemVariant}
      className="border-b border-navy/[0.05] transition-colors last:border-0 hover:bg-surface-secondary/70"
    >
      <td className="px-5 py-4 align-middle">
        <CodeBadge code={code.code} />
      </td>
      <td className="px-5 py-4 align-middle">
        <DiscountBadge type={code.discountType} value={code.discountValue} />
      </td>
      <td className="px-5 py-4 align-middle">
        <UsageMeter currentUses={code.currentUses} maxUses={code.maxUses} />
      </td>
      <td className="px-5 py-4 align-middle">
        <ExpiryLabel expiresAt={code.expiresAt} />
      </td>
      <td className="px-5 py-4 align-middle">
        <ActiveToggle code={code} />
      </td>
      <td className="px-5 py-4 align-middle">
        <div className="flex items-center justify-end gap-1.5">
          <motion.button
            type="button"
            onClick={() => setEditing(true)}
            whileTap={{ scale: 0.9 }}
            className="grid h-8 w-8 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-brand-violet/10 hover:text-brand-violet"
            aria-label={`Éditer ${code.code}`}
          >
            <Pencil size={15} />
          </motion.button>
          <DeleteButton code={code} />
        </div>
      </td>

      <AnimatePresence>
        {editing && (
          <PromoDialogPortal>
            <PromoDialog mode="edit" code={code} onClose={() => setEditing(false)} />
          </PromoDialogPortal>
        )}
      </AnimatePresence>
    </motion.tr>
  );
}

/* Un dialogue rendu depuis une <tr> doit sortir du flux du tableau : on le
   place dans une cellule pleine largeur pour rester du HTML valide. */
function PromoDialogPortal({ children }: { children: React.ReactNode }) {
  return (
    <tr aria-hidden>
      <td colSpan={6} className="p-0">
        {children}
      </td>
    </tr>
  );
}

/* ─────────────────────────── Carte (mobile) ─────────────────────────────── */

function PromoCard({ code }: { code: AdminPromoCode }) {
  const [editing, setEditing] = React.useState(false);

  return (
    <motion.article
      variants={itemVariant}
      className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-shadow hover:shadow-lg sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <CodeBadge code={code.code} />
        <DiscountBadge type={code.discountType} value={code.discountValue} />
      </div>

      <dl className="mt-4 space-y-3 border-t border-navy/[0.06] pt-4">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Utilisation
          </dt>
          <dd>
            <UsageMeter currentUses={code.currentUses} maxUses={code.maxUses} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
            Expiration
          </dt>
          <dd>
            <ExpiryLabel expiresAt={code.expiresAt} />
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-navy/[0.06] pt-4">
        <ActiveToggle code={code} />
        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            onClick={() => setEditing(true)}
            whileTap={{ scale: 0.9 }}
            className="grid h-9 w-9 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-brand-violet/10 hover:text-brand-violet"
            aria-label={`Éditer ${code.code}`}
          >
            <Pencil size={16} />
          </motion.button>
          <DeleteButton code={code} />
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <PromoDialog mode="edit" code={code} onClose={() => setEditing(false)} />
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/* ─────────────────── Suppression (confirmation inline) ──────────────────── */

function DeleteButton({ code }: { code: AdminPromoCode }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deletePromoCode(code.id);
      if (!res.ok) {
        setError(res.error);
        setConfirming(false);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        whileTap={{ scale: 0.9 }}
        className="grid h-8 w-8 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-error/10 hover:text-error sm:h-9 sm:w-9"
        aria-label={`Supprimer ${code.code}`}
      >
        <Trash2 size={15} />
      </motion.button>

      {error && (
        <span className="ml-2 rounded-lg bg-error/10 px-2.5 py-1.5 text-xs font-medium text-error">
          {error}
        </span>
      )}

      <AnimatePresence>
        {confirming && (
          <ConfirmDialog
            title={`Supprimer « ${code.code} » ?`}
            body="Cette action est définitive. Un code déjà utilisé lors d'un paiement ne pourra pas être supprimé — désactivez-le plutôt."
            confirmLabel="Supprimer"
            pending={pending}
            onCancel={() => setConfirming(false)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════ Coque de dialogue brandée ══════════════════════ */

function DialogShell({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-lg rounded-t-2xl border border-navy/[0.07] bg-surface-primary shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-navy/[0.06] px-6 py-4">
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-da text-white">
                {icon}
              </span>
            )}
            <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-text-secondary transition-colors hover:bg-navy/[0.06] hover:text-navy"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────── Dialogue création / édition ────────────────────────── */

function PromoDialog({
  mode,
  code,
  onClose,
}: {
  mode: "create" | "edit";
  code?: AdminPromoCode;
  onClose: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = React.useState<FormState>(() => toForm(code));
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isPercentage = form.discountType === "PERCENTAGE";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);

    const trimmedCode = form.code.trim().toUpperCase();
    const value = Number(form.discountValue);
    if (!Number.isFinite(value) || value < 1) {
      setError("Renseignez une valeur de réduction valide.");
      return;
    }
    if (isPercentage && value > 100) {
      setError("Un pourcentage ne peut pas dépasser 100.");
      return;
    }

    const maxUsesTrimmed = form.maxUses.trim();
    const maxUses =
      maxUsesTrimmed === "" ? null : Math.trunc(Number(maxUsesTrimmed));
    if (maxUses != null && (!Number.isFinite(maxUses) || maxUses < 1)) {
      setError("Le plafond d'utilisations doit être un entier positif.");
      return;
    }

    const payload = {
      code: trimmedCode,
      discountType: form.discountType,
      discountValue: Math.trunc(value),
      maxUses,
      expiresAt: form.expiresAt || "",
      active: form.active,
    };

    startTransition(async () => {
      const res =
        mode === "create"
          ? await createPromoCode(payload)
          : await updatePromoCode(code!.id, payload);
      if (!res.ok) {
        setError(res.error);
      } else {
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <DialogShell
      title={mode === "create" ? "Nouveau code promo" : "Modifier le code"}
      icon={mode === "create" ? <Ticket size={18} /> : <Pencil size={18} />}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
        {/* Aperçu du code */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy/[0.07] bg-surface-secondary p-3">
          <CodeBadge code={form.code.trim() || "CODE"} />
          <DiscountBadge
            type={form.discountType}
            value={Number(form.discountValue) || 0}
          />
        </div>

        <Field label="Code" htmlFor="promo-code" required hint="Lettres, chiffres, - et _">
          <Input
            id="promo-code"
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="BIENVENUE20"
            maxLength={24}
            required
            autoFocus
            className="font-mono uppercase tracking-wide"
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Type de réduction" htmlFor="promo-type" required>
            <select
              id="promo-type"
              value={form.discountType}
              onChange={(e) => set("discountType", e.target.value as DiscountType)}
              className="h-11 w-full rounded-lg border border-navy/15 bg-surface-primary px-3 text-sm text-navy outline-none transition-colors focus:border-brand-violet focus:ring-2 focus:ring-brand-violet/20"
            >
              <option value="PERCENTAGE">Pourcentage (%)</option>
              <option value="FIXED">Montant fixe (FCFA)</option>
            </select>
          </Field>

          <Field
            label="Valeur"
            htmlFor="promo-value"
            required
            hint={isPercentage ? "Entre 1 et 100" : "En FCFA"}
          >
            <div className="relative">
              <Input
                id="promo-value"
                type="number"
                inputMode="numeric"
                value={form.discountValue}
                onChange={(e) => set("discountValue", e.target.value)}
                placeholder={isPercentage ? "20" : "5000"}
                min={1}
                max={isPercentage ? 100 : undefined}
                step={1}
                required
                className="pr-14"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-text-muted">
                {isPercentage ? "%" : "FCFA"}
              </span>
            </div>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label="Utilisations max"
            htmlFor="promo-max"
            hint="Vide = illimité"
          >
            <Input
              id="promo-max"
              type="number"
              inputMode="numeric"
              value={form.maxUses}
              onChange={(e) => set("maxUses", e.target.value)}
              placeholder="Illimité"
              min={1}
              step={1}
            />
          </Field>

          <Field label="Date d'expiration" htmlFor="promo-expires" hint="Optionnel">
            <Input
              id="promo-expires"
              type="date"
              value={form.expiresAt}
              onChange={(e) => set("expiresAt", e.target.value)}
            />
          </Field>
        </div>

        {/* Actif */}
        <label
          htmlFor="promo-active"
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-navy/[0.07] bg-surface-secondary p-3.5"
        >
          <span className="relative flex items-center">
            <input
              id="promo-active"
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                form.active ? "bg-gradient-da" : "bg-navy/15",
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                  form.active ? "translate-x-[22px]" : "translate-x-0.5",
                )}
              />
            </span>
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-navy">
              <Power size={14} strokeWidth={2.5} />
              Code actif
            </span>
            <span className="mt-0.5 block text-xs text-text-secondary">
              Un code inactif ne peut pas être appliqué au paiement.
            </span>
          </span>
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-error/10 px-3 py-2.5 text-sm font-medium text-error"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Annuler
          </Button>
          <motion.button
            type="submit"
            disabled={pending}
            whileHover={pending ? undefined : { scale: 1.02 }}
            whileTap={pending ? undefined : { scale: 0.97 }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-da px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending
              ? "Enregistrement…"
              : mode === "create"
                ? "Créer le code"
                : "Enregistrer"}
          </motion.button>
        </div>
      </form>
    </DialogShell>
  );
}

/* ───────────────── Dialogue de confirmation (suppression) ───────────────── */

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <DialogShell title={title} icon={<Trash2 size={18} />} onClose={onCancel}>
      <div className="px-6 py-5">
        <p className="text-sm text-text-secondary">{body}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Annuler
          </Button>
          <motion.button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            whileHover={pending ? undefined : { scale: 1.02 }}
            whileTap={pending ? undefined : { scale: 0.97 }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-error px-6 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={15} />
            {pending ? "Suppression…" : confirmLabel}
          </motion.button>
        </div>
      </div>
    </DialogShell>
  );
}
