"use client";

import * as React from "react";
import { Monogram, cn } from "@da/ui";

/** Mortier de diplômé — coiffe le monogramme (identité Access Academy). */
function Cap({ size = 20, className }: { size?: number; className?: string }) {
  const gid = React.useId();
  return (
    <svg
      width={size}
      height={size * 0.78}
      viewBox="0 0 100 78"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#7B34F8" />
          <stop offset="0.5" stopColor="#2072E8" />
          <stop offset="1" stopColor="#12C7E8" />
        </linearGradient>
      </defs>
      <polygon points="8,30 50,10 92,30 50,50" fill={`url(#${gid})`} />
      <path d="M30 42 v14 c0 6 40 6 40 0 V42" stroke={`url(#${gid})`} strokeWidth="7" fill="none" />
      <path d="M14 33 v22" stroke={`url(#${gid})`} strokeWidth="5" strokeLinecap="round" />
      <circle cx="14" cy="61" r="6" fill={`url(#${gid})`} />
    </svg>
  );
}

export interface AcademyLogoProps {
  /** hauteur approximative du lockup en px */
  size?: number;
  /** couleur du mot « ACCESS » — s'adapte au fond */
  dark?: boolean;
  className?: string;
}

/** Lockup Access Academy : monogramme DA coiffé du mortier + wordmark. */
export function AcademyLogo({ size = 40, dark = false, className }: AcademyLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative inline-flex" style={{ width: size, height: size }}>
        <Monogram size={size} className="mt-1" />
        <Cap
          size={size * 0.62}
          className="absolute -left-1 -top-1.5 -rotate-6"
        />
      </span>
      <span className="flex flex-col leading-[0.95]">
        <span
          className={cn(
            "font-display text-[1.05rem] font-extrabold tracking-[0.14em]",
            dark ? "text-white" : "text-navy",
          )}
        >
          ACCESS
        </span>
        <span className="font-display text-[0.72rem] font-semibold tracking-[0.34em] text-gradient-da">
          ACADEMY
        </span>
      </span>
    </span>
  );
}
