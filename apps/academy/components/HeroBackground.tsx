"use client";

import { motion } from "framer-motion";
import { cn } from "@da/ui";

/**
 * Décor de hero : dégradés animés (aurora), grille subtile.
 * Jamais un fond blanc plat — signature visuelle anti-générique DA.
 */
export function HeroBackground({
  className,
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 overflow-hidden",
        variant === "dark" ? "bg-surface-dark" : "bg-surface-primary",
        className,
      )}
    >
      <div className="absolute inset-0 bg-grid opacity-70" />

      <motion.div
        className="absolute -left-24 top-[-10%] h-[32rem] w-[32rem] rounded-full bg-accent/25 blur-[120px]"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-10%] top-[10%] h-[28rem] w-[28rem] rounded-full bg-brand-cyan/25 blur-[120px]"
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute bottom-[-20%] left-1/3 h-[26rem] w-[26rem] rounded-full bg-brand-blue-vif/20 blur-[110px]"
        animate={{ x: [0, 24, 0], y: [0, -30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 h-40",
          variant === "dark"
            ? "bg-gradient-to-t from-surface-dark to-transparent"
            : "bg-gradient-to-t from-surface-primary to-transparent",
        )}
      />
    </div>
  );
}
