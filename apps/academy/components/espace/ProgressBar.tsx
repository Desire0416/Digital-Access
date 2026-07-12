"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@da/ui";

/* Barre de progression au dégradé signature DA (§16). Animée à l'entrée. */

export function ProgressBar({
  value,
  className,
  height = "h-2",
  showLabel = false,
}: {
  value: number;
  className?: string;
  height?: string;
  showLabel?: boolean;
}) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("relative flex-1 overflow-hidden rounded-full bg-navy/[0.08]", height)}>
        <motion.span
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 20 }}
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-da"
          aria-hidden
        />
      </div>
      {showLabel && (
        <span className="shrink-0 font-display text-xs font-bold tabular-nums text-navy">{pct}%</span>
      )}
    </div>
  );
}
