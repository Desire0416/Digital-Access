"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  FolderKanban,
  ArrowUpRight,
  CircleDot,
} from "lucide-react";
import { Badge, cn, formatDate } from "@da/ui";
import type { TicketItem, TicketPriority, TicketStatus } from "@/lib/portal-queries";

const priorityMeta: Record<
  TicketPriority,
  { label: string; className: string; dot: string }
> = {
  URGENT: { label: "Urgente", className: "bg-error/10 text-error", dot: "bg-error" },
  HIGH: { label: "Haute", className: "bg-warning/10 text-[#B45309]", dot: "bg-warning" },
  MEDIUM: { label: "Moyenne", className: "bg-info/10 text-info", dot: "bg-info" },
  LOW: { label: "Basse", className: "bg-navy/[0.06] text-text-secondary", dot: "bg-text-muted" },
};

const statusMeta: Record<
  TicketStatus,
  { label: string; variant: "info" | "success" | "warning" | "default" }
> = {
  OPEN: { label: "Ouvert", variant: "warning" },
  IN_PROGRESS: { label: "En cours", variant: "info" },
  RESOLVED: { label: "Résolu", variant: "success" },
  CLOSED: { label: "Fermé", variant: "default" },
};

const OPEN_STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS"];

/** Liste filtrable des tickets (ouverts / tous), cards à personnalité. */
export function TicketList({ tickets }: { tickets: TicketItem[] }) {
  const [filter, setFilter] = React.useState<"open" | "all">("open");

  const openCount = React.useMemo(
    () => tickets.filter((t) => OPEN_STATUSES.includes(t.status)).length,
    [tickets],
  );

  const visible = React.useMemo(
    () =>
      filter === "open"
        ? tickets.filter((t) => OPEN_STATUSES.includes(t.status))
        : tickets,
    [tickets, filter],
  );

  const tabs: { key: "open" | "all"; label: string; count: number }[] = [
    { key: "open", label: "En cours", count: openCount },
    { key: "all", label: "Tous", count: tickets.length },
  ];

  return (
    <div>
      {/* Filtre segmenté */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-navy/[0.08] bg-surface-secondary/60 p-1">
          {tabs.map((t) => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                aria-pressed={active}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                  active ? "text-navy" : "text-text-secondary hover:text-navy",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="ticket-filter-pill"
                    className="absolute inset-0 rounded-lg bg-surface-primary shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t.label}</span>
                <span
                  className={cn(
                    "relative z-10 rounded-full px-1.5 py-0.5 text-[11px] font-bold leading-none",
                    active
                      ? "bg-brand-blue-vif/12 text-brand-blue-royal"
                      : "bg-navy/[0.06] text-text-muted",
                  )}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-surface-secondary/40 p-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
            <CircleDot size={22} />
          </span>
          <p className="mt-4 font-display text-base font-bold text-navy">
            {filter === "open"
              ? "Aucun ticket en cours"
              : "Aucun ticket à afficher"}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-text-secondary">
            {filter === "open"
              ? "Tous vos tickets ont été traités. Basculez sur « Tous » pour consulter l'historique."
              : "Vos tickets de support apparaîtront ici."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4">
          {visible.map((t, i) => {
            const pm = priorityMeta[t.priority];
            const sm = statusMeta[t.status];
            return (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.24) }}
              >
                <Link
                  href={`/support/${t.id}`}
                  className="group relative block overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary p-5 transition-all hover:-translate-y-0.5 hover:border-brand-blue-vif/30 hover:shadow-lg"
                >
                  {/* Liseré priorité à gauche */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-0 left-0 w-1",
                      t.priority === "URGENT" && "bg-error",
                      t.priority === "HIGH" && "bg-warning",
                      t.priority === "MEDIUM" && "bg-info",
                      t.priority === "LOW" && "bg-navy/15",
                    )}
                  />
                  <div className="flex items-start justify-between gap-4 pl-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
                            pm.className,
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", pm.dot)} />
                          {pm.label}
                        </span>
                        <Badge variant={sm.variant}>{sm.label}</Badge>
                      </div>
                      <h3 className="mt-2.5 truncate font-display text-base font-bold text-navy transition-colors group-hover:text-brand-blue-royal">
                        {t.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                        {t.projectTitle && (
                          <span className="inline-flex items-center gap-1.5">
                            <FolderKanban size={13} className="text-brand-blue-vif" />
                            {t.projectTitle}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <MessageSquare size={13} />
                          {t.messageCount} réponse{t.messageCount > 1 ? "s" : ""}
                        </span>
                        <span>Ouvert le {formatDate(t.createdAt)}</span>
                      </div>
                    </div>
                    <ArrowUpRight
                      size={18}
                      className="mt-1 shrink-0 text-text-muted transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-blue-royal"
                    />
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
