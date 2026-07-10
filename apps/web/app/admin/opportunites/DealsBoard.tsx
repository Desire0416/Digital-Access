"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Handshake,
  LayoutGrid,
  Table2,
  RotateCcw,
  Search,
  FileText,
  Briefcase,
  Wallet,
  Scale,
  Trophy,
} from "lucide-react";
import {
  Card,
  cn,
  formatFCFA,
  formatDate,
  StaggerGroup,
  StaggerItem,
} from "@da/ui";
import { Select, type SelectOption } from "@/components/Select";
import { StatusPill, AdminPageHeader, StatCard, EmptyState } from "@/components/admin/ui";
import type { DealCard, DealPipelineStats, AssignableUser } from "@/lib/crm-types";
import {
  DEAL_STAGE_VALUES,
  DEAL_STAGE_LABEL,
  DEAL_STAGE_TONE,
  DEAL_KANBAN_STAGES,
  type DealStage,
} from "@/lib/crm-types";
import { updateDealStage } from "@/lib/crm-deal-actions";

/* ══════════════════════════════════════════════════════════════════════════
   DealsBoard — pilotage du pipeline commercial (vue kanban / tableau).
   Filtres synchronisés à l'URL ; changement d'étape inline via <Select>.
   ══════════════════════════════════════════════════════════════════════════ */

const GRID =
  "grid grid-cols-[minmax(220px,2.2fr)_150px_140px_110px_150px_90px_minmax(150px,1.2fr)] items-center gap-3";

