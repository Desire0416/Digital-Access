import Link from "next/link";
import { Pencil, ExternalLink, Star, GraduationCap } from "lucide-react";
import { getAdminShortCourses } from "@/lib/admin-queries";
import { AdminPageHeader, AdminCard, EmptyState, StatusPill, COURSE_STATUS } from "@/components/admin/ui";
import { ShortCourseStatusControl } from "@/components/admin/ShortCourseStatusControl";
import { LEVEL_LABEL, type Level } from "@/lib/types";
import { formatFCFA } from "@da/ui";

export const dynamic = "force-dynamic";

function levelLabel(level: string): string {
  return LEVEL_LABEL[level as Level] ?? level;
}

function priceLabel(price: number): string {
  return price > 0 ? formatFCFA(price) : "Gratuit";
}

export default async function AdminShortCoursesPage() {
  const courses = await getAdminShortCourses();

  return (
    <>
      <AdminPageHeader
        title="Formations courtes"
        description="Pilotez les formations courtes — initiations, ateliers et modules bonus. Statut de publication, mise en avant et contenu."
      >
        <span className="rounded-full bg-navy/[0.06] px-3 py-1.5 text-sm font-semibold text-text-secondary">
          {courses.length} formation{courses.length > 1 ? "s" : ""}
        </span>
      </AdminPageHeader>

      {courses.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={20} />}
          title="Aucune formation courte"
          description="Les formations courtes apparaîtront ici. Chaque formation est rattachée à une école du catalogue."
        />
      ) : (
        <AdminCard bodyClassName="p-0">
          {/* Tablette & desktop : tableau */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-navy/[0.08] text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <th className="px-5 py-3.5">Formation</th>
                  <th className="px-4 py-3.5">École</th>
                  <th className="px-4 py-3.5">Niveau</th>
                  <th className="px-4 py-3.5 text-right">Prix</th>
                  <th className="px-4 py-3.5 text-center">Vedette</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} className="border-b border-navy/[0.05] transition-colors last:border-0 hover:bg-navy/[0.02]">
                    <td className="px-5 py-4">
                      <span className="font-semibold text-navy">{c.title}</span>
                    </td>
                    <td className="px-4 py-4 text-text-secondary">{c.schoolName}</td>
                    <td className="px-4 py-4 text-text-secondary">{levelLabel(c.level)}</td>
                    <td className="px-4 py-4 text-right font-medium text-navy">{priceLabel(c.price)}</td>
                    <td className="px-4 py-4 text-center">
                      {c.featured ? (
                        <Star size={15} className="mx-auto fill-current text-warning" aria-label="Formation vedette" />
                      ) : (
                        <span className="text-text-muted" aria-hidden>
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <ShortCourseStatusControl id={c.id} status={c.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <RowLink href={`/admin/formations/${c.id}`} icon={<Pencil size={13} />} label="Éditer" />
                        <RowLink href={`/short-courses/${c.slug}`} icon={<ExternalLink size={13} />} label="Voir" external />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile : cartes empilées */}
          <ul className="divide-y divide-navy/[0.06] md:hidden">
            {courses.map((c) => (
              <li key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      {c.featured && (
                        <Star size={13} className="shrink-0 fill-current text-warning" aria-label="Formation vedette" />
                      )}
                      <h3 className="truncate font-semibold text-navy">{c.title}</h3>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-text-secondary">{c.schoolName}</p>
                  </div>
                  <StatusPill
                    label={COURSE_STATUS[c.status]?.label ?? c.status}
                    tone={COURSE_STATUS[c.status]?.tone ?? "slate"}
                  />
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <Meta label="Niveau" value={levelLabel(c.level)} />
                  <Meta label="Prix" value={priceLabel(c.price)} />
                  <Meta label="Vedette" value={c.featured ? "Oui" : "Non"} />
                </dl>

                <div className="mt-3">
                  <ShortCourseStatusControl id={c.id} status={c.status} />
                </div>

                <div className="mt-3 flex gap-2">
                  <CardLink href={`/admin/formations/${c.id}`} icon={<Pencil size={13} />} label="Éditer" />
                  <CardLink href={`/short-courses/${c.slug}`} icon={<ExternalLink size={13} />} label="Voir" external />
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
