"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Printer } from "lucide-react";
import { cn, buttonClasses } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Bouton d'impression / export PDF — appelle window.print() sur le document
   de facture. Masqué à l'impression (print:hidden).
   ══════════════════════════════════════════════════════════════════════════ */

export function PrintButton({ className }: { className?: string }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={() => window.print()}
      className={cn(buttonClasses({ variant: "primary", size: "md" }), "print:hidden", className)}
    >
      <Printer className="h-4 w-4" />
      Imprimer / PDF
    </motion.button>
  );
}
