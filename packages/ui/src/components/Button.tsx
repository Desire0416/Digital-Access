"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import {
  buttonClasses,
  type ButtonVariant,
  type ButtonSize,
} from "../lib/buttonClasses";

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: React.ReactNode;
}

/**
 * Bouton signature DA — dégradé, élévation au survol, feedback tactile Framer Motion.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, className, children, disabled, ...props },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={buttonClasses({ variant, size, className })}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="mr-1 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = "Button";
