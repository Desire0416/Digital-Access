"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/cn";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
  invert?: boolean;
}

/** En-tête de section : sur-titre à filet dégradé + titre magazine + sous-titre. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
  titleClassName,
  invert = false,
}: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "mb-4 inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em]",
            invert ? "text-brand-cyan" : "text-brand-blue-royal",
          )}
        >
          <span className="h-px w-7 bg-gradient-da" />
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl",
          invert ? "text-white" : "text-navy",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed",
            invert ? "text-white/70" : "text-text-secondary",
          )}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
