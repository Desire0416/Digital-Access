"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Coins, Radio, Sparkles, UserRound, MoveRight } from "lucide-react";
import { cn, formatDate } from "@da/ui";
import { LEAD_STATUS, PROJECT_TYPE, toneColor, type Tone } from "@/components/admin/ui";
import { Select, type SelectOption } from "@/components/Select";
import { updateLeadStatus } from "@/lib/admin-actions";
import type { LeadCard } from "@/lib/admin-queries";

/* Ordre canonique des colonnes du pipeline. */
const COLUMNS = ["NEW", "CONTACTED", "QUOTE_SENT", "NEGOTIATION", "WON", "LOST"] as const;
type LeadStatus = (typeof COLUMNS)[number];

/* Options du Select « Déplacer vers » — les 6 statuts avec pastille de couleur. */
const STATUS_OPTIONS: SelectOption[] = COLUMNS.map((s) => {
  const m = LEAD_STATUS[s]!;
  return { value: s, label: m.label, dotColor: toneColor(m.tone as Tone) };
});

/* Variants de stagger pour l'apparition des cartes d'une colonne/section. */
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function LeadsBoard({ leads }: { leads: LeadCard[]; admins?: { id: string; name: string }[] }) {
  // Feedback d'erreur d'action, éphémère.
  const [error, setError] = React.useState<string | null>(null);

  const grouped = React.useMemo(() => {
    const map: Record<LeadStatus, LeadCard[]> = {
      NEW: [], CONTACTED: [], QUOTE_SENT: [], NEGOTIATION: [], WON: [], LOST: [],
    };
    for (const lead of leads) {
      (map[lead.status as LeadStatus] ?? map.NEW).push(lead);
    }
    return map;
  }, [leads]);

  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-navy/15 bg-surface-primary/60 p-12 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-da text-white">
          <Sparkles className="h-6 w-6" />
        </span>
        <p className="mt-4 font-display text-lg font-bold text-navy">Aucun lead pour l’instant</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
          Les demandes de devis et messages de contact atterrissent ici. Le pipeline se remplira dès
          la première prise de contact.
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

      {/*
        Desktop (lg+) : 6 colonnes compactes en grille qui TIENNENT dans la largeur.
        min-w-0 sur chaque colonne → jamais de débordement / scroll horizontal.
      */}
      <div className="hidden gap-3 lg:grid lg:grid-cols-6">
        {COLUMNS.map((status) => (
          <Column key={status} status={status} leads={grouped[status]} setError={setError} />
        ))}
      </div>

      {/*
        Mobile / tablette (< lg) : chaque statut est une SECTION empilée verticalement.
      */}
      <div className="space-y-8 lg:hidden">
        {COLUMNS.map((status) => (
          <StatusSection key={status} status={status} leads={grouped[status]} setError={setError} />
        ))}
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-xs text-text-muted">
        <MoveRight className="h-3.5 w-3.5" />
        Utilisez « Déplacer vers » sur une carte pour changer son statut, ou ouvrez le lead pour le
        détail complet.
      </p>
    </div>
  );
}

/* ─────────────────────────── En-tête de statut ─────────────────────────── */

function StatusHeader({ status, count }: { status: LeadStatus; count: number }) {
  const meta = LEAD_STATUS[status]!;
  const accent = toneColor(meta.tone as Tone);
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: accent }} />
      <span className="min-w-0 flex-1 truncate font-display text-sm font-bold text-navy">
        {meta.label}
      </span>
      <span
        className="grid min-w-6 place-items-center rounded-full px-1.5 py-0.5 text-xs font-bold"
        style={{ background: hexA(accent, 0.14), color: accent }}
      >
        {count}
      </span>
    </div>
  );
}

/* ─────────────────────── Colonne compacte (desktop) ────────────────────── */

