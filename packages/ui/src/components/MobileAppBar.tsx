"use client";

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "../lib/cn";

/* ══════════════════════════════════════════════════════════════════════════
   MobileAppBar — barre d'application contextuelle (@da/ui) : bouton retour
   optionnel + titre de la page courante + emplacement d'actions à droite.
   Façon écran d'app. `sticky` par défaut en haut (top-0) ; l'app peut décaler
   sous un en-tête existant via `className` (ex. `top-20`). Découplée de Next :
   le retour est un `onBack` fourni par l'app.
   ══════════════════════════════════════════════════════════════════════════ */

export interface MobileAppBarProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  className?: string;
}

export function MobileAppBar({ title, onBack, right, className }: MobileAppBarProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-1.5 border-b border-navy/[0.06] bg-surface-primary/95 px-2.5 backdrop-blur-xl",
        className,
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-navy transition-transform hover:bg-navy/[0.05] active:scale-90"
        >
          <ChevronLeft size={22} aria-hidden />
        </button>
      ) : (
        <span className="w-1.5 shrink-0" aria-hidden />
      )}
      <h1 className="min-w-0 flex-1 truncate font-display text-base font-bold text-navy">{title}</h1>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
