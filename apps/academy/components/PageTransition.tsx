"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/* ══════════════════════════════════════════════════════════════════════════
   Transition de page signature DA — fondu + glissement 8px (0,3 s).
   Respecte prefers-reduced-motion (aucun déplacement, fondu quasi nul).
   ══════════════════════════════════════════════════════════════════════════ */

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduce ? { opacity: 1 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? { opacity: 1 } : { opacity: 0, y: -8 }}
        transition={{ duration: reduce ? 0 : 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
