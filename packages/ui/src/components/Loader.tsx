"use client";

import { motion } from "framer-motion";
import { cn } from "../lib/cn";
import { Monogram } from "./Monogram";

export interface LoaderProps {
  size?: number;
  label?: string;
  className?: string;
  /** plein écran centré (overlay de page) */
  fullscreen?: boolean;
}

/**
 * Loader signature DA : le monogramme officiel « respire » au-dessus d'un halo
 * dégradé pulsé et d'une barre indéterminée. Jamais un spinner générique.
 */
export function Loader({
  size = 64,
  label = "Chargement…",
  className,
  fullscreen = false,
}: LoaderProps) {
  const mark = (
    <div className={cn("flex flex-col items-center gap-5", className)}>
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <motion.span
          aria-hidden
          className="absolute inset-0 -z-10 rounded-full bg-gradient-da blur-2xl"
          animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.85, 1.05, 0.85] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Monogram size={size} />
        </motion.div>
      </div>

      <div className="relative h-1 w-16 overflow-hidden rounded-full bg-navy/10">
        <motion.span
          className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-gradient-da"
          animate={{ x: ["-110%", "210%"] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {label && (
        <motion.span
          className="text-sm font-medium text-text-secondary"
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {label}
        </motion.span>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-surface-primary/85 backdrop-blur-sm">
        {mark}
      </div>
    );
  }
  return mark;
}
