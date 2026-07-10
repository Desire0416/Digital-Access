"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@da/ui";

/**
 * Barre de recherche du catalogue — style « accueil Coursera » adapté à la
 * charte DA. Soumet vers le catalogue des parcours filtré par recherche.
 * Deux variantes : `hero` (grande, page d'accueil) et `header` (compacte, nav).
 */
export function HomeSearch({
  variant = "hero",
  className,
  placeholder = "Que souhaitez-vous apprendre ?",
}: {
  variant?: "hero" | "header";
  className?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [q, setQ] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/career-paths?search=${encodeURIComponent(query)}` : "/career-paths");
  }

  if (variant === "header") {
    return (
      <form onSubmit={submit} className={cn("relative w-full", className)} role="search">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          aria-label="Rechercher une formation"
          className="h-10 w-full rounded-full border border-navy/[0.12] bg-surface-primary pl-10 pr-4 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-vif focus:ring-2 focus:ring-brand-blue-vif/20"
        />
      </form>
    );
  }

  return (
    <form onSubmit={submit} className={cn("relative w-full max-w-2xl", className)} role="search">
      <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label="Rechercher une formation ou un métier"
        className="h-14 w-full rounded-full border border-navy/[0.1] bg-surface-primary pl-14 pr-32 text-base text-navy shadow-lg shadow-navy/[0.04] outline-none transition-shadow placeholder:text-text-muted focus:ring-2 focus:ring-brand-blue-vif/25 sm:h-16 sm:pr-36 sm:text-lg"
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-2 rounded-full bg-gradient-da px-5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-1/2 hover:scale-[1.03] active:scale-95 sm:h-12 sm:px-7 sm:text-base"
      >
        <Search className="h-4 w-4 sm:hidden" />
        <span className="hidden sm:inline">Rechercher</span>
      </button>
    </form>
  );
}
