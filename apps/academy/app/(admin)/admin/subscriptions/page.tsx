import type { Metadata } from "next";
import Link from "next/link";
import { Repeat, Users, TrendingUp, CalendarClock, Ban } from "lucide-react";
import { formatFCFA } from "@da/ui";
import { getAdminSubscriptions } from "@/lib/admin-queries";
import {
  AdminPageHeader,
  StatCard,
  EmptyState,
} from "@/components/admin/ui";
import { SubscriptionFilters } from "./SubscriptionFilters";
import { SubscriptionCard } from "./SubscriptionCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Abonnements",
  robots: { index: false, follow: false },
};

const STATUSES = ["ACTIVE", "CANCELLED", "EXPIRED", "PAST_DUE"] as const;
const PLANS = ["MONTHLY", "YEARLY"] as const;

/* Une StatCard cliquable = filtre par URL. `href` conserve/écrase le param. */
function statHref(param: string, value: string) {
  return value ? `/admin/subscriptions?${param}=${value}` : "/admin/subscriptions";
}

export default async function AdminSubscriptionsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await props.searchParams;
  const raw = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : sp[k]) ?? "";

  const statusParam = STATUSES.includes(raw("status") as (typeof STATUSES)[number])
    ? raw("status")
    : "";
  const planParam = PLANS.includes(raw("plan") as (typeof PLANS)[number]) ? raw("plan") : "";
  const q = raw("q").trim().toLowerCase();

  const { subs, active, total, mrr } = await getAdminSubscriptions();

  // KPI complémentaires (annulés + expirés) — calculés en page (query non modifiée).
  const cancelledOrExpired = subs.filter(
    (s) => s.status === "CANCELLED" || s.status === "EXPIRED",
  ).length;

  // Filtrage en page (searchParams) — liste courte, pas de coût notable.
  const filtered = subs.filter((s) => {
    if (statusParam && s.status !== statusParam) return false;
    if (planParam && s.plan !== planParam) return false;
    if (q) {
      const hay = `${s.user.name} ${s.user.email}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const hasSubs = subs.length > 0;
  const hasResults = filtered.length > 0;

  return (
    <div>
      <AdminPageHeader
        title="Abonnements"
        description="Suivez les abonnements Access Academy : formule, statut, période de validité et renouvellement. Réactivez, annulez ou requalifiez un abonnement d'un clic."
      />

      {/* ══════════ KPI cliquables (filtrent l'URL) ══════════ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href={statHref("status", "ACTIVE")} className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/40">
          <StatCard
            icon={<Repeat size={20} />}
            label="Abonnements actifs"
            value={active}
            hint={statusParam === "ACTIVE" ? "filtre actif" : "voir →"}
            tone="green"
            className={statusParam === "ACTIVE" ? "ring-2 ring-success/40" : "group-hover:shadow-lg"}
          />
        </Link>

        <Link href={statHref("", "")} className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/40">
          <StatCard
            icon={<Users size={20} />}
            label="Total abonnements"
            value={total}
            hint={!statusParam && !planParam && !q ? "tous" : "tout voir →"}
            tone="blue"
            className={!statusParam && !planParam && !q ? "ring-2 ring-brand-blue-royal/30" : "group-hover:shadow-lg"}
          />
        </Link>

        <Link href="/admin/subscriptions" className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/40">
          <StatCard
            icon={<TrendingUp size={20} />}
            label="MRR estimé"
            value={formatFCFA(mrr)}
            hint="récurrent / mois"
            tone="violet"
            className="group-hover:shadow-lg"
          />
        </Link>

        <Link href={statHref("status", "CANCELLED")} className="group block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/40">
          <StatCard
            icon={<Ban size={20} />}
            label="Annulés / expirés"
            value={cancelledOrExpired}
            hint={statusParam === "CANCELLED" ? "filtre actif" : "voir →"}
            tone="red"
            className={statusParam === "CANCELLED" ? "ring-2 ring-error/30" : "group-hover:shadow-lg"}
          />
        </Link>
      </div>

      {/* ══════════ Filtres + Liste ══════════ */}
      <div className="mt-8">
        {!hasSubs ? (
          <EmptyState
            icon={<CalendarClock size={22} />}
            title="Aucun abonnement pour l'instant"
            description="L'abonnement Premium arrive avec le paiement automatique. Les souscriptions apparaîtront ici dès leur activation."
          />
        ) : (
          <>
            <SubscriptionFilters
              filters={{ q: raw("q").trim(), status: statusParam, plan: planParam }}
              resultCount={filtered.length}
            />

            {hasResults ? (
              <div className="grid grid-cols-1 gap-4">
                {filtered.map((s) => (
                  <SubscriptionCard key={s.id} sub={s} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CalendarClock size={22} />}
                title="Aucun abonnement ne correspond"
                description="Ajustez vos filtres ou votre recherche pour retrouver un abonnement."
              >
                <Link
                  href="/admin/subscriptions"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-da px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                >
                  Réinitialiser les filtres
                </Link>
              </EmptyState>
            )}
          </>
        )}
      </div>
    </div>
  );
}
