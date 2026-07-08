import Link from "next/link";
import { School, Pencil, Rocket, BookOpen } from "lucide-react";
import { getAdminSchools } from "@/lib/admin-queries";
import { AdminPageHeader, AdminCard, EmptyState, StatusPill, COURSE_STATUS } from "@/components/admin/ui";
import { SchoolCreateForm } from "@/components/admin/SchoolCreateForm";
import { SchoolStatusToggle } from "@/components/admin/SchoolStatusToggle";

export const dynamic = "force-dynamic";

function statusMeta(status: string) {
  return COURSE_STATUS[status] ?? { label: status, tone: "slate" as const };
}

function plural(n: number, singular: string, pluralForm = `${singular}s`) {
  return `${n} ${n > 1 ? pluralForm : singular}`;
}

export default async function AdminSchoolsPage() {
  const schools = await getAdminSchools();

  return (
    <>
      <AdminPageHeader
        title="Écoles"
        description="Les pôles thématiques qui structurent le catalogue — chaque école regroupe des parcours métiers et des formations courtes."
      >
        <SchoolCreateForm />
      </AdminPageHeader>

      {schools.length === 0 ? (
        <EmptyState
          icon={<School size={22} />}
          title="Aucune école pour le moment"
          description="Créez votre première école pour commencer à organiser les parcours et les formations du catalogue."
        >
          <SchoolCreateForm />
        </EmptyState>
      ) : (
        <>
          {/* ── Vue tableau (sm et plus) ── */}
          <AdminCard className="hidden sm:block" bodyClassName="p-0">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-navy/[0.06] text-left text-xs font-semibold uppercase tracking-wide text-text-muted">
                  <th className="px-5 py-3.5">École</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5">Contenu</th>
                  <th className="px-5 py-3.5 text-center">Ordre</th>
                  <th className="px-5 py-3.5">Visibilité</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/[0.05]">
                {schools.map((s) => {
                  const st = statusMeta(s.status);
                  return (
                    <tr key={s.id} className="transition-colors hover:bg-navy/[0.015]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-da text-white">
                            <School size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-navy">{s.name}</p>
                            <p className="truncate font-mono text-xs text-text-muted">/{s.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill label={st.label} tone={st.tone} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 text-xs text-text-secondary">
                          <span className="inline-flex items-center gap-1.5">
                            <Rocket size={13} className="text-brand-blue-royal" />
                            {plural(s.careerPathCount, "parcours", "parcours")}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen size={13} className="text-brand-cyan" />
                            {plural(s.shortCourseCount, "formation")}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-grid h-7 min-w-7 place-items-center rounded-lg bg-navy/[0.05] px-2 font-mono text-xs font-semibold text-text-secondary">
                          {s.order}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <SchoolStatusToggle id={s.id} status={s.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/ecoles/${s.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-navy/[0.1] px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/50 hover:text-brand-blue-royal"
                        >
                          <Pencil size={13} />
                          Éditer
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </AdminCard>

          {/* ── Vue cartes empilées (mobile) ── */}
          <div className="flex flex-col gap-4 sm:hidden">
            {schools.map((s) => {
              const st = statusMeta(s.status);
              return (
                <div key={s.id} className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-da text-white">
                        <School size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy">{s.name}</p>
                        <p className="truncate font-mono text-xs text-text-muted">/{s.slug}</p>
                      </div>
                    </div>
                    <StatusPill label={st.label} tone={st.tone} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                    <span className="inline-flex items-center gap-1.5">
                      <Rocket size={13} className="text-brand-blue-royal" />
                      {plural(s.careerPathCount, "parcours", "parcours")}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen size={13} className="text-brand-cyan" />
                      {plural(s.shortCourseCount, "formation")}
                    </span>
                    <span className="text-text-muted">Ordre {s.order}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <SchoolStatusToggle id={s.id} status={s.status} />
                    <Link
                      href={`/admin/ecoles/${s.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-navy/[0.1] px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/50 hover:text-brand-blue-royal"
                    >
                      <Pencil size={13} />
                      Éditer
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
