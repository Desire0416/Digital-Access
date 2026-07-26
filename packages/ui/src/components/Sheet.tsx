"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "../lib/cn";

/* ══════════════════════════════════════════════════════════════════════════
   Sheet — surface coulissante réutilisable (@da/ui). Factorise le patron des
   tiroirs déjà présents (header Academy à droite, AdminShell à gauche) et
   AJOUTE la variante `bottom` (bottom-sheet façon app), qui manquait partout.

   - Rendu via `createPortal(document.body)` : indispensable car un ancêtre en
     `backdrop-blur`/`transform` (nos en-têtes) créerait un containing-block qui
     casserait le `position: fixed`.
   - Verrou du scroll body, fermeture Échap + clic sur l'overlay, safe-area en
     bas pour la variante `bottom`, respect de prefers-reduced-motion.
   ══════════════════════════════════════════════════════════════════════════ */

type SheetSide = "right" | "left" | "bottom";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: SheetSide;
  /** Libellé accessible du dialogue. */
  label?: string;
  className?: string;
  children: React.ReactNode;
}

const OFFSCREEN: Record<SheetSide, { x: string | number; y: string | number }> = {
  right: { x: "100%", y: 0 },
  left: { x: "-100%", y: 0 },
  bottom: { x: 0, y: "100%" },
};

const PANEL_POS: Record<SheetSide, string> = {
  right: "inset-y-0 right-0 h-full w-[min(22rem,88vw)] rounded-l-2xl",
  left: "inset-y-0 left-0 h-full w-[min(22rem,88vw)] rounded-r-2xl",
  bottom: "inset-x-0 bottom-0 max-h-[88dvh] w-full rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
};

export function Sheet({ open, onClose, side = "right", label, className, children }: SheetProps) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const hidden = reduce ? { opacity: 0 } : OFFSCREEN[side];
  const shown = reduce ? { opacity: 1 } : { x: 0, y: 0 };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={label}>
          <motion.button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            className="absolute inset-0 h-full w-full bg-navy/45 backdrop-blur-sm"
          />
          <motion.div
            initial={hidden}
            animate={shown}
            exit={hidden}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 34 }}
            className={cn(
              "absolute flex flex-col overflow-hidden bg-surface-primary shadow-2xl",
              PANEL_POS[side],
              className,
            )}
          >
            {side === "bottom" && (
              <span className="mx-auto mt-2.5 h-1.5 w-11 shrink-0 rounded-full bg-navy/15" aria-hidden />
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
