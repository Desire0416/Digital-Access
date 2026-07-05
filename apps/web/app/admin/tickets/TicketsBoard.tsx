"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LifeBuoy,
  MessagesSquare,
  FolderKanban,
  CalendarDays,
  ArrowUpRight,
  User2,
} from "lucide-react";
import { cn, formatDate } from "@da/ui";
import {
  EmptyState,
  StatusPill,
  TICKET_PRIORITY,
  TICKET_STATUS,
  toneColor,
  type Tone,
} from "@/components/admin/ui";
import type { TicketRow } from "@/lib/admin-queries";

/* Ordre canonique des statuts — les ouverts remontent en tête. */
const STATUS_ORDER = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

/* Poids de tri : ouverts d'abord, puis par priorité décroissante. */
const STATUS_WEIGHT: Record<string, number> = {
  OPEN: 0,
  IN_PROGRESS: 1,
  RESOLVED: 2,
  CLOSED: 3,
};
const PRIORITY_WEIGHT: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function TicketsBoard({ tickets }: { tickets: TicketRow[] }) {
  const [filter, setFilter] = React.useState<string>("ALL");

  const counts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tickets) map[t.status] = (map[t.status] ?? 0) + 1;
    return map;
  }, [tickets]);

  // Tri : ouverts prioritaires en tête, fermés en bas.
  const sorted = React.useMemo(() => {
    return [...tickets].sort((a, b) => {
      const sw = (STATUS_WEIGHT[a.status] ?? 9) - (STATUS_WEIGHT[b.status] ?? 9);
      if (sw !== 0) return sw;
      const pw =
        (PRIORITY_WEIGHT[a.priority] ?? 9) - (PRIORITY_WEIGHT[b.priority] ?? 9);
      if (pw !== 0) return pw;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [tickets]);

  const visible = React.useMemo(
    () => (filter === "ALL" ? sorted : sorted.filter((t) => t.status === filter)),
    [sorted, filter],
  );

  if (tickets.length === 0) {
    return (
      <EmptyState
        icon={<LifeBuoy className="h-6 w-6" />}
        title="Aucun ticket de support"
        description="Lorsqu'un client ouvre une demande d'assistance depuis son espace, elle apparaît ici — priorisée automatiquement pour un traitement rapide."
      />
    );
  }

  return (
    <div>
      {/* Filtres par statut — barre défilante contenue (pas de débordement page). */}
      <div className="-mx-1 mb-6 overflow-x-auto pb-1 [scrollbar-width:thin]">
        <div className="flex min-w-max items-center gap-2 px-1">
          <FilterChip
            label="Tous"
            count={tickets.length}
            active={filter === "ALL"}
            onClick={() => setFilter("ALL")}
          />
          {STATUS_ORDER.filter((s) => counts[s]).map((s) => {
            const meta = TICKET_STATUS[s]!;
            return (
              <FilterChip
                key={s}
                label={meta.label}
                count={counts[s]!}
                tone={meta.tone as Tone}
                active={filter === s}
                onClick={() => setFilter(s)}
              />
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<MessagesSquare className="h-6 w-6" />}
          title="Aucun ticket dans ce statut"
          description="Ajustez le filtre pour retrouver les autres demandes."
        />
      ) : (
        <>
          {/* ─── Mobile / tablette : cartes empilées (sous lg) ─── */}
          <motion.ul
            key={`cards-${filter}`}
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 gap-4 lg:hidden"
          >
            {visible.map((t) => (
              <motion.li key={t.id} variants={item}>
                <TicketCard ticket={t} />
              </motion.li>
            ))}
          </motion.ul>

          {/* ─── Desktop : tableau (lg+) dans un conteneur scrollable ─── */}
          <div className="hidden overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary lg:block">
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-navy/[0.07] bg-surface-secondary/50">
                    <Th>Ticket</Th>
                    <Th>Client</Th>
                    <Th>Priorité</Th>
                    <Th>Statut</Th>
                    <Th className="text-center">Messages</Th>
                    <Th>Mis à jour</Th>
                    <Th className="w-10" />
                  </tr>
                </thead>
                <motion.tbody
                  key={`rows-${filter}`}
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {visible.map((t) => (
                    <TicketRowView key={t.id} ticket={t} />
                  ))}
                </motion.tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────── Filtre ────────────────────────────────── */

function FilterChip({
  label,
  count,
  tone,
  active,
  onClick,
}: {
  label: string;
  count: number;
  tone?: Tone;
  active: boolean;
  onClick: () => void;
}) {
  const accent = tone ? toneColor(tone) : "#5b3fa8";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
        active
          ? "border-transparent bg-gradient-da text-white shadow-sm"
          : "border-navy/[0.09] bg-surface-primary text-text-secondary hover:border-navy/20 hover:text-navy",
      )}
    >
      {tone && !active && (
        <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
      )}
      {label}
      <span
        className={cn(
          "grid min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold tabular-nums",
          active ? "bg-white/25 text-white" : "bg-navy/[0.06] text-text-secondary",
        )}
      >
        {count}
      </span>
    </button>
  );
}

/* ─────────────────────────── Ligne de tableau ──────────────────────────── */

function Th({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}

function TicketRowView({ ticket: t }: { ticket: TicketRow }) {
  const status = TICKET_STATUS[t.status]!;
  const priority = TICKET_PRIORITY[t.priority]!;
  const isOpen = t.status === "OPEN" || t.status === "IN_PROGRESS";

  return (
    <motion.tr
      variants={item}
      className="group border-b border-navy/[0.05] last:border-0 transition-colors hover:bg-surface-secondary/50"
    >
      {/* Titre + accent priorité pour les urgents */}
      <td className="px-4 py-3.5 align-top">
        <Link href={`/admin/tickets/${t.id}`} className="block">
          <span className="flex items-start gap-2.5">
            {t.priority === "URGENT" && (
              <span
                aria-hidden
                className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-error"
              />
            )}
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-bold text-navy transition-colors group-hover:text-brand-blue-royal">
                {t.title}
              </span>
              {t.projectTitle && (
                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-text-muted">
                  <FolderKanban className="h-3 w-3 shrink-0" />
                  <span className="truncate">{t.projectTitle}</span>
                </span>
              )}
            </span>
          </span>
        </Link>
      </td>

      {/* Client */}
      <td className="px-4 py-3.5 align-top">
        <span className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy/[0.06] text-[10px] font-bold text-text-secondary">
            {initials(t.clientName)}
          </span>
          <span className="truncate text-sm font-medium text-navy">
            {t.clientName}
          </span>
        </span>
      </td>

      {/* Priorité */}
      <td className="px-4 py-3.5 align-top">
        <StatusPill label={priority.label} tone={priority.tone} />
      </td>

      {/* Statut */}
      <td className="px-4 py-3.5 align-top">
        <StatusPill label={status.label} tone={status.tone} dot={isOpen} />
      </td>

      {/* Messages */}
      <td className="px-4 py-3.5 text-center align-top">
        <span className="inline-flex items-center gap-1 rounded-full bg-navy/[0.05] px-2.5 py-1 text-xs font-semibold text-text-secondary">
          <MessagesSquare className="h-3.5 w-3.5" />
          {t.messageCount}
        </span>
      </td>

      {/* Date */}
      <td className="px-4 py-3.5 align-top text-sm text-text-secondary">
        {formatDate(t.updatedAt)}
      </td>

      {/* Flèche */}
      <td className="px-4 py-3.5 align-top">
        <Link
          href={`/admin/tickets/${t.id}`}
          aria-label={`Ouvrir le ticket ${t.title}`}
          className="grid h-8 w-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-brand-violet/10 hover:text-brand-violet"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </td>
    </motion.tr>
  );
}

/* ──────────────────────────── Carte mobile ─────────────────────────────── */

function TicketCard({ ticket: t }: { ticket: TicketRow }) {
  const status = TICKET_STATUS[t.status]!;
  const priority = TICKET_PRIORITY[t.priority]!;
  const isOpen = t.status === "OPEN" || t.status === "IN_PROGRESS";
  const urgent = t.priority === "URGENT";

  return (
    <Link
      href={`/admin/tickets/${t.id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/40 focus-visible:ring-offset-2 rounded-2xl"
    >
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-shadow hover:shadow-lg",
        )}
      >
        {/* Filet dégradé pour les tickets urgents ouverts */}
        {urgent && isOpen && (
          <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-error" />
        )}

        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 font-display text-sm font-bold leading-snug text-navy transition-colors group-hover:text-brand-blue-royal">
            {t.title}
          </h3>
          <StatusPill label={status.label} tone={status.tone} dot={isOpen} />
        </div>

        {/* Client + projet */}
        <div className="mt-3 flex flex-col gap-1.5 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <User2 className="h-3.5 w-3.5 shrink-0 text-text-muted" />
            <span className="truncate font-medium text-navy">{t.clientName}</span>
          </span>
          {t.projectTitle && (
            <span className="flex items-center gap-1.5">
              <FolderKanban className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              <span className="truncate">{t.projectTitle}</span>
            </span>
          )}
        </div>

        {/* Pied : priorité + messages + date */}
        <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-navy/[0.06] pt-3 text-[11px]">
          <StatusPill label={priority.label} tone={priority.tone} />
          <span className="inline-flex items-center gap-1 rounded-full bg-navy/[0.05] px-2 py-0.5 font-semibold text-text-secondary">
            <MessagesSquare className="h-3 w-3" />
            {t.messageCount}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-text-muted">
            <CalendarDays className="h-3 w-3" />
            {formatDate(t.updatedAt)}
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

/* ─────────────────────────────── Utils ─────────────────────────────────── */

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
