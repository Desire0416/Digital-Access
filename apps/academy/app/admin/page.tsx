import Link from "next/link";
import { UsersRound, GraduationCap, ScrollText, ClipboardCheck, Medal, Rocket, School, BookOpen, ArrowRight } from "lucide-react";
import { getAdminStats } from "@/lib/admin-queries";
import { AdminPageHeader, StatCard, AdminCard } from "@/components/admin/ui";
import { BarChart, FunnelBars } from "@/components/admin/Charts";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const s = await getAdminStats();

  return (
    <>
      <AdminPageHeader
        title="Tableau de bord"
        description="Pilotage de Digital Access Academy — écoles, parcours, apprenants, projets et certifications."
      />

      {/* KPI principaux */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<UsersRound size={18} />} label="Utilisateurs" value={s.users} hint={`${s.learners} apprenants`} tone="blue" />
        <StatCard icon={<GraduationCap size={18} />} label="Inscriptions" value={s.enrollments} hint={`${s.completions} terminées`} tone="violet" />
        <StatCard icon={<ClipboardCheck size={18} />} label="Soumissions à évaluer" value={s.submissionsPending} hint={`${s.submissionsValidated} validées`} tone="amber" />
        <StatCard icon={<ScrollText size={18} />} label="Certificats délivrés" value={s.certificates} hint={`${s.badgesAwarded} badges`} tone="green" />
      </div>

      {/* Graphes */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AdminCard title="Inscriptions par école">
          {s.enrollmentsBySchool.length > 0 ? (
            <BarChart data={s.enrollmentsBySchool} />
          ) : (
            <p className="py-8 text-center text-sm text-text-muted">Aucune inscription pour le moment.</p>
          )}
        </AdminCard>
        <AdminCard title="Entonnoir des projets">
          {s.submissionFunnel.length > 0 ? (
            <FunnelBars data={s.submissionFunnel} />
          ) : (
            <p className="py-8 text-center text-sm text-text-muted">Aucune soumission de projet pour le moment.</p>
          )}
        </AdminCard>
      </div>

      {/* Catalogue + accès rapide */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <AdminCard title="Catalogue" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-3">
            <CatalogueTile icon={<School size={18} />} label="Écoles" value={s.schools} href="/admin/ecoles" />
            <CatalogueTile icon={<Rocket size={18} />} label="Parcours métiers" value={`${s.publishedPaths}/${s.careerPaths}`} sub="publiés" href="/admin/parcours" />
            <CatalogueTile icon={<BookOpen size={18} />} label="Formations courtes" value={s.shortCourses} href="/admin/formations" />
          </div>
        </AdminCard>

        <AdminCard title="Accès rapide">
          <div className="flex flex-col gap-2">
            <QuickLink icon={<ClipboardCheck size={16} />} label="Soumissions à superviser" href="/admin/soumissions" badge={s.submissionsPending || undefined} />
            <QuickLink icon={<UsersRound size={16} />} label="Gérer les utilisateurs" href="/admin/utilisateurs" />
            <QuickLink icon={<ScrollText size={16} />} label="Certificats délivrés" href="/admin/certificats" />
            <QuickLink icon={<Medal size={16} />} label="Coupons & bourses" href="/admin/coupons" />
          </div>
        </AdminCard>
      </div>
    </>
  );
}

function CatalogueTile({ icon, label, value, sub, href }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; href: string }) {
  return (
    <Link href={href} className="group flex flex-col rounded-xl border border-navy/[0.07] bg-surface-secondary/50 p-4 transition-colors hover:border-brand-blue-vif/40">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-da text-white">{icon}</span>
      <p className="mt-3 font-display text-xl font-extrabold text-navy">
        {value} {sub && <span className="text-xs font-medium text-text-muted">{sub}</span>}
      </p>
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal opacity-0 transition-opacity group-hover:opacity-100">
        Gérer <ArrowRight size={12} />
      </span>
    </Link>
  );
}

function QuickLink({ icon, label, href, badge }: { icon: React.ReactNode; label: string; href: string; badge?: number }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-navy/[0.04]">
      <span className="text-brand-blue-royal">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge ? <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-bold text-[#B45309]">{badge}</span> : <ArrowRight size={14} className="text-text-muted" />}
    </Link>
  );
}
