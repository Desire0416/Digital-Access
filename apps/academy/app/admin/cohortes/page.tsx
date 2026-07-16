import type { Metadata } from "next";
import Link from "next/link";
import { UsersRound, Users, CalendarDays, Layers, ChevronRight, Search, BookOpen, Route } from "lucide-react";
import type { CohortStatus } from "@da/academy-db/client";
import { listCohortsAdmin } from "@/lib/cohort-admin-queries";
import { createCohort } from "@/lib/cohort-admin-actions";
import { AdminPageHeader, AdminCard, StatusPill, AdminEmpty, type PillTone } from "@/components/admin/ui";
import { QuickCreate } from "@/components/admin/QuickCreate";

export const metadata: Metadata = { title: "Cohortes — Administration" };

/* ─── Libellés & tons locaux (CohortStatus / CohortType) ───────────────────── */

const COHORT_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  OPEN: "Inscriptions ouvertes",
  RUNNING: "En cours",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

const COHORT_STATUS_TONE: Record<string, PillTone> = {
  DRAFT: "neutral",
  OPEN: "success",
  RUNNING: "info",
  COMPLETED: "violet",
  CANCELLED: "danger",
};

const COHORT_TYPE_LABEL: Record<string, string> = {
  AUTONOMOUS: "Autonome",
  GUIDED: "Accompagnée",
  INTENSIVE: "Intensive",
  ENTERPRISE: "Entreprise",
  HYBRID: "Hybride",
  VIRTUAL_CLASS: "Classe virtuelle",
};

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "DRAFT", label: "Brouillons" },
  { value: "OPEN", label: "Inscriptions ouvertes" },
  { value: "RUNNING", label: "En cours" },
  { value: "COMPLETED", label: "Terminées" },
  { value: "CANCELLED", label: "Annulées" },
];

const VALID_STATUS = new Set<CohortStatus>(["DRAFT", "OPEN", "RUNNING", "COMPLETED", "CANCELLED"]);

const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
function formatDate(d: Date | string | null | undefined): string {
  return d ? dateFmt.format(new Date(d)) : "—";
}

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminCohortesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = one(sp.q)?.trim() ?? "";
  const statusParam = one(sp.status) as CohortStatus | undefined;
  const status = statusParam && VALID_STATUS.has(statusParam) ? statusParam : undefined;

  const cohorts = await listCohortsAdmin({ q, status });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Accompagnement"
        title="Cohortes"
        description="Une cohorte réunit un groupe d'apprenants autour d'une formation ou d'un parcours, avec un calendrier, des encadrants et des sessions. Ouvrez une cohorte pour gérer sa fiche, ses membres et son planning."
        actions={
          <QuickCreate
            action={createCohort}
            redirectBase="/admin/cohortes"
            buttonLabel="Nouvelle cohorte"
            modalTitle="Créer une cohorte"
            fieldLabel="Nom de la cohorte"
            placeholder="Ex. Promo Data Analyst — Janv. 2026"
          />
        }
      />

      {/* Recherche + filtres de statut */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form method="GET" role="search" className="relative w-full lg:max-w-sm">
          {status && <input type="hidden" name="status" value={status} />}
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Rechercher une cohorte…"
            aria-label="Rechercher une cohorte"
            className="h-11 w-full rounded-xl border border-navy/10 bg-surface-primary pl-10 pr-4 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-vif/60"
          />
        </form>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {STATUS_FILTERS.map((f) => {
            const active = (status ?? "") === f.value;
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (f.value) params.set("status", f.value);
            const href = `/admin/cohortes${params.toString() ? `?${params}` : ""}`;
            return (
              <a
                key={f.value || "all"}
                href={href}
                aria-current={active ? "true" : undefined}
                className={
                  active
                    ? "shrink-0 rounded-full bg-gradient-da px-3.5 py-1.5 text-xs font-semibold text-white"
                    : "shrink-0 rounded-full border border-navy/10 px-3.5 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-brand-blue-vif/40 hover:text-navy"
                }
              >
                {f.label}
              </a>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-text-muted">
        {cohorts.length} cohorte{cohorts.length > 1 ? "s" : ""}
        {q && <> pour « {q} »</>}
      </p>

      <AdminCard className="overflow-hidden">
        {cohorts.length === 0 ? (
          <AdminEmpty
            icon={<UsersRound size={34} className="text-text-muted opacity-50" />}
            title="Aucune cohorte"
            description={q || status ? "Aucun résultat pour ce filtre." : "Créez votre première cohorte pour organiser un groupe d'apprenants."}
          />
        ) : (
          <>
            {/* Tableau (desktop) */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy/[0.07] text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3">Cohorte</th>
                    <th className="px-4 py-3">Cible</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Effectif</th>
                    <th className="px-4 py-3">Sessions</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-5 py-3 text-right">Ouvrir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/[0.05]">
                  {cohorts.map((c) => {
                    const targetTitle = c.course?.title ?? c.careerPath?.title ?? null;
                    const isPath = !c.course && !!c.careerPath;
                    return (
                      <tr key={c.id} className="group transition-colors hover:bg-surface-secondary/50">
                        <td className="px-5 py-3">
                          <Link href={`/admin/cohortes/${c.id}`} className="flex min-w-0 items-center gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-navy group-hover:text-brand-blue-royal">{c.name}</p>
                              <p className="truncate text-xs text-text-muted">/{c.slug}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {targetTitle ? (
                            <span className="inline-flex items-center gap-1.5">
                              {isPath ? <Route size={13} className="shrink-0 text-brand-violet" /> : <BookOpen size={13} className="shrink-0 text-brand-blue-royal" />}
                              <span className="truncate">{targetTitle}</span>
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{COHORT_TYPE_LABEL[c.type] ?? c.type}</td>
                        <td className="px-4 py-3 text-text-secondary">
                          {formatDate(c.startDate)}
                          {c.endDate && <span className="text-text-muted"> → {formatDate(c.endDate)}</span>}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {c._count.members}
                          {c.capacity ? <span className="text-text-muted"> / {c.capacity}</span> : null}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{c._count.events}</td>
                        <td className="px-4 py-3">
                          <StatusPill label={COHORT_STATUS_LABEL[c.status] ?? c.status} tone={COHORT_STATUS_TONE[c.status] ?? "neutral"} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/admin/cohortes/${c.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-navy/10 px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal"
                          >
                            Gérer <ChevronRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cartes (mobile) */}
            <ul className="divide-y divide-navy/[0.05] lg:hidden">
              {cohorts.map((c) => {
                const targetTitle = c.course?.title ?? c.careerPath?.title ?? "Sans cible";
                return (
                  <li key={c.id}>
                    <Link href={`/admin/cohortes/${c.id}`} className="block p-4 transition-colors hover:bg-surface-secondary/50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-navy">{c.name}</p>
                          <p className="mt-0.5 truncate text-xs text-text-muted">
                            {targetTitle} · {COHORT_TYPE_LABEL[c.type] ?? c.type}
                          </p>
                        </div>
                        <StatusPill label={COHORT_STATUS_LABEL[c.status] ?? c.status} tone={COHORT_STATUS_TONE[c.status] ?? "neutral"} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                        <span className="inline-flex items-center gap-1">
                          <Users size={12} /> {c._count.members}
                          {c.capacity ? ` / ${c.capacity}` : ""}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays size={12} /> {formatDate(c.startDate)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Layers size={12} /> {c._count.events} session{c._count.events > 1 ? "s" : ""}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </AdminCard>
    </div>
  );
}
