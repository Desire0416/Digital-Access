"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@da/ui";
import { setSchoolStatus } from "@/lib/admin-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Contrôle segmenté Publié / Archivé pour une école. Mise à jour optimiste,
   rollback + message d'erreur en cas d'échec, router.refresh au succès.
   ══════════════════════════════════════════════════════════════════════════ */

const OPTIONS = [
  { value: "PUBLISHED", label: "Publié", fill: "bg-success" },
  { value: "ARCHIVED", label: "Archivé", fill: "bg-navy/70" },
] as const;

export function SchoolStatusToggle({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [current, setCurrent] = React.useState(status);
  const [error, setError] = React.useState<string | null>(null);

  const set = (value: string) => {
    if (value === current || pending) return;
    setError(null);
    const previous = current;
    setCurrent(value); // optimiste
    startTransition(async () => {
      const res = await setSchoolStatus(id, value);
      if (!res.ok) {
        setCurrent(previous);
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <div
        role="group"
        aria-label="Visibilité de l'école"
        className="inline-flex items-center rounded-full border border-navy/[0.1] bg-surface-secondary/70 p-0.5"
      >
        {OPTIONS.map((o) => {
          const active = current === o.value;
          return (
            <button
              key={o.value}
              type="button"
              disabled={pending}
              aria-pressed={active}
              onClick={() => set(o.value)}
              className={cn(
                "relative rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed",
                active ? "text-white" : "text-text-secondary hover:text-navy",
              )}
            >
              {active && (
                <motion.span
                  layoutId={`school-status-${id}`}
                  className={cn("absolute inset-0 rounded-full", o.fill)}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1">
                {active && pending && <Loader2 size={11} className="animate-spin" />}
                {o.label}
              </span>
            </button>
          );
        })}
      </div>
      {error && <span className="text-[11px] font-medium text-error">{error}</span>}
    </div>
  );
}
