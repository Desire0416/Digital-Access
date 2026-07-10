import type { Metadata } from "next";
import { Building2, ClipboardCheck, Handshake, ReceiptText, Trophy, Percent } from "lucide-react";
import { formatFCFA } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { AdminPageHeader, StatCard, EmptyState, toneColor } from "@/components/admin/ui";
import { BarChart, FunnelBars, DonutChart } from "@/components/admin/Charts";
import { getCommercialDashboard } from "@/lib/crm-stats-queries";
import { PROSPECT_STATUS_TONE } from "@/lib/crm-types";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rapports commerciaux" };

export default async function RapportsPage() {
  const [user, dash] = await Promise.all([currentUser(), getCommercialDashboard()]);
  const admin = isAdmin(user);
  const { kpis } = dash;

  const donut = dash.prospectsByStatus.slice(0, 6).map((s) => ({
    label: s.label, value: s.count, color: toneColor(PROSPECT_STATUS_TONE[s.status]),
  }));

  return (
    <div>
      <AdminPageHeader
        title="Rapports commerciaux"
        description={admin ? "Performance du pipeline de toute l'équipe." : "Vos indicateurs commerciaux."}
      />

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={<Building2 size={20} />} tone="violet" label="Prospects" value={kpis.prospects} />
        <StatCard icon={<ClipboardCheck size={20} />} tone="cyan" label="Audits envoyés" value={kpis.auditsSent} />
        <StatCard icon={<Handshake size={20} />} tone="blue" label="Opportunités ouvertes" value={kpis.openDeals} hint={formatFCFA(kpis.pipelineValue)} />
        <StatCard icon={<ReceiptText size={20} />} tone="amber" label="Devis envoyés" value={kpis.quotesSent} />
        <StatCard icon={<Trophy size={20} />} tone="green" label="Contrats gagnés" value={kpis.won} hint={formatFCFA(kpis.wonValue)} />
        <StatCard icon={<Percent size={20} />} tone="violet" label="Taux de conversion" value={`${kpis.conversionRate} %`} hint={`${kpis.lost} perdu${kpis.lost > 1 ? "s" : ""}`} />
      </div>

      {/* Graphes */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
          <h2 className="mb-1 font-display text-base font-bold text-navy">Valeur pondérée</h2>
          <p className="mb-4 text-sm text-text-secondary">Poids du pipeline ajusté par la probabilité : <span className="font-semibold text-navy">{formatFCFA(kpis.weightedValue)}</span></p>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-text-muted">Pipeline par étape</h3>
          {dash.funnel.length > 0 ? (
            <FunnelBars data={dash.funnel.map((f) => ({ label: `${f.label} (${f.count})`, value: f.value }))} format="fcfa" />
          ) : (
            <p className="py-8 text-center text-sm text-text-muted">Aucune opportunité pour l'instant.</p>
          )}
        </div>

        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Prospects par statut</h2>
          {donut.length > 0 ? (
            <DonutChart data={donut} centerLabel="prospects" centervalue={String(kpis.prospects)} />
          ) : (
            <p className="py-8 text-center text-sm text-text-muted">Aucun prospect pour l'instant.</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
        <h2 className="mb-4 font-display text-base font-bold text-navy">Contrats gagnés — 6 derniers mois (CA)</h2>
        <BarChart data={dash.monthly.map((m) => ({ label: m.label, value: m.wonValue }))} format="fcfa" />
      </div>

      {/* Performance par commercial (admin) */}
      {admin && (
        <div className="mt-6 rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Performance par commercial</h2>
          {dash.byCommercial.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-navy/10 text-[11px] uppercase tracking-wide text-text-muted">
                    <th className="pb-2 pr-4 font-bold">Commercial</th>
                    <th className="pb-2 px-3 text-right font-bold">Prospects</th>
                    <th className="pb-2 px-3 text-right font-bold">Opp. ouvertes</th>
                    <th className="pb-2 px-3 text-right font-bold">Gagnées</th>
                    <th className="pb-2 px-3 text-right font-bold">CA gagné</th>
                    <th className="pb-2 pl-3 text-right font-bold">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {dash.byCommercial.map((r) => (
                    <tr key={r.id} className="border-b border-navy/[0.06]">
                      <td className="py-3 pr-4 font-semibold text-navy">{r.name}</td>
                      <td className="py-3 px-3 text-right tabular-nums text-text-secondary">{r.prospects}</td>
                      <td className="py-3 px-3 text-right tabular-nums text-text-secondary">{r.openDeals}</td>
                      <td className="py-3 px-3 text-right tabular-nums font-semibold text-success">{r.won}</td>
                      <td className="py-3 px-3 text-right tabular-nums text-navy">{formatFCFA(r.wonValue)}</td>
                      <td className="py-3 pl-3 text-right tabular-nums font-semibold text-navy">{r.conversionRate} %</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Aucune donnée" description="Les performances apparaîtront dès les premières opportunités." />
          )}
        </div>
      )}
    </div>
  );
}