function Column({
  status,
  leads,
  setError,
}: {
  status: LeadStatus;
  leads: LeadCard[];
  setError: (e: string | null) => void;
}) {
  const meta = LEAD_STATUS[status]!;
  const accent = toneColor(meta.tone as Tone);

  return (
    <section
      className="flex min-w-0 flex-col rounded-2xl border border-navy/[0.07] bg-surface-secondary/60"
      aria-label={`Colonne ${meta.label}`}
    >
      <header
        className="rounded-t-2xl border-b border-navy/[0.06] px-3 py-2.5"
        style={{ background: `linear-gradient(180deg, ${hexA(accent, 0.1)}, transparent)` }}
      >
        <StatusHeader status={status} count={leads.length} />
      </header>

      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="flex flex-1 flex-col gap-2.5 p-2.5"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {leads.length === 0 ? (
            <motion.p
              key="empty"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-dashed border-navy/10 px-3 py-5 text-center text-xs text-text-muted"
            >
              Vide
            </motion.p>
          ) : (
            leads.map((lead) => <LeadCardItem key={lead.id} lead={lead} setError={setError} />)
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

/* ─────────────────────── Section empilée (mobile) ──────────────────────── */

function StatusSection({
  status,
  leads,
  setError,
}: {
  status: LeadStatus;
  leads: LeadCard[];
  setError: (e: string | null) => void;
}) {
  const meta = LEAD_STATUS[status]!;

  return (
    <section aria-label={`Statut ${meta.label}`}>
      <div className="mb-3">
        <StatusHeader status={status} count={leads.length} />
      </div>

      {leads.length === 0 ? (
        <p className="rounded-xl border border-dashed border-navy/10 px-3 py-5 text-center text-xs text-text-muted">
          Aucun lead dans ce statut.
        </p>
      ) : (
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {leads.map((lead) => (
              <LeadCardItem key={lead.id} lead={lead} setError={setError} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
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

  const move = (status: string) => {
    if (status === lead.status) return;
    setError(null);
    startTransition(async () => {
      const res = await updateLeadStatus({ id: lead.id, status: status as LeadStatus });
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  // Les options désactivent le statut courant (pas de déplacement vers soi-même).
  const options = React.useMemo<SelectOption[]>(
    () => STATUS_OPTIONS.map((o) => (o.value === lead.status ? { ...o, disabled: true } : o)),
    [lead.status],
  );

  return (
    <motion.article
      layout
      layoutId={lead.id}
      variants={cardVariants}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className={cn(
        "group relative flex flex-col rounded-2xl border border-navy/[0.07] bg-surface-primary p-3 transition-shadow",
        "hover:shadow-lg",
        pending && "opacity-60",
      )}
    >
      {/* Corps cliquable → détail */}
      <Link href={`/admin/leads/${lead.id}`} className="block focus:outline-none">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-bold text-navy group-hover:text-brand-blue-royal">
            {lead.name}
          </p>
          {lead.company && (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-text-secondary">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.company}</span>
            </p>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex max-w-full items-center truncate rounded-full bg-brand-violet/10 px-2 py-0.5 text-[11px] font-semibold text-brand-violet">
            {PROJECT_TYPE[lead.projectType] ?? lead.projectType}
          </span>
          {lead.budget && (
            <span className="inline-flex items-center gap-1 rounded-full bg-navy/[0.05] px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
              <Coins className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.budget}</span>
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-text-muted">
          <span className="flex min-w-0 items-center gap-1">
            {lead.assignee ? (
              <>
                <UserRound className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.assignee.name}</span>
              </>
            ) : lead.source ? (
              <>
                <Radio className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.source}</span>
              </>
            ) : (
              <span className="italic">Non assigné</span>
            )}
          </span>
          <time dateTime={lead.createdAt} className="shrink-0">
            {formatDate(lead.createdAt)}
          </time>
        </div>
      </Link>

      {/* Barre d'action : déplacer vers (Select en portail — jamais clippé) */}
      <div className="mt-3 border-t border-navy/[0.06] pt-2.5">
        <Select
          value={lead.status}
          onChange={move}
          options={options}
          disabled={pending}
          ariaLabel={`Déplacer ${lead.name} vers un autre statut`}
          buttonClassName="rounded-lg border-navy/[0.1] px-2.5 py-1.5 text-xs"
        />
      </div>
    </motion.article>
  );
}

/* Convertit un hex #rrggbb + alpha → rgba(...) pour les fonds teintés. */
function hexA(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
