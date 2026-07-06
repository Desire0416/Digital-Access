import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Users,
  GraduationCap,
  BookOpen,
  Repeat,
  ArrowUpRight,
  CreditCard,
  UserPlus,
  BadgeCheck,
  BarChart3,
  PieChart,
  Clock,
} from "lucide-react";
import { formatFCFA, formatDate, Avatar, Reveal } from "@da/ui";
import { getAdminDashboard } from "@/lib/admin-queries";
import {
  AdminPageHeader,
  StatCard,
  AdminCard,
  StatusPill,
  EmptyState,
  PAYMENT_STATUS,
  PAYMENT_TYPE,
  USER_ROLE,
} from "@/components/admin/ui";
import { BarChart, FunnelBars, DonutChart } from "@/components/admin/Charts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tableau de bord — Administration",
  robots: { index: false, follow: false },
};

const MONTH_LABEL = new Intl.DateTimeFormat("fr-FR", { month: "long" });

/** Petit message centré pour un graphe sans données. */
function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="grid h-40 place-items-center text-center">
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  );
}

/**
 * Enveloppe une StatCard dans un <Link> filtrant (sans modifier StatCard).
 * Affordance : anneau + élévation au survol + flèche révélée en haut à droite.
 * L'animation de la flèche est désactivée sous prefers-reduced-motion.
 */
function KpiLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="group relative block rounded-2xl outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-brand-violet/40 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 [&>div]:transition-colors [&>div]:group-hover:border-brand-violet/25"
    >
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-gradient-da text-white opacity-0 shadow-sm transition-all duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none sm:-translate-y-1 sm:group-hover:translate-y-0"
      >
        <ArrowUpRight size={15} />
      </span>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const d = await getAdminDashboard();
  const { kpis } = d;

  const pendingCount = kpis.pendingReview + kpis.pendingPayments;
  const currentMonthLabel = MONTH_LABEL.format(new Date());
  const paymentTotal = d.paymentDonut.reduce((s, p) => s + p.value, 0);

  return (
    <div>
      <AdminPageHeader
        title="Tableau de bord"
        description="Vue d'ensemble d'Access Academy — revenus, apprenants, cours et activité récente en temps réel."
      >
        {pendingCount > 0 && (
          <Link
            href="/admin/courses"
            className="group inline-flex items-center gap-2 rounded-full border border-brand-violet/25 bg-brand-violet/[0.07] px-3.5 py-2 text-sm font-semibold text-brand-violet transition-colors hover:bg-brand-violet/[0.12]"
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-da text-[11px] font-bold text-white">
              {pendingCount}
            </span>
            {pendingCount > 1 ? "éléments à valider" : "élément à valider"}
            <ArrowUpRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        )}
      </AdminPageHeader>

      {/* ─────────────────────────── KPI (cliquables) ─────────────────────────── */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiLink
          href="/admin/payments?status=COMPLETED"
          label="Revenus totaux — voir les paiements confirmés"
        >
          <StatCard
            icon={<Wallet size={20} />}
            label="Revenus totaux"
            value={formatFCFA(kpis.revenueTotal)}
            tone="violet"
          />
        </KpiLink>

        <KpiLink
          href="/admin/payments?status=COMPLETED"
          label={`Revenus de ${currentMonthLabel} — voir les paiements confirmés`}
        >
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Revenus ce mois"
            value={formatFCFA(kpis.revenueMonth)}
            hint={currentMonthLabel}
            tone="cyan"
          />
        </KpiLink>

        <KpiLink
          href="/admin/users"
          label="Utilisateurs — voir tous les comptes"
        >
          <StatCard
            icon={<Users size={20} />}
            label="Utilisateurs"
            value={kpis.usersTotal}
            tone="blue"
          />
        </KpiLink>

        <KpiLink
          href="/admin/users?role=LEARNER"
          label="Apprenants — filtrer les comptes apprenants"
        >
          <StatCard
            icon={<GraduationCap size={20} />}
            label="Apprenants"
            value={kpis.learners}
            tone="cyan"
          />
        </KpiLink>

        <KpiLink
          href="/admin/users?role=INSTRUCTOR"
          label="Instructeurs — filtrer les comptes instructeurs"
        >
          <StatCard
            icon={<UserPlus size={20} />}
            label="Instructeurs"
            value={kpis.instructors}
            tone="violet"
          />
        </KpiLink>

        <KpiLink
          href="/admin/courses?status=PUBLISHED"
          label="Cours publiés — filtrer les cours publiés"
        >
          <StatCard
            icon={<BookOpen size={20} />}
            label="Cours publiés"
            value={kpis.coursesPublished}
            tone="green"
          />
        </KpiLink>

        <KpiLink
          href="/admin/courses"
          label="Inscriptions — voir les cours"
        >
          <StatCard
            icon={<Users size={20} />}
            label="Inscriptions"
            value={kpis.enrollmentsTotal}
            tone="blue"
          />
        </KpiLink>

        <KpiLink
          href="/admin/subscriptions?status=ACTIVE"
          label="Abonnements actifs — filtrer les abonnements actifs"
        >
          <StatCard
            icon={<Repeat size={20} />}
            label="Abonnements actifs"
            value={kpis.activeSubs}
            tone="amber"
          />
        </KpiLink>
      </section>

      {/* ───────────────── File d'attente (à valider) ───────────────── */}
      {(kpis.pendingReview > 0 || kpis.pendingPayments > 0) && (
        <section className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiLink
            href="/admin/courses?status=REVIEW"
            label="Cours en attente de validation"
          >
            <StatCard
              icon={<Clock size={20} />}
              label="Cours à valider"
              value={kpis.pendingReview}
              tone={kpis.pendingReview > 0 ? "amber" : "slate"}
            />
          </KpiLink>

          <KpiLink
            href="/admin/payments?status=PENDING"
            label="Paiements en attente de vérification"
          >
            <StatCard
              icon={<CreditCard size={20} />}
              label="Paiements à vérifier"
              value={kpis.pendingPayments}
              tone={kpis.pendingPayments > 0 ? "amber" : "slate"}
            />
          </KpiLink>
        </section>
      )}

      {/* ───────────────────── Graphes temporels ───────────────────── */}
      <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Reveal>
          <AdminCard
            title="Revenus (6 mois)"
            action={
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-violet/10 text-brand-violet">
                <BarChart3 size={16} />
              </span>
            }
          >
            <BarChart data={d.revenueByMonth} format="fcfa" />
          </AdminCard>
        </Reveal>

        <Reveal delay={0.06}>
          <AdminCard
            title="Inscriptions (6 mois)"
            action={
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-cyan/15 text-[#0891a6]">
                <GraduationCap size={16} />
              </span>
            }
          >
            <BarChart data={d.enrollmentsByMonth} format="plain" />
          </AdminCard>
        </Reveal>
      </section>

      {/* ──────────────── Répartitions (donut + entonnoirs) ──────────────── */}
      <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Reveal>
          <AdminCard
            title="Répartition des paiements"
            action={
              <Link
                href="/admin/payments"
                aria-label="Voir tous les paiements"
                className="grid h-8 w-8 place-items-center rounded-lg bg-brand-violet/10 text-brand-violet outline-none transition-colors hover:bg-brand-violet/20 focus-visible:ring-2 focus-visible:ring-brand-violet/40"
              >
                <PieChart size={16} />
              </Link>
            }
          >
            {d.paymentDonut.length > 0 ? (
              <DonutChart
                data={d.paymentDonut}
                centerLabel="paiements"
                centervalue={String(paymentTotal)}
              />
            ) : (
              <ChartEmpty label="Aucun paiement enregistré pour l'instant." />
            )}
          </AdminCard>
        </Reveal>

        <Reveal delay={0.06}>
          <AdminCard
            title="Cours les plus suivis"
            action={
              <Link
                href="/admin/courses?status=PUBLISHED"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-violet transition-colors hover:text-brand-cyan"
              >
                Tout voir
                <ArrowUpRight size={13} />
              </Link>
            }
          >
            {d.topCourses.length > 0 ? (
              <FunnelBars data={d.topCourses} format="plain" />
            ) : (
              <ChartEmpty label="Aucune inscription pour l'instant." />
            )}
          </AdminCard>
        </Reveal>

        <Reveal delay={0.12}>
          <AdminCard
            title="Cours par catégorie"
            action={
              <Link
                href="/admin/categories"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-violet transition-colors hover:text-brand-cyan"
              >
                Tout voir
                <ArrowUpRight size={13} />
              </Link>
            }
          >
            {d.categoryDist.length > 0 ? (
              <FunnelBars data={d.categoryDist} format="plain" />
            ) : (
              <ChartEmpty label="Aucune catégorie renseignée." />
            )}
          </AdminCard>
        </Reveal>
      </section>

      {/* ─────────────────── Activité récente ─────────────────── */}
      <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Derniers paiements */}
        <Reveal>
          <AdminCard
            title="Derniers paiements"
            action={
              <Link
                href="/admin/payments"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-violet transition-colors hover:text-brand-cyan"
              >
                Tout voir
                <ArrowUpRight size={13} />
              </Link>
            }
            bodyClassName="p-0"
          >
            {d.recentPayments.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<CreditCard size={20} />}
                  title="Aucun paiement"
                  description="Les transactions apparaîtront ici dès la première vente."
                />
              </div>
            ) : (
              <ul className="divide-y divide-navy/[0.06]">
                {d.recentPayments.map((p) => {
                  const st = PAYMENT_STATUS[p.status] ?? {
                    label: p.status,
                    tone: "slate" as const,
                  };
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/admin/payments?status=${p.status}`}
                        aria-label={`Paiement de ${p.user?.name ?? "un utilisateur"} — ${formatFCFA(p.amount)}, ${st.label}`}
                        className="group flex flex-col gap-2 px-5 py-3.5 outline-none transition-colors hover:bg-brand-violet/[0.04] focus-visible:bg-brand-violet/[0.06] sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy/[0.04] text-text-secondary transition-colors group-hover:bg-brand-violet/10 group-hover:text-brand-violet">
                            <CreditCard size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-navy">
                              {p.user?.name ?? "Utilisateur"}
                            </p>
                            <p className="truncate text-xs text-text-muted">
                              {PAYMENT_TYPE[p.type] ?? p.type} · {formatDate(p.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 pl-12 sm:justify-end sm:pl-0">
                          <span className="text-sm font-bold tabular-nums text-navy">
                            {formatFCFA(p.amount)}
                          </span>
                          <StatusPill label={st.label} tone={st.tone} />
                          <ArrowUpRight
                            size={14}
                            aria-hidden
                            className="hidden shrink-0 text-text-muted transition-all group-hover:text-brand-violet motion-safe:group-hover:translate-x-0.5 sm:block"
                          />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>
        </Reveal>

        {/* Nouveaux membres */}
        <Reveal delay={0.06}>
          <AdminCard
            title="Nouveaux membres"
            action={
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-violet transition-colors hover:text-brand-cyan"
              >
                Tout voir
                <ArrowUpRight size={13} />
              </Link>
            }
            bodyClassName="p-0"
          >
            {d.recentUsers.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={<UserPlus size={20} />}
                  title="Aucun membre"
                  description="Les nouvelles inscriptions apparaîtront ici."
                />
              </div>
            ) : (
              <ul className="divide-y divide-navy/[0.06]">
                {d.recentUsers.map((u) => {
                  const primaryRole = u.roles[0] ?? "LEARNER";
                  const role = USER_ROLE[primaryRole] ?? {
                    label: primaryRole,
                    tone: "slate" as const,
                  };
                  return (
                    <li key={u.id}>
                      <Link
                        href={`/admin/users?role=${primaryRole}`}
                        aria-label={`${u.name} — ${role.label}, voir dans les utilisateurs`}
                        className="group flex flex-col gap-2 px-5 py-3.5 outline-none transition-colors hover:bg-brand-violet/[0.04] focus-visible:bg-brand-violet/[0.06] sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="relative shrink-0">
                            <Avatar name={u.name} className="h-9 w-9" />
                            {u.emailVerified && (
                              <span
                                className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-surface-primary"
                                title="Email vérifié"
                              >
                                <BadgeCheck size={14} className="text-success" />
                              </span>
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-navy">{u.name}</p>
                            <p className="truncate text-xs text-text-muted">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pl-12 sm:justify-end sm:pl-0">
                          <StatusPill label={role.label} tone={role.tone} />
                          <span className="hidden whitespace-nowrap text-xs text-text-muted sm:inline">
                            {formatDate(u.createdAt)}
                          </span>
                          <ArrowUpRight
                            size={14}
                            aria-hidden
                            className="hidden shrink-0 text-text-muted transition-all group-hover:text-brand-violet motion-safe:group-hover:translate-x-0.5 sm:block"
                          />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </AdminCard>
        </Reveal>
      </section>
    </div>
  );
}
