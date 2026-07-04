"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../lib/cn";

const inputBase =
  "w-full rounded-lg border bg-surface-primary px-4 text-navy placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-60";
const inputState = (error?: boolean) =>
  error
    ? "border-error/60 focus:border-error focus:ring-error/20"
    : "border-navy/15 focus:border-brand-blue-vif focus:ring-brand-blue-vif/25";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(inputBase, "h-11", inputState(error), className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(inputBase, "min-h-28 py-3", inputState(error), className)}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export interface FieldProps {
  label?: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Enveloppe de champ : label, contenu, message d'erreur animé (shake). */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-medium text-navy"
        >
          {label}
          {required && <span className="ml-0.5 text-error">*</span>}
        </label>
      )}
      {children}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: [0, -4, 4, -3, 3, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="text-xs font-medium text-error"
          >
            {error}
          </motion.p>
        ) : hint ? (
          <p key="hint" className="text-xs text-text-muted">
            {hint}
          </p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
