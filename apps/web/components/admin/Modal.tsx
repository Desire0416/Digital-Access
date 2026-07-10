"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@da/ui";

/**
 * Modale brandée DA rendue en portail (jamais clippée par overflow). Ferme au
 * clic sur le fond, à Échap, et via le bouton ✕. Respecte prefers-reduced-motion
 * (Framer). `size` contrôle la largeur max.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  footer?: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const maxW = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <motion.button
            type="button"
            aria-label="Fermer"
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-navy/50 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={cn(
              "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface-primary shadow-2xl sm:rounded-2xl",
              maxW,
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-navy/[0.06] px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-text-secondary">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.06] hover:text-navy"
              >
                <X size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
            {footer && <div className="border-t border-navy/[0.06] px-5 py-4 sm:px-6">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
