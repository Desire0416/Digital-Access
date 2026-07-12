"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Utilitaires client des constructeurs admin : exécution d'une Server Action
   avec état de chargement + retour visuel, et bouton de suppression à
   confirmation. Après succès, router.refresh() recharge les Server Components.
   ══════════════════════════════════════════════════════════════════════════ */

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };
type Msg = { ok: boolean; text: string } | null;

export function useAdminAction() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [msg, setMsg] = React.useState<Msg>(null);

  const run = React.useCallback(
    (fn: () => Promise<ActionResult>, opts?: { onOk?: () => void; silent?: boolean }) => {
      startTransition(async () => {
        const res = await fn();
        if (res.ok) {
          if (!opts?.silent) setMsg({ ok: true, text: res.message ?? "Enregistré." });
          router.refresh();
          opts?.onOk?.();
        } else {
          setMsg({ ok: false, text: res.error });
        }
        window.setTimeout(() => setMsg(null), 3200);
      });
    },
    [router],
  );

  return { pending, msg, setMsg, run };
}

export function Feedback({ msg, className }: { msg: Msg; className?: string }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={cn("text-xs font-medium", msg.ok ? "text-success" : "text-error", className)}
        >
          {msg.text}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export function SaveButton({
  pending,
  children = "Enregistrer",
  className,
  onClick,
  type = "button",
}: {
  pending: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={pending}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg bg-gradient-da px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] disabled:opacity-60",
        className,
      )}
    >
      {pending && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

/** Bouton de suppression : premier clic arme, second clic (dans 3 s) confirme. */
export function DeleteButton({
  onConfirm,
  pending,
  label = "Supprimer",
  compact,
}: {
  onConfirm: () => void;
  pending?: boolean;
  label?: string;
  compact?: boolean;
}) {
  const [armed, setArmed] = React.useState(false);
  React.useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(t);
  }, [armed]);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (armed) {
          onConfirm();
          setArmed(false);
        } else {
          setArmed(true);
        }
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
        armed
          ? "border-error bg-error/10 text-error"
          : "border-navy/10 text-text-secondary hover:border-error/30 hover:text-error",
      )}
      title={label}
    >
      {pending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      {!compact && (armed ? "Confirmer ?" : label)}
    </button>
  );
}
