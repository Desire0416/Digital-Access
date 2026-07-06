"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Send,
  CheckCircle2,
  Ban,
  Trash2,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Settings2,
} from "lucide-react";
import { cn } from "@da/ui";
import { Select, type SelectOption } from "@/components/Select";
import { INVOICE_STATUS, toneColor } from "@/components/admin/ui";
import { updateInvoiceStatus, deleteInvoice } from "@/lib/admin-actions";
import type { InvoiceStatus } from "@/lib/admin-queries";

/** Options du sélecteur de statut (portail) — pastille colorée par tonalité. */
const STATUS_OPTIONS: SelectOption[] = (
  ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"] as InvoiceStatus[]
).map((s) => ({
  value: s,
  label: INVOICE_STATUS[s]!.label,
  dotColor: toneColor(INVOICE_STATUS[s]!.tone),
}));

/* ══════════════════════════════════════════════════════════════════════════
   Contrôles de cycle de vie d'une facture : Envoyer / Marquer payée / Annuler,
   et suppression définitive (avec confirmation).
   ══════════════════════════════════════════════════════════════════════════ */

type ActionKey = "SENT" | "PAID" | "CANCELLED";

const ACTIONS: {
  key: ActionKey;
  label: string;
  icon: React.ReactNode;
  /** Statuts depuis lesquels l'action est pertinente. */
  from: InvoiceStatus[];
  tone: "primary" | "success" | "muted";
}[] = [
  {
    key: "SENT",
    label: "Envoyer au client",
    icon: <Send className="h-4 w-4" />,
    from: ["DRAFT", "OVERDUE"],
    tone: "primary",
  },
  {
    key: "PAID",
    label: "Marquer payée",
    icon: <CheckCircle2 className="h-4 w-4" />,
    from: ["DRAFT", "SENT", "OVERDUE"],
    tone: "success",
  },
  {
    key: "CANCELLED",
    label: "Annuler la facture",
    icon: <Ban className="h-4 w-4" />,
    from: ["DRAFT", "SENT", "OVERDUE"],
    tone: "muted",
  },
];

export function InvoiceControls({
  id,
  number,
  status,
}: {
  id: string;
  number: string;
  status: InvoiceStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [busyKey, setBusyKey] = React.useState<ActionKey | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const available = ACTIONS.filter((a) => a.from.includes(status));

  const run = (key: ActionKey) => {
    setError(null);
    setBusyKey(key);
    startTransition(async () => {
      const res = await updateInvoiceStatus({ id, status: key });
      setBusyKey(null);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  };

  // Changement de statut libre via le Select (portail).
  const changeStatus = (next: string) => {
    if (next === status) return;
    setError(null);
    startTransition(async () => {
      const res = await updateInvoiceStatus({ id, status: next });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  };

  const remove = () => {
    setError(null);
    setDeleting(true);
    startTransition(async () => {
      const res = await deleteInvoice({ id });
      if (res.ok) {
        router.push("/admin/factures");
      } else {
        setDeleting(false);
        setConfirming(false);
        setError(res.error);
      }
    });
  };

  const toneClasses: Record<(typeof ACTIONS)[number]["tone"], string> = {
    primary:
      "bg-gradient-da text-white shadow-sm hover:opacity-95",
    success:
      "bg-success text-white shadow-sm hover:opacity-95",
    muted:
      "border border-navy/[0.12] bg-surface-primary text-navy hover:bg-navy/[0.04]",
  };

  return (
    <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-da text-white">
            <Settings2 className="h-4 w-4" />
          </span>
          Cycle de vie
        </h2>

        <div className="flex flex-wrap gap-2">
          {available.length === 0 ? (
            <span className="rounded-lg bg-navy/[0.04] px-3 py-2 text-xs font-medium text-text-muted">
              {status === "PAID"
                ? "Facture encaissée — aucune action disponible."
                : "Facture annulée — aucune action disponible."}
            </span>
          ) : (
            available.map((a) => (
              <motion.button
                key={a.key}
                type="button"
                onClick={() => run(a.key)}
                disabled={pending}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all disabled:opacity-50",
                  toneClasses[a.tone],
                )}
              >
                {busyKey === a.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  a.icon
                )}
                {a.label}
              </motion.button>
            ))
          )}
        </div>
      </div>

      {/* Changement de statut libre (portail) */}
      <div className="mt-5 flex flex-col gap-2 border-t border-navy/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-navy">Statut de la facture</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Forcez n’importe quel statut si besoin.
          </p>
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={status}
            onChange={changeStatus}
            options={STATUS_OPTIONS}
            ariaLabel="Statut de la facture"
            disabled={pending}
          />
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 flex items-start gap-1.5 text-xs font-medium text-error"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Zone dangereuse */}
      <div className="mt-5 border-t border-error/15 pt-5">
        <AnimatePresence mode="wait" initial={false}>
          {confirming ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                <AlertTriangle className="h-4 w-4 text-error" />
                Supprimer définitivement la facture {number} ?
              </p>
              <p className="mt-1 text-xs text-text-secondary">
                Cette action est irréversible.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={remove}
                  disabled={pending}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-error px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Oui, supprimer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={pending}
                  className="rounded-lg border border-navy/[0.12] px-3.5 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/[0.04] disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="trigger"
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-error/30 px-3.5 py-2 text-sm font-semibold text-error transition-colors hover:bg-error/10"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer cette facture
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
