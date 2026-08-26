import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Users, UserPlus, Clock, Smartphone, Monitor, TrendingUp, FileText, ExternalLink } from "lucide-react";
import { getAnalyticsOverview } from "@/lib/analytics-queries";
import { AdminPageHeader, AdminCard, StatCard, AdminEmpty } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Fréquentation — Administration" };

const nf = new Intl.NumberFormat("fr-FR");

/* Graphe à barres léger (sans dépendance) — série quotidienne. */
function BarChart({
  data,
  valueKey,
  secondaryKey,
  color = "bg-gradient-to-t from-brand-blue-royal to-brand-blue-vif",
}: {
  data: ({ label: string; date: string } & Record<string, number | string>)[];
  valueKey: string;
  secondaryKey?: string;
  color?: string;
}) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey]) || 0));
  return (
    <div className="flex h-40 items-end gap-[3px]">
      {data.map((d) => {
        const v = Number(d[valueKey]) || 0;
        const sec = secondaryKey ? Number(d[secondaryKey]) || 0 : 0;
        const h = Math.round((v / max) * 100);
        const secH = secondaryKey ? Math.round((sec / max) * 100) : 0;
        const tip = secondaryKey
          ? `${d.label} · ${v} vues · ${sec} visiteurs`
          : `${d.label} · ${v}`;
        return (
          <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end" title={tip}>
            <div className={`w-full rounded-t-sm ${color} transition-opacity group-hover:opacity-80`} style={{ height: `${Math.max(h, v > 0 ? 4 : 0)}%` }} aria-hidden />
            {secondaryKey && sec > 0 && (
              <span
                className="absolute w-full border-t-2 border-brand-cyan/70"
                style={{ bottom: `${secH}%` }}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ListBars({ rows, label }: { rows: { name: string; views: number; href?: string }[]; label: string }) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={`${r.name}-${i}`}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            {r.href ? (
              <Link href={r.href} className="min-w-0 flex-1 truncate font-medium text-navy hover:text-brand-blue-royal">
                {r.name}
              </Link>
            ) : (
              <span className="min-w-0 flex-1 truncate font-medium text-navy">{r.name}</span>
            )}
            <span className="shrink-0 text-xs font-bold tabular-nums text-text-secondary">{nf.format(r.views)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-navy/[0.06]">
            <div className="h-full rounded-full bg-gradient-da" style={{ width: `${(r.views / max) * 100}%` }} aria-hidden />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminAnalyticsPage() {
  const a = await getAnalyticsOverview();
  const audienceTotal = Math.max(1, a.audience.logged + a.audience.anon);
  const loggedPct = Math.round((a.audience.logged / audienceTotal) * 100);
  const mobile = a.devices.find((d) => d.device === "mobile")?.views ?? 0;
  const desktop = a.devices.find((d) => d.device === "desktop")?.views ?? 0;
  const deviceTotal = Math.max(1, mobile + desktop);
  const mobilePct = Math.round((mobile / deviceTotal) * 100);
  const hasData = a.views.all > 0;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Fréquentation"
        title="Compteur de visites"
        description="Suivi détaillé de l'audience du site : vues de page, visiteurs uniques, inscriptions et sources de trafic. Les pages d'administration ne sont pas comptées."
      />

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Vues (30 j)" value={nf.format(a.views.d30)} icon={<Eye size={18} />} accent="violet" sublabel={`${nf.format(a.views.today)} aujourd'hui`} />
        <StatCard label="Visiteurs uniques (30 j)" value={nf.format(a.uniqueVisitors.d30)} icon={<Users size={18} />} accent="cyan" sublabel={`${nf.format(a.uniqueVisitors.today)} aujourd'hui`} />
        <StatCard label="Vues (7 j)" value={nf.format(a.views.d7)} icon={<TrendingUp size={18} />} accent="blue" />
        <StatCard label="Inscriptions (30 j)" value={nf.format(a.signups.d30)} icon={<UserPlus size={18} />} accent="green" sublabel={`${nf.format(a.signups.today)} aujourd'hui`} />
        <StatCard label="Jamais connectés" value={nf.format(a.signups.neverActive)} icon={<Clock size={18} />} accent="amber" href="/admin/relance" sublabel="Relancer par email →" highlight={a.signups.neverActive > 0} />
      </div>

      {!hasData ? (
        <AdminCard className="p-5">
          <AdminEmpty
            icon={<Eye size={34} className="text-text-muted opacity-50" />}
            title="Pas encore de données de visite"
            description="Le compteur enregistre les vues au fil de la navigation des visiteurs. Revenez ici après les premières visites."
          />
        </AdminCard>
      ) : (
        <>
          {/* Courbe des vues */}
          <AdminCard className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-bold text-navy">Vues des 30 derniers jours</h2>
              <div className="flex items-center gap-4 text-xs text-text-secondary">
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand-blue-royal" aria-hidden /> Vues</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-0 w-3 border-t-2 border-brand-cyan" aria-hidden /> Visiteurs uniques</span>
              </div>
            </div>
            <BarChart data={a.daily} valueKey="views" secondaryKey="visitors" />
            <div className="mt-2 flex justify-between text-[10px] text-text-muted">
              <span>{a.daily[0]?.label}</span>
              <span>{a.daily[Math.floor(a.daily.length / 2)]?.label}</span>
              <span>{a.daily[a.daily.length - 1]?.label}</span>
            </div>
          </AdminCard>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Inscriptions */}
            <AdminCard className="p-5">
              <h2 className="mb-4 font-display text-base font-bold text-navy">Inscriptions des 30 derniers jours</h2>
              <BarChart data={a.signupsDaily} valueKey="signups" color="bg-gradient-to-t from-success to-[#34d399]" />
              <p className="mt-3 text-xs text-text-muted">{nf.format(a.signups.all)} comptes au total · {nf.format(a.signups.d7)} sur 7 jours</p>
            </AdminCard>

            {/* Audience & appareils */}
            <AdminCard className="p-5">
              <h2 className="mb-4 font-display text-base font-bold text-navy">Audience & appareils (30 j)</h2>
              <div className="space-y-5">
                <div>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium text-navy">Connectés vs visiteurs</span>
                    <span className="text-xs text-text-secondary">{loggedPct}% connectés</span>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-navy/[0.06]">
                    <div className="bg-brand-violet" style={{ width: `${loggedPct}%` }} title={`Connectés : ${nf.format(a.audience.logged)}`} aria-hidden />
                    <div className="bg-brand-cyan" style={{ width: `${100 - loggedPct}%` }} title={`Visiteurs : ${nf.format(a.audience.anon)}`} aria-hidden />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-text-muted">
                    <span>{nf.format(a.audience.logged)} connectés</span>
                    <span>{nf.format(a.audience.anon)} anonymes</span>
                  </div>
                </div>
                <div>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium text-navy">Appareils</span>
                    <span className="text-xs text-text-secondary">{mobilePct}% mobile</span>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-navy/[0.06]">
                    <div className="bg-brand-blue-royal" style={{ width: `${mobilePct}%` }} aria-hidden />
                    <div className="bg-brand-blue-vif/40" style={{ width: `${100 - mobilePct}%` }} aria-hidden />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-text-muted">
                    <span className="inline-flex items-center gap-1"><Smartphone size={11} /> {nf.format(mobile)} mobile</span>
                    <span className="inline-flex items-center gap-1"><Monitor size={11} /> {nf.format(desktop)} ordinateur</span>
                  </div>
                </div>
              </div>
            </AdminCard>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Pages les plus vues */}
            <AdminCard className="p-5">
              <h2 className="mb-4 inline-flex items-center gap-2 font-display text-base font-bold text-navy">
                <FileText size={16} className="text-brand-blue-royal" aria-hidden /> Pages les plus vues (30 j)
              </h2>
              {a.topPages.length === 0 ? (
                <p className="text-sm text-text-muted">Aucune donnée.</p>
              ) : (
                <ListBars label="pages" rows={a.topPages.map((p) => ({ name: p.path, views: p.views, href: p.path }))} />
              )}
            </AdminCard>

            {/* Sources de trafic */}
            <AdminCard className="p-5">
              <h2 className="mb-4 inline-flex items-center gap-2 font-display text-base font-bold text-navy">
                <ExternalLink size={16} className="text-brand-violet" aria-hidden /> Sources externes (30 j)
              </h2>
              {a.topReferrers.length === 0 ? (
                <p className="text-sm text-text-muted">Aucune source externe enregistrée. La plupart des visites sont directes ou internes.</p>
              ) : (
                <ListBars label="sources" rows={a.topReferrers.map((r) => ({ name: r.referrer, views: r.views }))} />
              )}
            </AdminCard>
          </div>
        </>
      )}
    </div>
  );
}
