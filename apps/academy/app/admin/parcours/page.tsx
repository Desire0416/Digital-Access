import type { Metadata } from "next";
import Link from "next/link";
import { Search, Route, Users, Layers, ChevronRight } from "lucide-react";
import type { ContentStatus } from "@da/academy-db/client";
import { formatFCFA } from "@/lib/site";
import { listCareerPathsAdmin } from "@/lib/admin-queries";
import { createCareerPath } from "@/lib/admin-actions";
import { AdminPageHeader, AdminCard, StatusPill, AdminEmpty, CONTENT_STATUS_LABEL, CONTENT_STATUS_TONE } from "@/components/admin/ui";
import { QuickCreate } from "@/components/admin/QuickCreate";

export const metadata: Metadata = { title: "Parcours métiers — Administration" };

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "DRAFT", label: "Brouillons" },
  { value: "REVIEW", label: "En revue" },
  { value: "PUBLISHED", label: "Publiés" },
  { value: "ARCHIVED", label: "Archivés" },
];

const VALID_STATUS = new Set<ContentStatus>(["DRAFT", "REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "SUSPENDED", "ARCHIVED"]);

type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminParcoursPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = one(sp.q)?.trim() ?? "";
  const statusParam = one(sp.status) as ContentStatus | undefined;
  const status = statusParam && VALID_STATUS.has(statusParam) ? statusParam : undefined;

  const paths = await listCareerPathsAdmin({ q, status });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Assemblage"
        title="Parcours métiers"
        description="Un parcours n'héberge aucun contenu : il assemble des formations existantes du catalogue en phases, vers un métier cible. Ouvrez-en un pour composer sa progression."
        actions={
          <QuickCreate
            action={createCareerPath}
            redirectBase="/admin/parcours"
            buttonLabel="Nouveau parcours"
            modalTitle="Créer un parcours métier"
            fieldLabel="Intitulé du parcours"
            placeholder="Ex. Analyste de données"
          />
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <form method="GET" role="search" className="relative w-full lg:max-w-sm">
          {status && <input type="hidden" name="status" value={status} />}
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Rechercher un parcours…"
            aria-label="Rechercher un parcours"
            className="h-11 w-full rounded-xl border border-navy/10 bg-surface-primary pl-10 pr-4 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-vif/60"
          />
        </form>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {STATUS_FILTERS.map((f) => {
            const active = (status ?? "") === f.value;
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (f.value) params.set("status", f.value);
            const href = `/admin/parcours${params.toString() ? `?${params}` : ""}`;
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
        {paths.length} parcours
        {q && <> pour « {q} »</>}
      </p>

      <AdminCard className="overflow-hidden">
        {paths.length === 0 ? (
          <AdminEmpty
            icon={<Route size={34} className="text-text-muted opacity-50" />}
            title="Aucun parcours"
            description={q || status ? "Aucun résultat pour ce filtre." : "Créez un parcours puis assemblez-le à partir de vos formations."}
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy/[0.07] text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3">Parcours</th>
                    <th className="px-4 py-3">Métier cible</th>
                    <th className="px-4 py-3">Prix plein</th>
                    <th className="px-4 py-3">Formations</th>
                    <th className="px-4 py-3">Phases</th>
                    <th className="px-4 py-3">Inscrits</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-5 py-3 text-right">Ouvrir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy/[0.05]">
                  {paths.map((p) => (
                    <tr key={p.id} className="group transition-colors hover:bg-surface-secondary/50">
                      <td className="px-5 py-3">
                        <Link href={`/admin/parcours/${p.id}`} className="min-w-0">
                          <p className="truncate font-semibold text-navy group-hover:text-brand-blue-royal">{p.title}</p>
                          <p className="truncate text-xs text-text-muted">/{p.slug}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{p.targetJob}</td>
                      <td className="px-4 py-3 font-medium text-navy">{p.price > 0 ? formatFCFA(p.price) : "Gratuit"}</td>
                      <td className="px-4 py-3 text-text-secondary">{p._count.courses}</td>
                      <td className="px-4 py-3 text-text-secondary">{p._count.phases}</td>
                      <td className="px-4 py-3 text-text-secondary">{p._count.enrollments}</td>
                      <td className="px-4 py-3">
                        <StatusPill label={CONTENT_STATUS_LABEL[p.status]} tone={CONTENT_STATUS_TONE[p.status]} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/admin/parcours/${p.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-navy/10 px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal"
                        >
                          Composer <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-navy/[0.05] lg:hidden">
              {paths.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/parcours/${p.id}`} className="block p-4 transition-colors hover:bg-surface-secondary/50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy">{p.title}</p>
                        <p className="mt-0.5 truncate text-xs text-text-muted">{p.targetJob}</p>
                      </div>
                      <StatusPill label={CONTENT_STATUS_LABEL[p.status]} tone={CONTENT_STATUS_TONE[p.status]} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                      <span className="font-medium text-navy">{p.price > 0 ? formatFCFA(p.price) : "Gratuit"}</span>
                      <span className="inline-flex items-center gap-1"><Layers size={12} /> {p._count.courses} formation{p._count.courses > 1 ? "s" : ""}</span>
                      <span className="inline-flex items-center gap-1"><Users size={12} /> {p._count.enrollments}</span>
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
