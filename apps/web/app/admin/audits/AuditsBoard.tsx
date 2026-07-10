"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileSearch,
  RotateCcw,
  Search,
  ShieldAlert,
  ClipboardCheck,
  ListChecks,
  User as UserIcon,
  ArrowRight,
} from "lucide-react";
import { Card, buttonClasses, cn, formatDate, StaggerGroup, StaggerItem } from "@da/ui";
import { Select, type SelectOption } from "@/components/Select";
import { StatusPill, AdminPageHeader, EmptyState } from "@/components/admin/ui";
import type { AuditListRow } from "@/lib/crm-types";
import {
  AUDIT_STATUS_VALUES,
  AUDIT_STATUS_LABEL,
  AUDIT_STATUS_TONE,
  AUDIT_SEVERITY_VALUES,
  AUDIT_SEVERITY_LABEL,
  AUDIT_SEVERITY_TONE,
} from "@/lib/crm-types";

/* ══════════════════════════════════════════════════════════════════════════
   AuditsBoard — pilotage des audits (diagnostics numériques des prospects).
   File de validation admin en tête, filtres synchronisés à l'URL, tableau
   responsive cliquable vers le détail. Aucune mutation ici : lecture + nav.
   ══════════════════════════════════════════════════════════════════════════ */

const GRID =
  "grid grid-cols-[minmax(240px,2.4fr)_minmax(160px,1.4fr)_140px_128px_96px_minmax(140px,1fr)_120px] items-center gap-3";

