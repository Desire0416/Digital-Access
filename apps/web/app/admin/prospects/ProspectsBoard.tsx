"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  LayoutGrid,
  Table2,
  Plus,
  RotateCcw,
  Search,
  CalendarClock,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  buttonClasses,
  cn,
  formatFCFA,
  formatDate,
  StaggerGroup,
  StaggerItem,
} from "@da/ui";
import { Select, type SelectOption } from "@/components/Select";
import { StatusPill, AdminPageHeader, EmptyState } from "@/components/admin/ui";
import type { ProspectCard, AssignableUser } from "@/lib/crm-types";
import {
  PROSPECT_STATUS_VALUES,
  PROSPECT_STATUS_LABEL,
  PROSPECT_STATUS_TONE,
  PROSPECT_KANBAN_STAGES,
  PRIORITY_VALUES,
  PRIORITY_LABEL,
  PRIORITY_TONE,
  ORG_TYPE_LABEL,
  AUDIT_SEVERITY_LABEL,
  AUDIT_SEVERITY_TONE,
  type ProspectStatus,
} from "@/lib/crm-types";
import { updateProspectStatus } from "@/lib/crm-actions";

/* ══════════════════════════════════════════════════════════════════════════
   ProspectsBoard — pilotage CRM des prospects (vue tableau / kanban).
   Filtres synchronisés à l'URL ; changement de statut inline via <Select>.
   ══════════════════════════════════════════════════════════════════════════ */

const GRID =
  "grid grid-cols-[minmax(220px,2fr)_132px_122px_150px_minmax(200px,1.5fr)_132px_128px_180px] items-center gap-3";

