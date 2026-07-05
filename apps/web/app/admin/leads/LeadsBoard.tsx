"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Coins,
  MoveRight,
  Radio,
  Sparkles,
  UserRound,
  Check,
  ChevronRight,
} from "lucide-react";
import { cn, formatDate } from "@da/ui";
import { LEAD_STATUS, PROJECT_TYPE, toneColor, type Tone } from "@/components/admin/ui";
import { updateLeadStatus } from "@/lib/admin-actions";
import type { LeadCard } from "@/lib/admin-queries";

/* Ordre canonique des colonnes du pipeline. */
const COLUMNS = ["NEW", "CONTACTED", "QUOTE_SENT", "NEGOTIATION", "WON", "LOST"] as const;
type LeadStatus = (typeof COLUMNS)[number];

export function LeadsBoard({
  leads,
  admins,
}: {
  leads: LeadCard[];
  admins: { id: string; name: string }[];
}) {
  // Menu "déplacer vers" ouvert (par id de lead) — un seul à la fois.
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
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

      {/* Board défilant horizontalement — le scroll reste contenu, jamais de débordement de page. */}
      <div className="-mx-1 overflow-x-auto pb-4 [scrollbar-width:thin]">
        <div className="flex min-w-max snap-x snap-mandatory gap-4 px-1">
          {COLUMNS.map((status) => (
            <Column
              key={status}
              status={status}
              leads={grouped[status]}
              openMenu={openMenu}
              setOpenMenu={setOpenMenu}
              setError={setError}
            />
          ))}
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-text-muted">
        <ChevronRight className="h-3.5 w-3.5" />
        Faites défiler horizontalement pour parcourir le pipeline. Utilisez « Déplacer » sur une
        carte pour changer son statut.
      </p>
    </div>
  );
}

/* ─────────────────────────────── Colonne ───────────────────────────────── */

function Column({
  status,
  leads,
  openMenu,
  setOpenMenu,
  setError,
}: {
  status: LeadStatus;
  leads: LeadCard[];
  openMenu: string | null;
  setOpenMenu: (id: string | null) => void;
  setError: (e: string | null) => void;
}) {
  const meta = LEAD_STATUS[status]!;
  const tone = meta.tone as Tone;
  const accent = toneColor(tone);

  return (
    <section
      className="flex w-[86vw] max-w-[320px] shrink-0 snap-start flex-col rounded-2xl border border-navy/[0.07] bg-surface-secondary/60 sm:w-80"
      aria-label={`Colonne ${meta.label}`}
    >
      {/* En-tête coloré */}
      <header
        className="flex items-center justify-between gap-2 rounded-t-2xl border-b border-navy/[0.06] px-4 py-3"
        style={{ background: `linear-gradient(180deg, ${hexA(accent, 0.1)}, transparent)` }}
      >
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} />
          <span className="font-display text-sm font-bold text-navy">{meta.label}</span>
        </span>
        <span
          className="grid min-w-6 place-items-center rounded-full px-1.5 py-0.5 text-xs font-bold"
          style={{ background: hexA(accent, 0.14), color: accent }}
        >
          {leads.length}
        </span>
      </header>

      {/* Cartes */}
      <div className="flex flex-1 flex-col gap-3 p-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {leads.length === 0 ? (
            <motion.p
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl border border-dashed border-navy/10 px-3 py-6 text-center text-xs text-text-muted"
            >
              Aucun lead ici.
            </motion.p>
          ) : (
            leads.map((lead) => (
              <LeadKanbanCard
                key={lead.id}
                lead={lead}
                menuOpen={openMenu === lead.id}
                onToggleMenu={() => setOpenMenu(openMenu === lead.id ? null : lead.id)}
                onCloseMenu={() => setOpenMenu(null)}
                setError={setError}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ──────────────────────────── Carte de lead ────────────────────────────── */

function LeadKanbanCard({
  lead,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  setError,
}: {
  lead: LeadCard;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  setError: (e: string | null) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const move = (status: LeadStatus) => {
    if (status === lead.status) {
      onCloseMenu();
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await updateLeadStatus({ id: lead.id, status });
      if (res.ok) {
        onCloseMenu();
        router.refresh();
      } else {
        setError(res.error);
        onCloseMenu();
      }
    });
  };

  return (
    <motion.article
      layout
      layoutId={lead.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className={cn(
        "group relative rounded-2xl border border-navy/[0.07] bg-surface-primary p-3.5 transition-shadow",
        "hover:shadow-lg",
        pending && "opacity-60",
      )}
    >
      {/* Corps cliquable → détail */}
      <Link href={`/admin/leads/${lead.id}`} className="block focus:outline-none">
        <div className="flex items-start justify-between gap-2">
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
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-full bg-brand-violet/10 px-2 py-0.5 text-[11px] font-semibold text-brand-violet">
            {PROJECT_TYPE[lead.projectType] ?? lead.projectType}
          </span>
          {lead.budget && (
            <span className="inline-flex items-center gap-1 rounded-full bg-navy/[0.05] px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
              <Coins className="h-3 w-3" />
              {lead.budget}
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

      {/* Barre d'action : déplacer vers */}
      <div className="mt-3 border-t border-navy/[0.06] pt-2.5">
        <button
          type="button"
          onClick={onToggleMenu}
          disabled={pending}
          aria-expanded={menuOpen}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-text-secondary transition-colors",
            "hover:bg-navy/[0.04] hover:text-navy disabled:opacity-50",
          )}
        >
          <MoveRight className="h-3.5 w-3.5" />
          {pending ? "Déplacement…" : "Déplacer vers"}
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-2 grid grid-cols-1 gap-1">
                {COLUMNS.map((s) => {
                  const m = LEAD_STATUS[s]!;
                  const active = s === lead.status;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => move(s)}
                      disabled={active || pending}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                        active
                          ? "cursor-default bg-navy/[0.04] text-text-muted"
                          : "hover:bg-navy/[0.04] text-navy",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: toneColor(m.tone as Tone) }}
                        />
                        {m.label}
                      </span>
                      {active && <Check className="h-3.5 w-3.5 text-success" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
