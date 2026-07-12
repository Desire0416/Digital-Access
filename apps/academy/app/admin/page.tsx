import type { Metadata } from "next";
import Link from "next/link";
import { Users, Award, Wallet, CreditCard, GraduationCap, Route as RouteIcon, ArrowUpRight } from "lucide-react";
import { getAdminStats, getCourseStatusBreakdown } from "@/lib/admin-queries";
import { formatFCFA } from "@/lib/site";
import {
  AdminPageHeader,
  AdminCard,
  StatCard,
  StatusPill,
  AdminEmpty,
  CONTENT_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  PAYMENT_PURPOSE_LABEL,
} from "@/components/admin/ui";

export const metadata: Metadata = { title: "Tableau de bord — Administration" };

export default async function AdminDashboardPage() {
  const [stats, breakdown] = await Promise.all([getAdminStats(), getCourseStatusBreakdown()]);
  const totalCourses = breakdown.reduce((s, b) => s + b.count, 0);
  const maxCount = Math.max(1, ...breakdown.map((b) => b.count));

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Pilotage"
        title="Tableau de bord"
        description="Vue d'ensemble de l'activité de l'académie : apprenants, inscriptions, revenus et validations en attente."
      />

      {/* ─── Statistiques clés ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Apprenants"
          value={stats.usersCount.toLocaleString("fr-FR")}
          icon={<Users size={18} />}
          accent="violet"
          href="/admin/utilisateurs"
        />
        <StatCard
          label="Inscriptions actives"
          value={stats.enrollmentsCount.toLocaleString("fr-FR")}
          icon={<GraduationCap size={18} />}
          accent="blue"
          sublabel={`${stats.pathEnrollmentsCount.toLocaleString("fr-FR")} au parcours`}
        />
        <StatCard
          label="Revenus validés"
          value={formatFCFA(stats.revenueFCFA)}
          icon={<Wallet size={18} />}
          accent="green"
        />
        <StatCard
          label="Certificats délivrés"
          value={stats.certificatesCount.toLocaleString("fr-FR")}
          icon={<Award size={18} />}
          accent="cyan"
          href="/admin/certificats"
        />
        <StatCard
          label="Paiements en attente"
          value={stats.pendingPaymentsCount.toLocaleString("fr-FR")}
          icon={<CreditCard size={18} />}
          accent="amber"
          href="/admin/paiements?status=PENDING"
          highlight={stats.pendingPaymentsCount > 0}
          sublabel={stats.pendingPaymentsCount > 0 ? "À vérifier" : "Tout est à jour"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ─── Derniers paiements ─────────────────────────────────────────── */}
        <AdminCard>
          <div className="flex items-center justify-between border-b border-navy/[0.06] px-5 py-4">
            <h2 className="font-display text-base font-bold text-navy">Derniers paiements</h2>
            <Link
              href="/admin/paiements"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal hover:underline"
            >
              Tout voir <ArrowUpRight size={13} />
            </Link>
          </div>
          {stats.recentPayments.length === 0 ? (
            <AdminEmpty title="Aucun paiement" description="Les dépôts de preuve Mobile Money apparaîtront ici." />
          ) : (
            <ul className="divide-y divide-navy/[0.05]">
              {stats.recentPayments.map((p) => {
                const target = p.course?.title ?? p.careerPath?.title ?? PAYMENT_PURPOSE_LABEL[p.purpose] ?? "—";
                return (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy">{p.user.name}</p>
                      <p className="truncate text-xs text-text-muted">{target}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-sm font-bold text-navy">{formatFCFA(p.amount)}</p>
                      <StatusPill
                        label={PAYMENT_STATUS_LABEL[p.status] ?? p.status}
                        tone={PAYMENT_STATUS_TONE[p.status] ?? "neutral"}
                        className="mt-0.5"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>

        {/* ─── Dernières inscriptions (utilisateurs) ──────────────────────── */}
        <AdminCard>
          <div className="flex items-center justify-between border-b border-navy/[0.06] px-5 py-4">
            <h2 className="font-display text-base font-bold text-navy">Derniers inscrits</h2>
            <Link
              href="/admin/utilisateurs"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal hover:underline"
            >
              Tout voir <ArrowUpRight size={13} />
            </Link>
          </div>
          {stats.recentUsers.length === 0 ? (
            <AdminEmpty title="Aucun apprenant" description="Les nouvelles inscriptions apparaîtront ici." />
          ) : (
            <ul className="divide-y divide-navy/[0.05]">
              {stats.recentUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">{u.name}</p>
                    <p className="truncate text-xs text-text-muted">{u.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-text-secondary">{u.country ?? "—"}</p>
                    <StatusPill
                      label={u.emailVerified ? "Vérifié" : "Non vérifié"}
                      tone={u.emailVerified ? "success" : "warning"}
                      className="mt-0.5"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      {/* ─── Répartition des formations par statut ─────────────────────────── */}
      <AdminCard className="p-5">
        <div className="flex items-center gap-2">
          <RouteIcon size={16} className="text-brand-blue-royal" />
          <h2 className="font-display text-base font-bold text-navy">Formations par statut</h2>
          <span className="ml-auto text-xs text-text-muted">{totalCourses} au total</span>
        </div>
        {breakdown.length === 0 ? (
          <AdminEmpty title="Aucune formation" action={{ label: "Gérer les formations", href: "/admin/formations" }} />
        ) : (
          <div className="mt-5 space-y-3.5">
            {breakdown.map((b) => (
              <div key={b.status} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs font-medium text-text-secondary">
                  {CONTENT_STATUS_LABEL[b.status] ?? b.status}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-navy/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-da"
                    style={{ width: `${Math.max(4, (b.count / maxCount) * 100)}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-display text-sm font-bold text-navy">{b.count}</span>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
