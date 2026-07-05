"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Coins,
  Layers,
  CalendarDays,
  ArrowUpRight,
  FolderKanban,
} from "lucide-react";
import { cn, formatFCFA, formatDate } from "@da/ui";
import {
  EmptyState,
  PROJECT_STATUS,
  PROJECT_TYPE,
  StatusPill,
  toneColor,
  type Tone,
} from "@/components/admin/ui";
import type { ProjectRow } from "@/lib/admin-queries";

/* Ordre canonique des statuts pour les filtres. */
const STATUS_ORDER = [
  "PENDING",
  "IN_PROGRESS",
  "REVIEW",
  "DELIVERED",
  "MAINTENANCE",
  "ARCHIVED",
] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function ProjectsBoard({ projects }: { projects: ProjectRow[] }) {
  const [filter, setFilter] = React.useState<string>("ALL");

  // Statuts réellement présents (avec leur nombre) — pour n'afficher que les
  // filtres utiles.
  const counts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of projects) map[p.status] = (map[p.status] ?? 0) + 1;
    return map;
  }, [projects]);

  const visible = React.useMemo(
    () => (filter === "ALL" ? projects : projects.filter((p) => p.status === filter)),
    [projects, filter],
  );

  if (projects.length === 0) {
    return (
      <EmptyState
        icon={<FolderKanban className="h-6 w-6" />}
        title="Aucun projet pour l’instant"
        description="Convertissez un lead gagné en projet depuis le pipeline commercial : il apparaîtra ici avec sa timeline et sa facturation."
      >
        <Link
          href="/admin/leads"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-shadow hover:shadow-lg",
          )}
        >
          Voir le pipeline
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </EmptyState>
    );
  }

  return (
    <div>
      {/* Filtres par statut — barre défilante contenue (pas de débordement page). */}
      <div className="-mx-1 mb-6 overflow-x-auto pb-1 [scrollbar-width:thin]">
        <div className="flex min-w-max items-center gap-2 px-1">
          <FilterChip
            label="Tous"
            count={projects.length}
            active={filter === "ALL"}
            onClick={() => setFilter("ALL")}
          />
          {STATUS_ORDER.filter((s) => counts[s]).map((s) => {
            const meta = PROJECT_STATUS[s]!;
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
          icon={<Layers className="h-6 w-6" />}
          title="Aucun projet dans ce statut"
          description="Ajustez le filtre pour retrouver vos projets."
        />
      ) : (
        <motion.div
          key={filter}
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-5 lg:grid-cols-2"
        >
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </motion.div>
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

/* ───────────────────────────── Carte projet ────────────────────────────── */

function ProjectCard({ project: p }: { project: ProjectRow }) {
  const meta = PROJECT_STATUS[p.status]!;

  return (
    <motion.article variants={item}>
      <Link
        href={`/admin/projets/${p.id}`}
        className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/40 focus-visible:ring-offset-2 rounded-2xl"
      >
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="flex h-full flex-col rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 transition-shadow hover:shadow-xl"
        >
          {/* En-tête : titre + statut */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-display text-base font-bold text-navy transition-colors group-hover:text-brand-blue-royal">
                {p.title}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-text-secondary">
                <Building2 className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                <span className="truncate">{p.client.name}</span>
              </p>
            </div>
            <StatusPill label={meta.label} tone={meta.tone as Tone} />
          </div>

          {/* Méta : type + budget */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-brand-violet/10 px-2.5 py-1 text-[11px] font-semibold text-brand-violet">
              {PROJECT_TYPE[p.type] ?? p.type}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-navy/[0.05] px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
              <Coins className="h-3 w-3" />
              {p.budget != null ? formatFCFA(p.budget) : "Budget à définir"}
            </span>
          </div>

          {/* Progression */}
          <div className="mt-5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-text-secondary">
                <Layers className="h-3.5 w-3.5" />
                {p.completedStages}/{p.totalStages} étape{p.totalStages > 1 ? "s" : ""}
              </span>
              <span className="font-bold tabular-nums text-navy">{p.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-navy/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${p.progress}%` }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan"
              />
            </div>
          </div>

          {/* Pied : date + flèche */}
          <div className="mt-5 flex items-center justify-between border-t border-navy/[0.06] pt-3.5 text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {p.startDate ? formatDate(p.startDate) : formatDate(p.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-brand-blue-royal opacity-0 transition-opacity group-hover:opacity-100">
              Ouvrir
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </motion.div>
      </Link>
    </motion.article>
  );
}
