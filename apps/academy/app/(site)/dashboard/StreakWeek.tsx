"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@da/ui";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

/**
 * Card « Ma série d'apprentissage » : 7 pastilles (lun→dim), les {streak}
 * derniers jours allumés en dégradé DA. Le jour courant est calculé après
 * montage (pas de décalage d'hydratation) — les pastilles s'allument en cascade.
 */
export function StreakWeek({ streak }: { streak: number }) {
  const [todayIdx, setTodayIdx] = React.useState<number | null>(null);

  React.useEffect(() => {
    // getDay(): 0 = dimanche → index lundi-première : 0 = lundi … 6 = dimanche
    setTodayIdx((new Date().getDay() + 6) % 7);
  }, []);

  const isLit = (i: number): boolean =>
    todayIdx != null && streak > 0 && i <= todayIdx && i > todayIdx - streak;

  const message =
    streak === 0
      ? "Complétez un chapitre aujourd'hui pour allumer votre première flamme."
      : streak === 1
        ? "Première flamme allumée — revenez demain pour faire grandir la série !"
        : `${streak} jours consécutifs d'apprentissage. Votre régularité paie !`;

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-7">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-gradient-da opacity-[0.08] blur-2xl"
      />

      <div className="relative flex items-center gap-3">
        <span
          className={cn(
            "grid h-11 w-11 place-items-center rounded-xl",
            streak >= 1 ? "bg-gradient-da text-white shadow-brand" : "bg-navy/[0.05] text-text-muted",
          )}
        >
          <motion.span
            aria-hidden
            className="inline-flex"
            animate={streak >= 1 ? { scale: [1, 1.2, 1] } : { scale: 1 }}
            transition={
              streak >= 1
                ? { repeat: Infinity, duration: 1.4, ease: "easeInOut" }
                : { duration: 0.2 }
            }
          >
            <Flame size={20} fill={streak >= 1 ? "currentColor" : "none"} />
          </motion.span>
        </span>
        <div>
          <p className="font-display text-lg font-bold leading-tight text-navy">
            {streak} {streak > 1 ? "jours" : "jour"}
          </p>
          <p className="text-xs font-medium text-text-muted">Cette semaine</p>
        </div>
      </div>

      {/* Pastilles lun → dim */}
      <div className="relative mt-6 flex items-start justify-between gap-1">
        {DAYS.map((day, i) => {
          const lit = isLit(i);
          const isToday = todayIdx === i;
          return (
            <div key={day} className="flex flex-col items-center gap-2">
              <motion.span
                initial={false}
                animate={
                  lit
                    ? { scale: [0.5, 1.15, 1], opacity: 1 }
                    : { scale: 1, opacity: 1 }
                }
                transition={{
                  duration: 0.45,
                  delay: i * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full text-[11px] font-bold sm:h-10 sm:w-10",
                  lit
                    ? "bg-gradient-da text-white shadow-brand"
                    : "bg-navy/[0.05] text-text-muted",
                  isToday &&
                    "ring-2 ring-brand-blue-vif/40 ring-offset-2 ring-offset-surface-primary",
                )}
              >
                {lit ? (
                  <Flame size={15} fill="currentColor" aria-hidden />
                ) : (
                  day.charAt(0)
                )}
              </motion.span>
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  isToday ? "text-brand-blue-royal" : "text-text-muted",
                )}
              >
                {day}
              </span>
            </div>
          );
        })}
      </div>

      <p className="relative mt-auto pt-6 text-sm leading-relaxed text-text-secondary">
        {message}
      </p>
    </div>
  );
}
