"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, GraduationCap, Presentation, ClipboardCheck, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@da/ui";
import { viewAsRole } from "@/lib/impersonation";

const PREVIEW_ROLES = [
  { role: "LEARNER", label: "Apprenant", icon: GraduationCap },
  { role: "INSTRUCTOR", label: "Formateur", icon: Presentation },
  { role: "REVIEWER", label: "Relecteur", icon: ClipboardCheck },
] as const;

/**
 * Sélecteur « Voir la plateforme en tant que rôle » pour l'administrateur.
 * Ouvre l'espace correspondant via une Server Action d'impersonation.
 */
export function ViewAsMenu() {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (role: string) => {
    setOpen(false);
    startTransition(() => {
      void viewAsRole(role);
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-medium text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
      >
        {pending ? (
          <Loader2 size={16} className="shrink-0 animate-spin text-brand-cyan" />
        ) : (
          <Eye size={16} className="shrink-0 text-brand-cyan" />
        )}
        <span className="min-w-0 flex-1 truncate text-left">Voir en tant que…</span>
        <ChevronDown
          size={14}
          className={cn("shrink-0 text-white/40 transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-full left-0 z-50 mb-2 w-full overflow-hidden rounded-xl border border-white/10 bg-[#191933] p-1 shadow-2xl"
          >
            {PREVIEW_ROLES.map((r) => (
              <button
                key={r.role}
                type="button"
                role="menuitem"
                onClick={() => pick(r.role)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                <r.icon size={16} className="shrink-0 text-brand-cyan" />
                {r.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
