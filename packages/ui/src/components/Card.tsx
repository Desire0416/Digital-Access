"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../lib/cn";

export interface CardProps
  extends Omit<HTMLMotionProps<"div">, "ref" | "children"> {
  /** Active l'élévation 3D au survol. */
  interactive?: boolean;
  /** Bordure dégradée subtile. */
  gradientBorder?: boolean;
  children?: React.ReactNode;
}

/**
 * Card DA — au repos sans ombre, élévation + scale au survol (jamais un rectangle plat).
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ interactive = true, gradientBorder = false, className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={
          interactive
            ? { y: -6, boxShadow: "0 24px 48px -14px rgba(43,58,140,0.20)" }
            : undefined
        }
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className={cn(
          "relative rounded-xl bg-surface-primary p-6",
          gradientBorder ? "card-gradient-border" : "border border-navy/[0.07]",
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

Card.displayName = "Card";
