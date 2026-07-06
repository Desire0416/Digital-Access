"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Coins,
  Radio,
  Sparkles,
  UserRound,
  CalendarDays,
  ArrowRight,
  Filter,
} from "lucide-react";
import { cn, formatDate } from "@da/ui";
import {
  LEAD_STATUS,
  PROJECT_TYPE,
  StatusPill,
  toneColor,
  type Tone,
} from "@/components/admin/ui";
import { Select, type SelectOption } from "@/components/Select";
import { updateLeadStatus } from "@/lib/admin-actions";
import type { LeadCard } from "@/lib/admin-queries";

/* Ordre canonique du pipeline. */
const STAGES = ["NEW", "CONTACTED", "QUOTE_SENT", "NEGOTIATION", "WON", "LOST"] as const;
type LeadStatus = (typeof STAGES)[number];
const ORDER = Object.fromEntries(STAGES.map((s, i) => [s, i])) as Record<string, number>;

const STATUS_OPTIONS: SelectOption[] = STAGES.map((s) => {
  const m = LEAD_STATUS[s]!;
  return { value: s, label: m.label, dotColor: toneColor(m.tone as Tone) };
});

/* ══════════════════════════════════════════════════════════════════════════
   Pipeline commercial — vue « filtre + cartes riches ».
   Une barre d'aperçu par étape (compteurs, cliquable pour filtrer) + une grille
   spacieuse de cartes lead (aucune troncature, aucun défilement horizontal).
   ══════════════════════════════════════════════════════════════════════════ */

export function LeadsBoard({
  leads,
}: {
  leads: LeadCard[];
  admins?: { id: string; name: string }[];
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<LeadStatus | "ALL">("ALL");

  const counts = React.useMemo(() => {
    const c: Record<string, number> = { ALL: leads.length };
    for (const s of STAGES) c[s] = 0;
    for (const l of leads) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [leads]);

  const visible = React.useMemo(() => {
    const list = filter === "ALL" ? leads : leads.filter((l) => l.status === filter);
    return [...list].sort(
      (a, b) =>
        (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9) ||
        b.createdAt.localeCompare(a.createdAt),
    );
  }, [leads, filter]);

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-navy/15 bg-surface-primary/60 p-12 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-da text-white">
          <Sparkles className="h-6 w-6" />
        </span>
        <p className="mt-4 font-display text-lg font-bold text-navy">Aucun lead pour l&apos;instant</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
          Les demandes de devis et messages de contact atterrissent ici. Le pipeline se remplira
          dès la première prise de contact.
        </p>
      </div>
    );
  }

  return (
    <div>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm font-medium text-error"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Aperçu du pipeline / filtres par étape ─── */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
          <Filter className="h-3.5 w-3.5" />
          Étape
        </span>
        <StageChip
          label="Tous"
          count={counts.ALL}
          active={filter === "ALL"}
          onClick={() => setFilter("ALL")}
        />
        {STAGES.map((s) => {
          const m = LEAD_STATUS[s]!;
          return (
            <StageChip
              key={s}
              label={m.label}
              count={counts[s] ?? 0}
              color={toneColor(m.tone as Tone)}
              active={filter === s}
              onClick={() => setFilter(s)}
            />
          );
        })}
      </div>

      {/* ─── Grille de cartes ─── */}
      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-navy/12 bg-surface-primary/60 px-4 py-10 text-center text-sm text-text-muted">
          Aucun lead à cette étape.
        </p>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((lead) => (
              <LeadCardItem key={lead.id} lead={lead} setError={setError} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────────── Puce d'étape (filtre) ─────────────────────── */

function StageChip({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-transparent bg-navy text-white"
          : "border-navy/[0.1] bg-surface-primary text-text-secondary hover:border-navy/20 hover:text-navy",
      )}
    >
      {color && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />}
      {label}
      <span
        className={cn(
          "grid min-w-5 place-items-center rounded-full px-1.5 text-xs font-bold tabular-nums",
          active ? "bg-white/20 text-white" : "bg-navy/[0.06] text-text-secondary",
        )}
      >
        {count}
      </span>
    </button>
  );
}

/* ──────────────────────────── Carte de lead ────────────────────────────── */

function LeadCardItem({
  lead,
  setError,
}: {
  lead: LeadCard;
  setError: (e: string | null) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const meta = LEAD_STATUS[lead.status] ?? LEAD_STATUS.NEW!;
  const accent = toneColor(meta.tone as Tone);

  const move = (status: string) => {
    if (status === lead.status) return;
    setError(null);
    startTransition(async () => {
      const res = await updateLeadStatus({ id: lead.id, status: status as LeadStatus });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  };

  const options = React.useMemo<SelectOption[]>(
    () => STATUS_OPTIONS.map((o) => (o.value === lead.status ? { ...o, disabled: true } : o)),
    [lead.status],
  );

  return (
    <motion.article
      layout
      layoutId={lead.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary transition-shadow hover:shadow-xl",
        pending && "opacity-60",
      )}
    >
      {/* Liseré de statut */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} />

      <Link href={`/admin/leads/${lead.id}`} className="block flex-1 p-5 pl-6 focus:outline-none">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-base font-bold leading-snug text-navy transition-colors line-clamp-2 group-hover:text-brand-blue-royal">
              {lead.name}
            </p>
            {lead.company && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{lead.company}</span>
              </p>
            )}
          </div>
          <StatusPill label={meta.label} tone={meta.tone} className="shrink-0" />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-brand-violet/10 px-2.5 py-1 text-xs font-semibold text-brand-violet">
            {PROJECT_TYPE[lead.projectType] ?? lead.projectType}
          </span>
          {lead.budget && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy/[0.05] px-2.5 py-1 text-xs font-semibold text-text-secondary">
              <Coins className="h-3.5 w-3.5 shrink-0" />
              {lead.budget}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-text-muted">
          <span className="flex min-w-0 items-center gap-1.5">
            {lead.assignee ? (
              <>
                <UserRound className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{lead.assignee.name}</span>
              </>
            ) : lead.source ? (
              <>
                <Radio className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{lead.source}</span>
              </>
            ) : (
              <span className="italic">Non assigné</span>
            )}
          </span>
          <time dateTime={lead.createdAt} className="flex shrink-0 items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatDate(lead.createdAt)}
          </time>
        </div>
      </Link>

      {/* Barre d'action */}
      <div className="flex items-center gap-2 border-t border-navy/[0.06] px-5 py-3 pl-6">
        <span className="shrink-0 text-xs font-medium text-text-muted">Déplacer</span>
        <Select
          value={lead.status}
          onChange={move}
          options={options}
          disabled={pending}
          ariaLabel={`Déplacer ${lead.name} vers un autre statut`}
          className="min-w-0 flex-1"
          buttonClassName="rounded-lg px-2.5 py-1.5 text-xs"
        />
        <Link
          href={`/admin/leads/${lead.id}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-blue-royal transition-colors hover:bg-brand-blue-vif/5"
        >
          Ouvrir
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </motion.article>
  );
}
