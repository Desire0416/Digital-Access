"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@da/ui";
import type { LucideIcon } from "lucide-react";

export interface TabDef {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
}

/**
 * Barre d'onglets brandée DA : indicateur actif glissant (layoutId), défilement
 * horizontal sur mobile. `layoutGroupId` doit être unique par instance montée
 * simultanément (évite les collisions d'animation entre plusieurs TabBar).
 */
export function TabBar({
  tabs,
  active,
  onChange,
  layoutGroupId = "crm-tab",
  className,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
  layoutGroupId?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative border-b border-navy/[0.08]", className)}>
      <div className="flex gap-1 overflow-x-auto pb-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => {
          const isActive = t.id === active;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-sm font-semibold transition-colors",
                isActive ? "text-brand-blue-royal" : "text-text-secondary hover:text-navy",
              )}
            >
              {Icon && <Icon size={16} className={isActive ? "text-brand-blue-royal" : "text-text-muted"} />}
              {t.label}
              {typeof t.badge === "number" && t.badge > 0 && (
                <span
                  className={cn(
                    "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold",
                    isActive ? "bg-brand-blue-vif/12 text-brand-blue-royal" : "bg-navy/[0.06] text-text-secondary",
                  )}
                >
                  {t.badge}
                </span>
              )}
              {isActive && (
                <motion.span
                  layoutId={layoutGroupId}
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan"
                  transition={{ type: "spring", stiffness: 400, damping: 34 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
