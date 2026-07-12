"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, X } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   Barre de recherche globale (cahier §32). Soumet vers /recherche?q=… — la
   page serveur relit q et re-requête searchAll. Pré-remplie avec la requête
   courante. Micro-interactions DA, respecte prefers-reduced-motion (pas de
   Framer ici : transitions CSS uniquement).
   ══════════════════════════════════════════════════════════════════════════ */

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState(initialQuery);

  // Resynchronise si l'URL change de l'extérieur (bouton retour…).
  React.useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/recherche?q=${encodeURIComponent(q)}` : "/recherche");
  };

  return (
    <form onSubmit={submit} role="search" className="relative">
      <Search
        size={19}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoFocus
        placeholder="Rechercher une formation, un parcours, une école, une compétence…"
        aria-label="Rechercher sur Access Academy"
        className="h-14 w-full rounded-2xl border border-navy/[0.1] bg-surface-primary pl-12 pr-32 text-sm font-medium text-navy shadow-[0_10px_30px_-18px_rgba(43,58,140,0.35)] transition-colors placeholder:text-text-muted hover:border-navy/20 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/40 sm:text-base"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            router.push("/recherche");
          }}
          aria-label="Effacer la recherche"
          className="absolute right-[92px] top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-text-muted transition-colors hover:bg-navy/[0.06] hover:text-navy sm:right-[104px]"
        >
          <X size={15} aria-hidden />
        </button>
      )}
      <button
        type="submit"
        className="absolute right-2 top-1/2 inline-flex h-10 -translate-y-1/2 items-center gap-1.5 rounded-xl bg-gradient-da px-4 text-sm font-semibold text-white shadow-brand transition-transform duration-200 hover:scale-[1.03] active:scale-95"
      >
        <span className="hidden sm:inline">Rechercher</span>
        <ArrowRight size={16} aria-hidden className="sm:hidden" />
      </button>
    </form>
  );
}