export function DealsBoard({
  deals,
  stats,
  assignable,
  canAssign,
  filters,
}: {
  deals: DealCard[];
  stats: DealPipelineStats;
  assignable: AssignableUser[];
  canAssign: boolean;
  filters: { stage: string; assignee: string; q: string; view: "kanban" | "table" };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = React.useTransition();
  const [moveError, setMoveError] = React.useState<{ id: string; msg: string } | null>(null);
  const [searchInput, setSearchInput] = React.useState(filters.q);

  /* ── Synchronisation des filtres avec l'URL ─────────────────────────────── */
  const updateParams = React.useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const qs = params.toString();
      router.replace(qs ? `/admin/opportunites?${qs}` : "/admin/opportunites", { scroll: false });
    },
    [router, searchParams],
  );

  // Recherche texte avec anti-rebond de 350 ms.
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.q) updateParams({ q: searchInput });
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput, filters.q, updateParams]);

  const hasActiveFilters = Boolean(filters.stage || filters.assignee || filters.q);

  function handleReset() {
    setSearchInput("");
    const params = new URLSearchParams();
    if (filters.view === "table") params.set("view", "table");
    const qs = params.toString();
    router.replace(qs ? `/admin/opportunites?${qs}` : "/admin/opportunites", { scroll: false });
  }

  /* ── Changement d'étape (mutation) ──────────────────────────────────────── */
  function move(id: string, next: string, current: string) {
    if (next === current) return;
    setMoveError(null);
    let lossReason: string | undefined;
    if (next === "LOST") {
      const reason = window.prompt("Motif de la perte ?");
      if (reason === null) return; // annulé
      const trimmed = reason.trim();
      if (!trimmed) return; // motif vide → on annule
      lossReason = trimmed;
    }
    startTransition(async () => {
      const res = await updateDealStage({ id, stage: next as DealStage, lossReason });
      if (!res.ok) {
        setMoveError({ id, msg: res.error });
        return;
      }
      router.refresh();
    });
  }

  /* ── Options des selects ────────────────────────────────────────────────── */
  const stageFilterOptions: SelectOption[] = [
    { value: "", label: "Toutes les étapes" },
    ...DEAL_STAGE_VALUES.map((s) => ({ value: s, label: DEAL_STAGE_LABEL[s] })),
  ];
  const assigneeFilterOptions: SelectOption[] = [
    { value: "", label: "Tous les responsables" },
    ...assignable.map((u) => ({ value: u.id, label: u.name })),
  ];
  const moveOptions: SelectOption[] = DEAL_STAGE_VALUES.map((s) => ({
    value: s,
    label: DEAL_STAGE_LABEL[s],
  }));

  /* ── Fragments réutilisables ────────────────────────────────────────────── */
  function QuoteBadge({ count }: { count: number }) {
    if (count <= 0) return null;
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-brand-violet/10 px-2 py-0.5 text-[11px] font-semibold text-brand-violet">
        <FileText size={11} /> {count} devis
      </span>
    );
  }

  function MoveSelect({ d }: { d: DealCard }) {
    return (
      <div className="min-w-0">
        <Select
          ariaLabel={`Déplacer ${d.title}`}
          value={d.stage}
          onChange={(v) => move(d.id, v, d.stage)}
          options={moveOptions}
          disabled={isPending}
          buttonClassName="py-2 text-xs"
        />
        {moveError?.id === d.id && (
          <p className="mt-1 text-[11px] font-medium text-error">{moveError.msg}</p>
        )}
      </div>
    );
  }

  /* ── Rendu ──────────────────────────────────────────────────────────────── */
  return (
    <div>
      <AdminPageHeader
        title="Opportunités"
        description="Pipeline commercial : de la qualification à la signature."
      >
        {/* Bascule de vue */}
        <div className="inline-flex rounded-xl border border-navy/[0.1] bg-surface-primary p-1">
          {([
            ["kanban", LayoutGrid, "Kanban"],
            ["table", Table2, "Tableau"],
          ] as const).map(([v, Icon, label]) => {
            const active = filters.view === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => updateParams({ view: v === "kanban" ? "" : v })}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-gradient-da text-white shadow-sm"
                    : "text-text-secondary hover:text-navy",
                )}
              >
                <Icon size={15} /> {label}
              </button>
            );
          })}
        </div>
      </AdminPageHeader>

      {/* KPI pipeline */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Briefcase size={18} />}
          label="Ouvertes"
          value={stats.openCount}
          tone="blue"
        />
        <StatCard
          icon={<Wallet size={18} />}
          label="Valeur du pipeline"
          value={formatFCFA(stats.pipelineValue)}
          tone="violet"
        />
        <StatCard
          icon={<Scale size={18} />}
          label="Valeur pondérée"
          value={formatFCFA(stats.weightedValue)}
          hint="selon probabilité"
          tone="cyan"
        />
        <StatCard
          icon={<Trophy size={18} />}
          label="Gagnées"
          value={stats.wonCount}
          hint={formatFCFA(stats.wonValue)}
          tone="green"
        />
      </div>

      {/* Barre de filtres */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:w-64 sm:flex-1 lg:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher une opportunité…"
            aria-label="Rechercher une opportunité"
            className="w-full rounded-xl border border-navy/[0.1] bg-surface-primary py-2.5 pl-9 pr-3 text-sm font-medium text-navy transition-colors placeholder:text-text-muted hover:border-navy/20 focus:border-brand-blue-vif/40 focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/20"
          />
        </div>

        <div className="sm:w-52">
          <Select
            ariaLabel="Filtrer par étape"
            value={filters.stage || null}
            onChange={(v) => updateParams({ stage: v })}
            options={stageFilterOptions}
            placeholder="Étape"
          />
        </div>
        {canAssign && (
          <div className="sm:w-48">
            <Select
              ariaLabel="Filtrer par responsable"
              value={filters.assignee || null}
              onChange={(v) => updateParams({ assignee: v })}
              options={assigneeFilterOptions}
              placeholder="Responsable"
            />
          </div>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-navy/[0.1] px-3.5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-error/30 hover:text-error"
          >
            <RotateCcw size={15} /> Réinitialiser
          </button>
        )}
      </div>

      {/* Contenu */}
      {deals.length === 0 ? (
        <EmptyState
          icon={<Handshake size={22} />}
          title="Aucune opportunité"
          description={
            hasActiveFilters
              ? "Aucune opportunité ne correspond à vos filtres. Ajustez-les ou réinitialisez la recherche."
              : "Les opportunités se créent depuis la fiche d'un prospect qualifié : ouvrez un prospect et convertissez-le en opportunité."
          }
        >
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-navy/[0.12] bg-surface-primary px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-navy/25"
            >
              <RotateCcw size={16} /> Réinitialiser les filtres
            </button>
          ) : (
            <Link
              href="/admin/prospects"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-navy/[0.12] bg-surface-primary px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-navy/25"
            >
              <Briefcase size={16} /> Voir les prospects
            </Link>
          )}
        </EmptyState>
      ) : filters.view === "kanban" ? (
        /* ─────────────────────────── VUE KANBAN ─────────────────────────── */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {DEAL_KANBAN_STAGES.map((stage) => {
            const items = deals.filter((d) => d.stage === stage);
            const columnTotal = items.reduce((sum, d) => sum + (d.estimatedAmount ?? 0), 0);
            return (
              <div key={stage} className="flex w-72 shrink-0 flex-col">
                <div className="mb-3 px-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-navy">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: "linear-gradient(135deg,#5B3FA8,#00BCD4)" }}
                      />
                      <span className="truncate">{DEAL_STAGE_LABEL[stage]}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-navy/[0.06] px-2 py-0.5 text-xs font-semibold text-text-secondary">
                      {items.length}
                    </span>
                  </div>
                  {columnTotal > 0 && (
                    <p className="mt-1 pl-4 text-[11px] font-semibold text-text-muted">
                      {formatFCFA(columnTotal)}
                    </p>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-navy/10 px-3 py-6 text-center text-xs text-text-muted">
                    Vide
                  </div>
                ) : (
                  <StaggerGroup className="flex flex-col gap-3">
                    {items.map((d) => (
                      <StaggerItem key={d.id}>
                        <Card className="p-4">
                          <Link href={`/admin/opportunites/${d.id}`} className="group block">
                            <p className="truncate font-display text-sm font-bold text-navy transition-colors group-hover:text-brand-blue-royal">
                              {d.title}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-text-muted">
                              {d.organizationName}
                            </p>
                          </Link>

                          <div className="mt-2.5 flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-navy">
                              {d.estimatedAmount != null ? (
                                formatFCFA(d.estimatedAmount)
                              ) : (
                                <span className="font-normal text-text-muted">—</span>
                              )}
                            </span>
                            {d.probability != null && (
                              <span className="shrink-0 text-xs font-semibold text-brand-blue-royal">
                                {d.probability} %
                              </span>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <QuoteBadge count={d.quoteCount} />
                          </div>

                          <p className="mt-2.5 truncate text-xs text-text-secondary">
                            {d.assignedTo?.name ?? (
                              <span className="text-text-muted">Non attribué</span>
                            )}
                          </p>

                          <div className="mt-3 border-t border-navy/[0.06] pt-3">
                            <MoveSelect d={d} />
                          </div>
                        </Card>
                      </StaggerItem>
                    ))}
                  </StaggerGroup>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ─────────────────────────── VUE TABLEAU ────────────────────────── */
        <div className="overflow-x-auto rounded-2xl border border-navy/[0.07] bg-surface-primary">
          <div className="min-w-[1080px]">
            {/* En-tête */}
            <div
              className={cn(
                GRID,
                "border-b border-navy/[0.08] bg-surface-secondary/60 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted",
              )}
            >
              <span>Opportunité</span>
              <span>Étape</span>
              <span>Montant</span>
              <span>Probabilité</span>
              <span>Clôture prévue</span>
              <span>Devis</span>
              <span>Responsable</span>
            </div>

            <StaggerGroup>
              {deals.map((d) => (
                <StaggerItem key={d.id}>
                  <Link
                    href={`/admin/opportunites/${d.id}`}
                    className={cn(
                      GRID,
                      "group border-b border-navy/[0.05] px-4 py-3.5 transition-colors last:border-b-0 hover:bg-navy/[0.02]",
                    )}
                  >
                    {/* Opportunité */}
                    <div className="min-w-0">
                      <span className="block truncate font-display text-sm font-semibold text-navy transition-colors group-hover:text-brand-blue-royal">
                        {d.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-text-muted">
                        {d.organizationName}
                      </span>
                    </div>

                    {/* Étape */}
                    <div className="min-w-0">
                      <StatusPill tone={DEAL_STAGE_TONE[d.stage]} label={DEAL_STAGE_LABEL[d.stage]} />
                    </div>

                    {/* Montant */}
                    <div className="min-w-0 text-sm font-semibold text-navy">
                      {d.estimatedAmount != null ? (
                        formatFCFA(d.estimatedAmount)
                      ) : (
                        <span className="font-normal text-text-muted">—</span>
                      )}
                    </div>

                    {/* Probabilité */}
                    <div className="min-w-0 text-sm text-text-secondary">
                      {d.probability != null ? (
                        `${d.probability} %`
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </div>

                    {/* Clôture prévue */}
                    <div className="min-w-0 text-xs text-text-secondary">
                      {d.expectedCloseDate ? (
                        formatDate(d.expectedCloseDate)
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </div>

                    {/* Devis */}
                    <div className="min-w-0 text-sm text-text-secondary">
                      {d.quoteCount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-brand-violet">
                          <FileText size={13} /> {d.quoteCount}
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </div>

                    {/* Responsable */}
                    <div className="min-w-0 truncate text-sm text-text-secondary">
                      {d.assignedTo?.name ?? <span className="text-text-muted">Non attribué</span>}
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </div>
      )}
    </div>
  );
}