/** Vrai si la date (YYYY-MM-DD ou ISO) est strictement antérieure à aujourd'hui. */
function isOverdue(date: string | null): boolean {
  if (!date) return false;
  const dt = new Date(date);
  if (Number.isNaN(dt.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dt < today;
}

export function ProspectsBoard({
  prospects,
  assignable,
  sectors,
  canAssign,
  scopeAll,
  filters,
}: {
  prospects: ProspectCard[];
  assignable: AssignableUser[];
  sectors: string[];
  canAssign: boolean;
  scopeAll: boolean;
  filters: {
    status: string;
    sector: string;
    priority: string;
    assignee: string;
    city: string;
    source: string;
    maturity: string;
    q: string;
    view: "table" | "kanban";
  };
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
      router.replace(qs ? `/admin/prospects?${qs}` : "/admin/prospects", { scroll: false });
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

  const hasActiveFilters = Boolean(
    filters.status ||
      filters.sector ||
      filters.priority ||
      filters.assignee ||
      filters.city ||
      filters.source ||
      filters.maturity ||
      filters.q,
  );

  function handleReset() {
    setSearchInput("");
    const params = new URLSearchParams();
    if (filters.view === "kanban") params.set("view", "kanban");
    const qs = params.toString();
    router.replace(qs ? `/admin/prospects?${qs}` : "/admin/prospects", { scroll: false });
  }

  /* ── Changement de statut (mutation) ────────────────────────────────────── */
  function move(id: string, next: string, current: string) {
    if (next === current) return;
    setMoveError(null);
    startTransition(async () => {
      const res = await updateProspectStatus({ id, status: next as ProspectStatus });
      if (!res.ok) {
        setMoveError({ id, msg: res.error });
        return;
      }
      router.refresh();
    });
  }

  /* ── Options des selects ────────────────────────────────────────────────── */
  const statusFilterOptions: SelectOption[] = [
    { value: "", label: "Tous les statuts" },
    ...PROSPECT_STATUS_VALUES.map((s) => ({ value: s, label: PROSPECT_STATUS_LABEL[s] })),
  ];
  const sectorFilterOptions: SelectOption[] = [
    { value: "", label: "Tous les secteurs" },
    ...sectors.map((s) => ({ value: s, label: s })),
  ];
  const priorityFilterOptions: SelectOption[] = [
    { value: "", label: "Toutes les priorités" },
    ...PRIORITY_VALUES.map((p) => ({ value: p, label: PRIORITY_LABEL[p] })),
  ];
  const assigneeFilterOptions: SelectOption[] = [
    { value: "", label: "Tous les responsables" },
    ...assignable.map((u) => ({ value: u.id, label: u.name })),
  ];
  const moveOptions: SelectOption[] = PROSPECT_STATUS_VALUES.map((s) => ({
    value: s,
    label: PROSPECT_STATUS_LABEL[s],
  }));

  /* ── Fragments réutilisables ────────────────────────────────────────────── */
  function AuditBadge({ p }: { p: ProspectCard }) {
    if (p.auditCount <= 0) return null;
    return (
      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-navy/[0.06] px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
          <ShieldAlert size={11} /> {p.auditCount} audit{p.auditCount > 1 ? "s" : ""}
        </span>
        {p.lastAuditSeverity && (
          <StatusPill
            dot={false}
            tone={AUDIT_SEVERITY_TONE[p.lastAuditSeverity]}
            label={AUDIT_SEVERITY_LABEL[p.lastAuditSeverity]}
            className="px-2 py-0.5 text-[11px]"
          />
        )}
      </span>
    );
  }

  function NextAction({ p, compact }: { p: ProspectCard; compact?: boolean }) {
    const overdue = isOverdue(p.nextActionDate);
    if (!p.nextAction) return <span className="text-xs text-text-muted">—</span>;
    return (
      <div className="min-w-0">
        <p
          className={cn(
            compact ? "line-clamp-2" : "truncate",
            "text-xs font-medium",
            overdue ? "text-error" : "text-navy",
          )}
        >
          {p.nextAction}
        </p>
        {p.nextActionDate && (
          <p
            className={cn(
              "mt-0.5 flex items-center gap-1 text-[11px]",
              overdue ? "font-semibold text-error" : "text-text-muted",
            )}
          >
            {overdue ? <AlertTriangle size={11} /> : <CalendarClock size={11} />}
            {formatDate(p.nextActionDate)}
            {overdue ? " · en retard" : ""}
          </p>
        )}
      </div>
    );
  }

  function MoveSelect({ p, className }: { p: ProspectCard; className?: string }) {
    return (
      <div className={cn("min-w-0", className)}>
        <Select
          ariaLabel={`Déplacer ${p.organizationName}`}
          value={p.status}
          onChange={(v) => move(p.id, v, p.status)}
          options={moveOptions}
          disabled={isPending}
          buttonClassName="py-2 text-xs"
        />
        {moveError?.id === p.id && (
          <p className="mt-1 text-[11px] font-medium text-error">{moveError.msg}</p>
        )}
      </div>
    );
  }

  /* ── Rendu ──────────────────────────────────────────────────────────────── */
  return (
    <div>
      <AdminPageHeader
        title="Prospects"
        description={
          scopeAll
            ? "Pilotez l'ensemble des organisations prospectées par l'agence."
            : "Les prospects qui vous sont attribués, à faire avancer dans le pipeline."
        }
      >
        {/* Bascule de vue */}
        <div className="inline-flex rounded-xl border border-navy/[0.1] bg-surface-primary p-1">
          {([
            ["table", Table2, "Tableau"],
            ["kanban", LayoutGrid, "Kanban"],
          ] as const).map(([v, Icon, label]) => {
            const active = filters.view === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => updateParams({ view: v === "table" ? "" : v })}
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

        <Link
          href="/admin/prospects/nouveau"
          className={buttonClasses({ variant: "primary", className: "gap-2" })}
        >
          <Plus size={16} /> Nouveau prospect
        </Link>
      </AdminPageHeader>

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
            placeholder="Rechercher une organisation…"
            aria-label="Rechercher un prospect"
            className="w-full rounded-xl border border-navy/[0.1] bg-surface-primary py-2.5 pl-9 pr-3 text-sm font-medium text-navy transition-colors placeholder:text-text-muted hover:border-navy/20 focus:border-brand-blue-vif/40 focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/20"
          />
        </div>

        <div className="sm:w-44">
          <Select
            ariaLabel="Filtrer par statut"
            value={filters.status || null}
            onChange={(v) => updateParams({ status: v })}
            options={statusFilterOptions}
            placeholder="Statut"
          />
        </div>
        <div className="sm:w-44">
          <Select
            ariaLabel="Filtrer par secteur"
            value={filters.sector || null}
            onChange={(v) => updateParams({ sector: v })}
            options={sectorFilterOptions}
            placeholder="Secteur"
            disabled={sectors.length === 0}
          />
        </div>
        <div className="sm:w-44">
          <Select
            ariaLabel="Filtrer par priorité"
            value={filters.priority || null}
            onChange={(v) => updateParams({ priority: v })}
            options={priorityFilterOptions}
            placeholder="Priorité"
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
      {prospects.length === 0 ? (
        <EmptyState
          icon={<Building2 size={22} />}
          title="Aucun prospect"
          description={
            hasActiveFilters
              ? "Aucun prospect ne correspond à vos filtres. Ajustez-les ou réinitialisez la recherche."
              : "Commencez par ajouter votre première organisation à prospecter."
          }
        >
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleReset}
              className={buttonClasses({ variant: "secondary", className: "gap-2" })}
            >
              <RotateCcw size={16} /> Réinitialiser les filtres
            </button>
          ) : (
            <Link
              href="/admin/prospects/nouveau"
              className={buttonClasses({ variant: "primary", className: "gap-2" })}
            >
              <Plus size={16} /> Ajouter un prospect
            </Link>
          )}
        </EmptyState>
      ) : filters.view === "kanban" ? (
        /* ─────────────────────────── VUE KANBAN ─────────────────────────── */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {PROSPECT_KANBAN_STAGES.map((stage) => {
            const items = prospects.filter((p) => p.status === stage);
            return (
              <div key={stage} className="flex w-72 shrink-0 flex-col">
                <div className="mb-3 flex items-center justify-between gap-2 px-1">
                  <span className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        background:
                          "linear-gradient(135deg,#5B3FA8,#00BCD4)",
                      }}
                    />
                    {PROSPECT_STATUS_LABEL[stage]}
                  </span>
                  <span className="rounded-full bg-navy/[0.06] px-2 py-0.5 text-xs font-semibold text-text-secondary">
                    {items.length}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-navy/10 px-3 py-6 text-center text-xs text-text-muted">
                    Vide
                  </div>
                ) : (
                  <StaggerGroup className="flex flex-col gap-3">
                    {items.map((p) => (
                      <StaggerItem key={p.id}>
                        <Card className="p-4">
                          <Link href={`/admin/prospects/${p.id}`} className="group block">
                            <p className="truncate font-display text-sm font-bold text-navy transition-colors group-hover:text-brand-blue-royal">
                              {p.organizationName}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-text-muted">
                              {ORG_TYPE_LABEL[p.organizationType]}
                              {p.sector ? ` · ${p.sector}` : ""}
                            </p>
                          </Link>

                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            {p.priority && (
                              <StatusPill
                                tone={PRIORITY_TONE[p.priority]}
                                label={PRIORITY_LABEL[p.priority]}
                              />
                            )}
                          </div>
                          <AuditBadge p={p} />

                          {p.nextAction && (
                            <div className="mt-2.5">
                              <NextAction p={p} compact />
                            </div>
                          )}

                          {p.estimatedPotential != null && (
                            <p className="mt-2.5 text-xs font-semibold text-navy">
                              {formatFCFA(p.estimatedPotential)}
                            </p>
                          )}

                          <div className="mt-3 border-t border-navy/[0.06] pt-3">
                            <MoveSelect p={p} />
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
          <div className="min-w-[1200px]">
            {/* En-tête */}
            <div
              className={cn(
                GRID,
                "border-b border-navy/[0.08] bg-surface-secondary/60 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted",
              )}
            >
              <span>Organisation</span>
              <span>Statut</span>
              <span>Priorité</span>
              <span>Responsable</span>
              <span>Prochaine action</span>
              <span>Potentiel</span>
              <span>Dernière activité</span>
              <span>Déplacer</span>
            </div>

            <StaggerGroup>
              {prospects.map((p) => (
                <StaggerItem key={p.id}>
                  <div
                    className={cn(
                      GRID,
                      "border-b border-navy/[0.05] px-4 py-3.5 transition-colors last:border-b-0 hover:bg-navy/[0.02]",
                    )}
                  >
                    {/* Organisation */}
                    <Link href={`/admin/prospects/${p.id}`} className="group min-w-0">
                      <span className="block truncate font-display text-sm font-semibold text-navy transition-colors group-hover:text-brand-blue-royal">
                        {p.organizationName}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-text-muted">
                        {ORG_TYPE_LABEL[p.organizationType]}
                        {p.sector ? ` · ${p.sector}` : ""}
                        {p.city ? ` · ${p.city}` : ""}
                      </span>
                      <AuditBadge p={p} />
                    </Link>

                    {/* Statut */}
                    <div className="min-w-0">
                      <StatusPill
                        tone={PROSPECT_STATUS_TONE[p.status]}
                        label={PROSPECT_STATUS_LABEL[p.status]}
                      />
                    </div>

                    {/* Priorité */}
                    <div className="min-w-0">
                      {p.priority ? (
                        <StatusPill
                          tone={PRIORITY_TONE[p.priority]}
                          label={PRIORITY_LABEL[p.priority]}
                        />
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </div>

                    {/* Responsable */}
                    <div className="min-w-0 truncate text-sm text-text-secondary">
                      {p.assignedTo?.name ?? (
                        <span className="text-text-muted">Non attribué</span>
                      )}
                    </div>

                    {/* Prochaine action */}
                    <NextAction p={p} />

                    {/* Potentiel */}
                    <div className="min-w-0 text-sm font-semibold text-navy">
                      {p.estimatedPotential != null ? (
                        formatFCFA(p.estimatedPotential)
                      ) : (
                        <span className="font-normal text-text-muted">—</span>
                      )}
                    </div>

                    {/* Dernière activité */}
                    <div className="min-w-0 text-xs text-text-secondary">
                      {p.lastActivityAt ? (
                        formatDate(p.lastActivityAt)
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </div>

                    {/* Déplacer */}
                    <MoveSelect p={p} />
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </div>
      )}
    </div>
  );
}