export function AuditsBoard({
  audits,
  reviewQueue,
  canValidate,
  filters,
}: {
  audits: AuditListRow[];
  reviewQueue: AuditListRow[];
  canValidate: boolean;
  filters: { status: string; severity: string; q: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      router.replace(qs ? `/admin/audits?${qs}` : "/admin/audits", { scroll: false });
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

  const hasActiveFilters = Boolean(filters.status || filters.severity || filters.q);

  function handleReset() {
    setSearchInput("");
    router.replace("/admin/audits", { scroll: false });
  }

  /* ── Options des selects ────────────────────────────────────────────────── */
  const statusFilterOptions: SelectOption[] = [
    { value: "", label: "Tous les statuts" },
    ...AUDIT_STATUS_VALUES.map((s) => ({ value: s, label: AUDIT_STATUS_LABEL[s] })),
  ];
  const severityFilterOptions: SelectOption[] = [
    { value: "", label: "Toutes les gravités" },
    ...AUDIT_SEVERITY_VALUES.map((s) => ({ value: s, label: AUDIT_SEVERITY_LABEL[s] })),
  ];

  /* ── Rendu ──────────────────────────────────────────────────────────────── */
  return (
    <div>
      <AdminPageHeader
        title="Audits"
        description="Diagnostics numériques des prospects : rédaction, validation et envoi."
      />

      {/* ── File de validation admin ─────────────────────────────────────────
          Bandeau ambré : audits en attente de validation, lien direct au détail. */}
      {canValidate && reviewQueue.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-warning/30 bg-warning/[0.06]">
          <div className="flex items-center justify-between gap-3 border-b border-warning/20 px-4 py-3 sm:px-5">
            <span className="flex items-center gap-2 font-display text-sm font-bold text-[#B45309]">
              <ClipboardCheck size={17} />
              À valider
            </span>
            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-warning/20 px-2 py-0.5 text-xs font-bold text-[#B45309]">
              {reviewQueue.length}
            </span>
          </div>

          <StaggerGroup className="divide-y divide-warning/15">
            {reviewQueue.map((a) => (
              <StaggerItem key={a.id}>
                <Link
                  href={`/admin/audits/${a.id}`}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-warning/[0.08] sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-mono text-xs font-semibold text-text-secondary">
                        {a.reference}
                      </span>
                      <span className="truncate font-display text-sm font-semibold text-navy transition-colors group-hover:text-brand-blue-royal">
                        {a.title}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-text-muted">
                      {a.organizationName}
                      {a.authorName ? ` · ${a.authorName}` : ""}
                    </span>
                  </div>

                  {a.overallSeverity && (
                    <StatusPill
                      tone={AUDIT_SEVERITY_TONE[a.overallSeverity]}
                      label={AUDIT_SEVERITY_LABEL[a.overallSeverity]}
                      className="shrink-0"
                    />
                  )}
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-blue-royal"
                  />
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      )}

      {/* ── Barre de filtres ─────────────────────────────────────────────────── */}
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
            placeholder="Rechercher un audit…"
            aria-label="Rechercher un audit"
            className="w-full rounded-xl border border-navy/[0.1] bg-surface-primary py-2.5 pl-9 pr-3 text-sm font-medium text-navy transition-colors placeholder:text-text-muted hover:border-navy/20 focus:border-brand-blue-vif/40 focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/20"
          />
        </div>

        <div className="sm:w-48">
          <Select
            ariaLabel="Filtrer par statut"
            value={filters.status || null}
            onChange={(v) => updateParams({ status: v })}
            options={statusFilterOptions}
            placeholder="Statut"
          />
        </div>
        <div className="sm:w-48">
          <Select
            ariaLabel="Filtrer par gravité"
            value={filters.severity || null}
            onChange={(v) => updateParams({ severity: v })}
            options={severityFilterOptions}
            placeholder="Gravité"
          />
        </div>

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

      {/* ── Liste des audits ─────────────────────────────────────────────────── */}
      {audits.length === 0 ? (
        <EmptyState
          icon={<FileSearch size={22} />}
          title="Aucun audit"
          description={
            hasActiveFilters
              ? "Aucun audit ne correspond à vos filtres. Ajustez-les ou réinitialisez la recherche."
              : "Les audits se créent depuis la fiche d'un prospect. Ouvrez un prospect pour lancer un diagnostic numérique."
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
              href="/admin/prospects"
              className={buttonClasses({ variant: "primary", className: "gap-2" })}
            >
              <ShieldAlert size={16} /> Voir les prospects
            </Link>
          )}
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-navy/[0.07] bg-surface-primary">
          <div className="min-w-[1000px]">
            {/* En-tête */}
            <div
              className={cn(
                GRID,
                "border-b border-navy/[0.08] bg-surface-secondary/60 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted",
              )}
            >
              <span>Audit</span>
              <span>Organisation</span>
              <span>Statut</span>
              <span>Gravité</span>
              <span>Constats</span>
              <span>Auteur</span>
              <span>Date</span>
            </div>

            <StaggerGroup>
              {audits.map((a) => (
                <StaggerItem key={a.id}>
                  <Link
                    href={`/admin/audits/${a.id}`}
                    className={cn(
                      GRID,
                      "group border-b border-navy/[0.05] px-4 py-3.5 transition-colors last:border-b-0 hover:bg-navy/[0.02]",
                    )}
                  >
                    {/* Référence + Titre */}
                    <div className="min-w-0">
                      <span className="block truncate font-mono text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                        {a.reference}
                      </span>
                      <span className="mt-0.5 block truncate font-display text-sm font-semibold text-navy transition-colors group-hover:text-brand-blue-royal">
                        {a.title}
                      </span>
                    </div>

                    {/* Organisation */}
                    <div className="min-w-0 truncate text-sm text-text-secondary">
                      {a.organizationName}
                    </div>

                    {/* Statut */}
                    <div className="min-w-0">
                      <StatusPill
                        tone={AUDIT_STATUS_TONE[a.status]}
                        label={AUDIT_STATUS_LABEL[a.status]}
                      />
                    </div>

                    {/* Gravité */}
                    <div className="min-w-0">
                      {a.overallSeverity ? (
                        <StatusPill
                          tone={AUDIT_SEVERITY_TONE[a.overallSeverity]}
                          label={AUDIT_SEVERITY_LABEL[a.overallSeverity]}
                        />
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </div>

                    {/* Nb de constats */}
                    <div className="min-w-0">
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy">
                        <ListChecks size={14} className="text-text-muted" />
                        {a.findingCount}
                      </span>
                    </div>

                    {/* Auteur */}
                    <div className="min-w-0 truncate text-sm text-text-secondary">
                      {a.authorName ? (
                        <span className="inline-flex items-center gap-1.5">
                          <UserIcon size={13} className="shrink-0 text-text-muted" />
                          <span className="truncate">{a.authorName}</span>
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="min-w-0 text-xs text-text-secondary">
                      {formatDate(a.auditDate ?? a.updatedAt)}
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
