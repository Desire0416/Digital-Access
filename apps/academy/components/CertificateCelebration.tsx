"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Award, Download, X } from "lucide-react";
import { Monogram, buttonClasses, cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Célébration de certificat — overlay branché à la complétion d'un cours (100%).
   Confetti maison aux couleurs DA (respecte prefers-reduced-motion), monogramme
   animé, liens vers le certificat + PDF. Rendu via portail (hors transforms).
   ══════════════════════════════════════════════════════════════════════════ */

const CONFETTI_COLORS = ["#5B3FA8", "#2B5CC6", "#1E8FE1", "#00BCD4", "#7C3AED", "#F59E0B"];

/** Positions/teintes déterministes-ish générées une fois au montage. */
function useConfetti(count: number) {
  return React.useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2.4 + Math.random() * 1.6,
        rotate: Math.random() * 720 - 360,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        drift: Math.random() * 60 - 30,
        round: Math.random() > 0.5,
      })),
    [count],
  );
}

function Confetti() {
  const pieces = useConfetti(70);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: "-12%", x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: "112%", x: p.drift, opacity: [1, 1, 0.9, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn", repeat: Infinity }}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.4,
            borderRadius: p.round ? "9999px" : "2px",
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}

export function CertificateCelebration({
  code,
  courseTitle,
  onClose,
}: {
  code: string | null;
  courseTitle: string;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Verrouille le défilement de l'arrière-plan pendant l'affichage.
  React.useEffect(() => {
    if (!code) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [code, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {code && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Voile */}
          <motion.button
            type="button"
            aria-label="Fermer"
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {!reduce && <Confetti />}

          {/* Carte */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Certificat obtenu"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-surface-primary p-8 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/5 hover:text-navy"
            >
              <X size={18} />
            </button>

            {/* Sceau animé */}
            <motion.div
              initial={reduce ? false : { scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
              className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand"
            >
              <Award size={38} />
            </motion.div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-brand-violet">
              Félicitations !
            </p>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-navy">
              Cours terminé 🎓
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              Vous avez complété <span className="font-semibold text-navy">« {courseTitle} »</span>{" "}
              à 100 % et décroché votre certificat de réussite, vérifiable en ligne.
            </p>

            <div className="mt-7 flex flex-col gap-2.5">
              <Link
                href="/certificates"
                onClick={onClose}
                className={cn(buttonClasses({ variant: "primary", size: "md" }), "w-full gap-2")}
              >
                <Monogram variant="white" size={17} />
                Voir mon certificat
              </Link>
              <div className="flex gap-2.5">
                <a
                  href={`/api/certificates/${code}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonClasses({ variant: "outline", size: "md" }), "flex-1 gap-2")}
                >
                  <Download size={16} />
                  PDF
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(buttonClasses({ variant: "ghost", size: "md" }), "flex-1")}
                >
                  Continuer
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
