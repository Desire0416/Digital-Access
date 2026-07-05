"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * Transition de page (fondu + léger glissement) à chaque navigation client.
 *
 * On n'utilise PAS `AnimatePresence mode="wait"` : sous le App Router de
 * Next.js, attendre la fin de l'animation de sortie peut empêcher le montage
 * de la nouvelle page → écran blanc jusqu'à un rechargement manuel.
 * Ici, la `motion.div` est simplement remontée à chaque changement de route
 * (`key={pathname}`). Le tout premier rendu ne s'anime pas (`initial={false}`)
 * afin que le contenu rendu côté serveur soit visible immédiatement, sans
 * flash invisible.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <motion.div
      key={pathname}
      initial={mounted ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
