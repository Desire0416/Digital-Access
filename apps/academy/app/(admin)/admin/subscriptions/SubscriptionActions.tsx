"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Ban,
  RotateCcw,
  Check,
  X,
  CalendarX,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { Button, cn } from "@da/ui";
import { setSubscriptionStatus } from "@/lib/admin-actions";

type SubStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE";

type ActionDef = {
  next: SubStatus;
  label: string;
  confirmLabel: string;
  icon: React.ReactNode;
  danger: boolean;
};

/* Transitions proposées selon le statut courant. */
const REACTIVATE: ActionDef = {
  next: "ACTIVE",
  label: "Réactiver",
  confirmLabel: "Confirmer la réactivation",
  icon: <RotateCcw size={15} />,
  danger: false,
};
const CANCEL: ActionDef = {
  next: "CANCELLED",
  label: "Annuler",
  confirmLabel: "Confirmer l'annulation",
  icon: <Ban size={15} />,
  danger: true,
};
const MARK_EXPIRED: ActionDef = {
  next: "EXPIRED",
  label: "Marquer expiré",
  confirmLabel: "Confirmer l'expiration",
  icon: <CalendarX size={15} />,
  danger: true,
};
const MARK_PAST_DUE: ActionDef = {
  next: "PAST_DUE",
  label: "Marquer impayé",
  confirmLabel: "Confirmer l'impayé",
  icon: <AlertTriangle size={15} />,
  danger: false,
};

function actionsFor(status: SubStatus): ActionDef[] {
  switch (status) {
    case "ACTIVE":
      return [CANCEL, MARK_PAST_DUE, MARK_EXPIRED];
    case "PAST_DUE":
      return [REACTIVATE, CANCEL, MARK_EXPIRED];
    case "CANCELLED":
      return [REACTIVATE];
    case "EXPIRED":
      return [REACTIVATE];
    default:
      return [];
  }
}

/**
 * Actions sur un abonnement — menu contextuel + confirmation inline.
 * Le menu ne s'affiche que si plusieurs actions sont possibles ; sinon un seul
 * bouton direct. La confirmation reste inline (pas de dialog). En cas d'échec,
 * message rouge inline ; sinon router.refresh().
 */
export function SubscriptionActions({
  id,
  status,
  className,
}: {
  id: string;
  status: SubStatus;
  className?: string;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState<ActionDef | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const wrapRef = React.useRef<HTMLDivElement>(null);

  const actions = actionsFor(status);

  // Ferme le menu au clic extérieur / Échap.
  React.useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (actions.length === 0) {
    return <span className={cn("text-xs italic text-text-muted", className)}>—</span>;
  }

  function run(def: ActionDef) {
    setError(null);
    startTransition(async () => {
      const res = await setSubscriptionStatus(id, def.next);
      if (!res.ok) {
        setError(res.error);
      } else {
        setConfirm(null);
        setMenuOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div ref={wrapRef} className={cn("relative inline-flex flex-col items-end gap-1.5", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {confirm ? (
          /* ── Confirmation inline ── */
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.18 }}
            className="flex flex-wrap items-center justify-end gap-2"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => run(confirm)}
              loading={pending}
              className={cn(confirm.danger && "bg-error hover:bg-error/90")}
            >
              <Check size={15} strokeWidth={2.5} />
              {confirm.confirmLabel}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirm(null)}
              disabled={pending}
            >
              <X size={15} />
              <span className="sr-only sm:not-sr-only">Retour</span>
            </Button>
          </motion.div>
        ) : actions.length === 1 ? (
          /* ── Action unique : bouton direct ── */
          <motion.div
            key="single"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Button
              variant={actions[0].danger ? "outline" : "primary"}
              size="sm"
              onClick={() => setConfirm(actions[0])}
              className={cn(
                actions[0].danger &&
                  "border-error/40 text-error hover:border-error hover:bg-error/5",
              )}
            >
              {actions[0].icon}
              {actions[0].label}
            </Button>
          </motion.div>
        ) : (
          /* ── Plusieurs actions : menu contextuel ── */
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              Gérer
              <ChevronDown
                size={15}
                className={cn("transition-transform", menuOpen && "rotate-180")}
              />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu déroulant des actions (aligné à droite, ne clippe pas la carte) */}
      <AnimatePresence>
        {menuOpen && !confirm && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-navy/[0.09] bg-surface-primary p-1 shadow-2xl"
          >
            {actions.map((a) => (
              <button
                key={a.next}
                type="button"
                role="menuitem"
                onClick={() => {
                  setConfirm(a);
                  setMenuOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                  a.danger
                    ? "text-error hover:bg-error/5"
                    : "text-navy hover:bg-navy/[0.04]",
                )}
              >
                {a.icon}
                {a.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="max-w-[15rem] text-right text-xs font-medium text-error">{error}</p>
      )}
    </div>
  );
}
