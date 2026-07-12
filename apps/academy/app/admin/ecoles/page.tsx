import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, BookOpen, Route, ChevronRight } from "lucide-react";
import { listSchoolsAdmin } from "@/lib/admin-queries";
import { createSchool } from "@/lib/admin-actions";
import { AdminPageHeader, AdminEmpty } from "@/components/admin/ui";
import { QuickCreate } from "@/components/admin/QuickCreate";

export const metadata: Metadata = { title: "Écoles — Administration" };

export default async function AdminEcolesPage() {
  const schools = await listSchoolsAdmin();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Domaines"
        title="Écoles"
        description="Les écoles regroupent formations et parcours par domaine — elles ne dupliquent jamais de contenu. Définissez leur identité et leurs rattachements."
        actions={
          <QuickCreate
            action={createSchool}
            redirectBase="/admin/ecoles"
            buttonLabel="Nouvelle école"
            modalTitle="Créer une école"
            fieldLabel="Nom de l'école"
            placeholder="Ex. École Data & IA"
          />
        }
      />

      {schools.length === 0 ? (
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary">
          <AdminEmpty
            icon={<GraduationCap size={34} className="text-text-muted opacity-50" />}
            title="Aucune école"
            description="Créez une école pour organiser vos formations et parcours par domaine."
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {schools.map((s) => (
            <Link
              key={s.id}
              href={`/admin/ecoles/${s.id}`}
              className="group relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 shadow-[0_1px_2px_rgba(26,26,46,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span className="absolute inset-x-0 top-0 h-1" style={{ background: s.color }} aria-hidden />
              <div className="flex items-start gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-sm"
                  style={{ background: s.color }}
                  aria-hidden
                >
                  <GraduationCap size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-bold text-navy group-hover:text-brand-blue-royal">{s.name}</p>
                  {s.tagline && <p className="mt-0.5 line-clamp-2 text-xs text-text-secondary">{s.tagline}</p>}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-text-secondary">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={13} className="text-brand-blue-royal" /> {s._count.courses} formation{s._count.courses > 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Route size={13} className="text-brand-violet" /> {s._count.careerPaths} parcours
                </span>
                <ChevronRight size={15} className="ml-auto text-text-muted transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
