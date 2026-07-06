import type { Metadata } from "next";
import { Repeat, Users, TrendingUp, CalendarClock, RefreshCw } from "lucide-react";
import { Avatar, formatFCFA, formatDate } from "@da/ui";
import { getAdminSubscriptions } from "@/lib/admin-queries";
import {
  AdminPageHeader,
  AdminCard,
  StatCard,
  StatusPill,
  EmptyState,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_PLAN,
} from "@/components/admin/ui";
import { SubscriptionActions } from "./SubscriptionActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Abonnements",
  robots: { index: false, follow: false },
};

type SubStatus = "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE";

/* Statut d'abonnement — pastille brandée depuis le dictionnaire partagé. */
function SubStatusPill({ status }: { status: string }) {
  const meta = SUBSCRIPTION_STATUS[status] ?? { label: status, tone: "slate" as const };
  return <StatusPill label={meta.label} tone={meta.tone} />;
}

/* Renouvellement — pastille « Auto » (dégradé) ou « Manuel » (neutre). */
function RenewPill({ autoRenew }: { autoRenew: boolean }) {
  return autoRenew ? (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-da px-2.5 py-1 text-xs font-semibold text-white">
      <RefreshCw size={12} strokeWidth={2.5} />
      Auto
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-navy/[0.06] px-2.5 py-1 text-xs font-semibold text-text-secondary">
      Manuel
    </span>
  );
}

/* Période de validité — début → fin. */
function Period({ startDate, endDate }: { startDate: Date; endDate: Date }) {
  return (
    <span className="whitespace-nowrap text-xs text-text-secondary">
      {formatDate(startDate)}
      <span className="mx-1 text-text-muted">→</span>
      {formatDate(endDate)}
    </span>
  );
}

export default async function AdminSubscriptionsPage() {
  const { subs, active, total, mrr } = await getAdminSubscriptions();

  return (
    <div>
      <AdminPageHeader
        title="Abonnements"
        description="Suivez les abonnements Access Academy : formule, statut, période de validité et renouvellement. Annulez ou réactivez un abonnement d'un clic."
      />

      {/* ══════════ KPI ══════════ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Repeat size={20} />}
          label="Abonnements actifs"
          value={active}
          tone="green"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Total"
          value={total}
          tone="blue"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="MRR estimé"
          value={formatFCFA(mrr)}
          hint="récurrent / mois"
          tone="violet"
        />
      </div>

      {/* ══════════ Liste ══════════ */}
      <div className="mt-8">
        {subs.length === 0 ? (
          <EmptyState
            icon={<CalendarClock size={22} />}
            title="Aucun abonnement pour l'instant"
            description="L'abonnement Premium arrive avec le paiement automatique. Les souscriptions apparaîtront ici dès leur activation."
          />
        ) : (
          <>
            {/* ── Desktop : tableau (≥ lg) ── */}
            <AdminCard className="hidden lg:block" bodyClassName="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-navy/[0.08] text-xs font-semibold uppercase tracking-wide text-text-muted">
                      <th className="px-5 py-3.5 font-semibold">Abonné</th>
                      <th className="px-5 py-3.5 font-semibold">Formule</th>
                      <th className="px-5 py-3.5 font-semibold">Statut</th>
                      <th className="px-5 py-3.5 font-semibold">Période</th>
                      <th className="px-5 py-3.5 font-semibold">Renouvellement</th>
                      <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-navy/[0.05] transition-colors last:border-0 hover:bg-surface-secondary/70"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={s.user.name} className="h-9 w-9 shrink-0" />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-navy">{s.user.name}</p>
                              <p className="max-w-[16rem] truncate text-xs text-text-secondary">
                                {s.user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <span className="text-sm font-semibold text-navy">
                            {SUBSCRIPTION_PLAN[s.plan] ?? s.plan}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <SubStatusPill status={s.status} />
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <Period startDate={s.startDate} endDate={s.endDate} />
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <RenewPill autoRenew={s.autoRenew} />
                        </td>
                        <td className="px-5 py-4 align-middle text-right">
                          <SubscriptionActions id={s.id} status={s.status as SubStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminCard>

            {/* ── Mobile / tablette : cartes empilées (< lg) ── */}
            <div className="grid grid-cols-1 gap-4 lg:hidden">
              {subs.map((s) => (
                <article
                  key={s.id}
                  className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-shadow hover:shadow-lg sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={s.user.name} className="h-10 w-10 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy">{s.user.name}</p>
                        <p className="truncate text-xs text-text-secondary">{s.user.email}</p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <SubStatusPill status={s.status} />
                    </div>
                  </div>

                  <dl className="mt-4 space-y-3 border-t border-navy/[0.06] pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Formule
                      </dt>
                      <dd className="text-sm font-semibold text-navy">
                        {SUBSCRIPTION_PLAN[s.plan] ?? s.plan}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Renouvellement
                      </dt>
                      <dd>
                        <RenewPill autoRenew={s.autoRenew} />
                      </dd>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                        Période
                      </dt>
                      <dd>
                        <Period startDate={s.startDate} endDate={s.endDate} />
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex justify-end border-t border-navy/[0.06] pt-4">
                    <SubscriptionActions id={s.id} status={s.status as SubStatus} />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
