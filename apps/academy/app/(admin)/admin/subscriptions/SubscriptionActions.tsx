"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Ban, RotateCcw, Check, X } from "lucide-react";
import { Button, cn } from "@da/ui";
import { setSubscriptionStatus } from "@/lib/admin-actions";

type SubStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE";

/**
 * Actions sur un abonnement — confirmation inline, pas de dialog.
 * ACTIVE → « Annuler » (CANCELLED). CANCELLED/EXPIRED → « Réactiver » (ACTIVE).
 * Renvoie {ok,error} : en cas d'échec, message rouge inline ; sinon router.refresh().
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
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  // Détermine l'action disponible selon le statut courant.
  const action: null | {
    next: SubStatus;
    label: string;
    confirmLabel: string;
    icon: React.ReactNode;
    danger: boolean;
  } =
    status === "ACTIVE"
      ? {
          next: "CANCELLED",
          label: "Annuler",
          confirmLabel: "Confirmer l'annulation",
          icon: <Ban size={15} />,
          danger: true,
        }
      : status === "CANCELLED" || status === "EXPIRED"
        ? {
            next: "ACTIVE",
            label: "Réactiver",
            confirmLabel: "Confirmer la réactivation",
            icon: <RotateCcw size={15} />,
            danger: false,
          }
        : null;

  // PAST_DUE : aucune action directe proposée.
  if (!action) {
    return <span className={cn("text-xs italic text-text-muted", className)}>—</span>;
  }

  function run(next: SubStatus) {
    setError(null);
    startTransition(async () => {
      const res = await setSubscriptionStatus(id, next);
      if (!res.ok) {
        setError(res.error);
      } else {
        setConfirming(false);
        router.refresh();
      }
    });
  }

  return (
    <div className={cn("inline-flex flex-col items-end gap-1.5", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {confirming ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2"
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => run(action.next)}
              loading={pending}
              className={cn(
                action.danger && "bg-error hover:bg-error/90",
              )}
            >
              <Check size={15} strokeWidth={2.5} />
              {action.confirmLabel}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              <X size={15} />
              <span className="sr-only sm:not-sr-only">Annuler</span>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Button
              variant={action.danger ? "outline" : "primary"}
              size="sm"
              onClick={() => setConfirming(true)}
              className={cn(
                action.danger &&
                  "border-error/40 text-error hover:bg-error/5 hover:border-error",
              )}
            >
              {action.icon}
              {action.label}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="max-w-[15rem] text-right text-xs font-medium text-error">{error}</p>
      )}
    </div>
  );
}
