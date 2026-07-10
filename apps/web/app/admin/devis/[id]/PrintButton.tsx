"use client";

import { Printer } from "lucide-react";
import { buttonClasses } from "@da/ui";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className={buttonClasses({ variant: "primary", size: "md" })}>
      <Printer className="h-4 w-4" /> Imprimer / PDF
    </button>
  );
}
