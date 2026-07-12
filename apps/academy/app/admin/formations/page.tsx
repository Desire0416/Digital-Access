import type { Metadata } from "next";
import Link from "next/link";
import { Search, BookOpen, Users, Layers, ChevronRight } from "lucide-react";
import type { ContentStatus } from "@da/academy-db/client";
import { formatFCFA, LEVEL_LABEL } from "@/lib/site";
import { listCoursesAdmin } from "@/lib/admin-queries";
import { createCourse } from "@/lib/admin-actions";
import { AdminPageHeader, AdminCard, StatusPill, AdminEmpty, CONTENT_STATUS_LABEL, CONTENT_STATUS_TONE } from "@/components/admin/ui";
import { QuickCreate } from "@/components/admin/QuickCreate";

export const metadata: Metadata = { title: "Formations — Administration" };

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Toutes" },
  { value: "DRAFT", label: "Brouillons" },
  { value: "REVIEW", label: "En revue" },
  { value: "APPROVED", label: "Approuvées" },
  { value: "PUBLISHED", label: "Publiées" },
  { value: "SUSPENDED", label: "Suspendues" },
  { value: "ARCHIVED", label: "Archivées" },
];

const VALID_STATUS = new Set<ContentStatus>(["DRAFT", "REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "SUSPENDED", "ARCHIVED"]);

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminFormationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = one(sp.q)?.trim() ?? "";
  const statusParam = one(sp.status) as ContentStatus | undefined;
  const status = statusParam && VALID_STATUS.has(statusParam) ? statusParam : undefined;

  const courses = await listCoursesAdmin({ q, status });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Contenu pédagogique"
        title="Formations"
        description="La formation est la brique centrale : créée une seule fois, réutilisée par les écoles et les parcours. Ouvrez une formation pour éditer sa fiche, son programme et sa publication."
        actions={
          <QuickCreate
            action={createCourse}
            redirectBase="/admin/formations"
            buttonLabel="Nouvelle formation"
            modalTitle="Créer une formation"
            fieldLabel="Intitulé de la formation"
            placeholder="Ex. Fondamentaux du SQL"
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
            placeholder="Rechercher une formation…"
            aria-label="Rechercher une formation"
            className="h-11 w-full rounded-xl border border-navy/10 bg-surface-primary pl-10 pr-4 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-vif/60"
          />
        </form>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {STATUS_FILTERS.map((f) => {
            const active = (status ?? "") === f.value;
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (f.value) params.set("status", f.value);
            const href = `/admin/formations${params.toString() ? `?${params}` : ""}`;
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
        {courses.length} formation{courses.length > 1 ? "s" : ""}
        {q && <> pour « {q} »</>}
      </p>

      <AdminCard className="overflow-hidden">
        {courses.length === 0 ? (
          <AdminEmpty
            icon={<BookOpen size={34} className="text-text-muted opacity-50" />}
            title="Aucune formation"
            description={q || status ? "Aucun résultat pour ce filtre." : "Créez votre première formation pour commencer."}
          />
        ) : (
          <>
            {/* Tableau (desktop) */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy/[0.07] text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3">Formation</th>
                    <th className="px-4 py-3">École principale</th>
                    <th className="px-4 py-3">Niveau</th>
                    <th className="px-4 py-3">Prix</th>
                    <th className="px-4 py-3">Modules</th>
                    <th className="px-4 py-3">Inscrits</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-5 py-3 text-right">Ouvrir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/[0.05]">
                  {courses.map((c) => {
                    const primarySchool = c.schools[0]?.school.name ?? null;
                    return (
                      <tr key={c.id} className="group transition-colors hover:bg-surface-secondary/50">
                        <td className="px-5 py-3">
                          <Link href={`/admin/formations/${c.id}`} className="flex items-center gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-navy group-hover:text-brand-blue-royal">{c.title}</p>
                              <p className="truncate text-xs text-text-muted">/{c.slug}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {primarySchool ?? <span className="text-text-muted">—</span>}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{LEVEL_LABEL[c.level] ?? c.level}</td>
                        <td className="px-4 py-3 font-medium text-navy">{c.price > 0 ? formatFCFA(c.price) : "Gratuit"}</td>
                        <td className="px-4 py-3 text-text-secondary">{c._count.modules}</td>
                        <td className="px-4 py-3 text-text-secondary">{c._count.enrollments}</td>
                        <td className="px-4 py-3">
                          <StatusPill label={CONTENT_STATUS_LABEL[c.status]} tone={CONTENT_STATUS_TONE[c.status]} />
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/admin/formations/${c.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-navy/10 px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal"
                          >
                            Éditer <ChevronRight size={13} />
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
              {courses.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/formations/${c.id}`} className="block p-4 transition-colors hover:bg-surface-secondary/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy">{c.title}</p>
                        <p className="mt-0.5 truncate text-xs text-text-muted">
                          {c.schools[0]?.school.name ?? "Sans école"} · {LEVEL_LABEL[c.level] ?? c.level}
                        </p>
                      </div>
                      <StatusPill label={CONTENT_STATUS_LABEL[c.status]} tone={CONTENT_STATUS_TONE[c.status]} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                      <span className="font-medium text-navy">{c.price > 0 ? formatFCFA(c.price) : "Gratuit"}</span>
                      <span className="inline-flex items-center gap-1"><Layers size={12} /> {c._count.modules} module{c._count.modules > 1 ? "s" : ""}</span>
                      <span className="inline-flex items-center gap-1"><Users size={12} /> {c._count.enrollments}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </AdminCard>
    </div>
  );
}
