import Link from "next/link";
import { Pencil, ExternalLink, Star, Rocket } from "lucide-react";
import { getAdminCareerPaths } from "@/lib/admin-queries";
import { AdminPageHeader, AdminCard, EmptyState, StatusPill, COURSE_STATUS } from "@/components/admin/ui";
import { PathStatusControl } from "@/components/admin/PathStatusControl";
import { LEVEL_LABEL, type Level } from "@/lib/types";
import { formatFCFA } from "@da/ui";

export const dynamic = "force-dynamic";

function levelLabel(level: string): string {
  return LEVEL_LABEL[level as Level] ?? level;
}

function priceLabel(price: number): string {
  return price > 0 ? formatFCFA(price) : "Gratuit";
}

export default async function AdminCareerPathsPage() {
  const paths = await getAdminCareerPaths();

  return (
    <>
      <AdminPageHeader
        title="Parcours métiers"
        description="Pilotez les parcours diplômants — statut de publication, mise en avant et contenu de chaque parcours."
      >
        <span className="rounded-full bg-navy/[0.06] px-3 py-1.5 text-sm font-semibold text-text-secondary">
          {paths.length} parcours
        </span>
      </AdminPageHeader>

      {paths.length === 0 ? (
        <EmptyState
          icon={<Rocket size={20} />}
          title="Aucun parcours métier"
          description="Les parcours métiers apparaîtront ici. Chaque parcours est rattaché à une école du catalogue."
        />
      ) : (
        <AdminCard bodyClassName="p-0">
          {/* Tablette & desktop : tableau */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-navy/[0.08] text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <th className="px-5 py-3.5">Parcours</th>
                  <th className="px-4 py-3.5">École</th>
                  <th className="px-4 py-3.5">Niveau</th>
                  <th className="px-4 py-3.5 text-right">Prix</th>
                  <th className="px-4 py-3.5 text-center">Inscrits</th>
                  <th className="px-4 py-3.5 text-center">Projets</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paths.map((p) => (
                  <tr key={p.id} className="border-b border-navy/[0.05] transition-colors last:border-0 hover:bg-navy/[0.02]">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-2">
                        {p.featured && (
                          <Star size={14} className="mt-0.5 shrink-0 fill-current text-warning" aria-label="Parcours vedette" />
                        )}
                        <span className="font-semibold text-navy">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-text-secondary">{p.schoolName}</td>
                    <td className="px-4 py-4 text-text-secondary">{levelLabel(p.level)}</td>
                    <td className="px-4 py-4 text-right font-medium text-navy">{priceLabel(p.price)}</td>
                    <td className="px-4 py-4 text-center text-text-secondary">{p.enrollmentCount}</td>
                    <td className="px-4 py-4 text-center text-text-secondary">{p.projectCount}</td>
                    <td className="px-4 py-4">
                      <PathStatusControl id={p.id} status={p.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <RowLink href={`/admin/parcours/${p.id}`} icon={<Pencil size={13} />} label="Éditer" />
                        <RowLink href={`/career-paths/${p.slug}`} icon={<ExternalLink size={13} />} label="Voir" external />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile : cartes empilées */}
          <ul className="divide-y divide-navy/[0.06] md:hidden">
            {paths.map((p) => (
              <li key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {p.featured && (
                        <Star size={13} className="shrink-0 fill-current text-warning" aria-label="Parcours vedette" />
                      )}
                      <h3 className="truncate font-semibold text-navy">{p.title}</h3>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-text-secondary">{p.schoolName}</p>
                  </div>
                  <StatusPill
                    label={COURSE_STATUS[p.status]?.label ?? p.status}
                    tone={COURSE_STATUS[p.status]?.tone ?? "slate"}
                  />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <Meta label="Niveau" value={levelLabel(p.level)} />
                  <Meta label="Prix" value={priceLabel(p.price)} />
                  <Meta label="Inscrits" value={String(p.enrollmentCount)} />
                  <Meta label="Projets" value={String(p.projectCount)} />
                </dl>

                <div className="mt-3">
                  <PathStatusControl id={p.id} status={p.status} />
                </div>

                <div className="mt-3 flex gap-2">
                  <CardLink href={`/admin/parcours/${p.id}`} icon={<Pencil size={13} />} label="Éditer" />
                  <CardLink href={`/career-paths/${p.slug}`} icon={<ExternalLink size={13} />} label="Voir" external />
                </div>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}
    </>
  );
}

function RowLink({
  href,
  icon,
  label,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="inline-flex items-center gap-1.5 rounded-lg border border-navy/10 px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/50 hover:text-brand-blue-royal"
    >
      {icon}
      {label}
    </Link>
  );
}

function CardLink({
  href,
  icon,
  label,
  external,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-navy/10 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/50 hover:text-brand-blue-royal"
    >
      {icon}
      {label}
    </Link>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-text-muted">{label}</dt>
      <dd className="truncate font-medium text-navy">{value}</dd>
    </div>
  );
}
