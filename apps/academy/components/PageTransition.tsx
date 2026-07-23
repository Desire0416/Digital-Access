"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

/* ══════════════════════════════════════════════════════════════════════════
   Transition de page signature DA — fondu + glissement 8px (0,3 s) à l'ENTRÉE.
   On anime seulement la page qui entre (remontage via key={pathname}), SANS
   AnimatePresence `mode="wait"` : garder l'arbre sortant (un Server Component)
   pendant une navigation App Router provoquait une erreur de hooks React
   (#310, « must refresh »). Respecte prefers-reduced-motion.
   ══════════════════════════════════════════════════════════════════════════ */

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.3, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
