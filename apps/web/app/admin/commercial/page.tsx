import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2, PhoneCall, ClipboardCheck, FileSearch, Handshake, Trophy,
  CalendarClock, AlertTriangle, ArrowRight, Plus, BellRing,
} from "lucide-react";
import { buttonClasses, formatFCFA, cn } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { AdminPageHeader, StatCard } from "@/components/admin/ui";
import { getCommercialHomeStats } from "@/lib/crm-queries";
import { getFollowUpAlerts } from "@/lib/crm-alerts";
import { isAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Espace commercial" };

export default async function CommercialHomePage() {
  const [user, stats, alerts] = await Promise.all([
    currentUser(),
    getCommercialHomeStats(),
    getFollowUpAlerts(12),
  ]);
  const admin = isAdmin(user);
  const firstName = (user?.name ?? "").split(" ")[0] || "vous";

  return (
    <div>
      <AdminPageHeader
        title={<>Espace <span className="text-gradient bg-gradient-to-r from-brand-violet to-brand-cyan bg-clip-text text-transparent">commercial</span></>}
        description={admin
          ? "Vue d'ensemble du pipeline commercial de toute l'équipe."
          : `Bonjour ${firstName}, voici vos priorités commerciales du jour.`}
      >
        <Link href="/admin/prospects/nouveau" className={buttonClasses({ variant: "primary", size: "md" })}>
          <Plus size={17} /> Nouveau prospect
        </Link>
      </AdminPageHeader>

      {/* Priorités du jour */}
      {(stats.followUpsToday > 0 || stats.followUpsOverdue > 0) && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <PriorityCard
            tone="amber"
            icon={<CalendarClock size={18} />}
            count={stats.followUpsToday}
            label="relance(s) prévue(s) aujourd'hui"
            href="/admin/prospects"
          />
          <PriorityCard
            tone="red"
            icon={<AlertTriangle size={18} />}
            count={stats.followUpsOverdue}
            label="relance(s) en retard"
            href="/admin/prospects"
          />
        </div>
      )}

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={<Building2 size={20} />} tone="violet" label={admin ? "Prospects (équipe)" : "Mes prospects"} value={stats.assignedProspects} />
        <StatCard icon={<PhoneCall size={20} />} tone="blue" label="À contacter" value={stats.toContact} hint="prêts / à relancer" />
        <StatCard icon={<FileSearch size={20} />} tone="cyan" label="Audits en cours" value={stats.auditsInProgress} />
        <StatCard icon={<ClipboardCheck size={20} />} tone="amber" label="Audits à valider" value={stats.auditsToValidate} />
        <StatCard icon={<Handshake size={20} />} tone="violet" label="Opportunités ouvertes" value={stats.openDeals} hint={formatFCFA(stats.pipelineValue)} />
        <StatCard icon={<Trophy size={20} />} tone="green" label="Contrats gagnés" value={stats.wonDeals} />
      </div>

      {/* Alertes & relances */}
      {alerts.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-navy">
            <BellRing size={18} className="text-brand-violet" /> Alertes &amp; relances
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {alerts.map((a) => (
              <Link
                key={a.id}
                href={a.href}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 transition-shadow hover:shadow-md",
                  a.tone === "red" ? "border-error/20 bg-error/[0.04]" : "border-warning/25 bg-warning/[0.05]",
                )}
              >
                <span className={cn("mt-0.5 shrink-0", a.tone === "red" ? "text-error" : "text-[#B45309]")}>
                  <AlertTriangle size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy">{a.title}</p>
                  <p className="text-xs text-text-secondary">{a.description}</p>
                </div>
                <ArrowRight size={15} className="ml-auto mt-0.5 shrink-0 text-navy/40" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Accès rapides */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <QuickLink href="/admin/prospects" title="Prospects" description="Pipeline sortant, audits et relances." icon={<Building2 size={20} />} />
        <QuickLink href="/admin/prospects/nouveau" title="Ajouter un prospect" description="Identifier une nouvelle structure à démarcher." icon={<Plus size={20} />} />
      </div>
    </div>
  );
}

function PriorityCard({ tone, icon, count, label, href }: {
  tone: "amber" | "red"; icon: React.ReactNode; count: number; label: string; href: string;
}) {
  const styles = tone === "red"
    ? "border-error/20 bg-error/[0.04] text-error"
    : "border-warning/25 bg-warning/[0.06] text-[#B45309]";
  return (
    <Link href={href} className={`flex items-center gap-4 rounded-2xl border p-5 transition-shadow hover:shadow-lg ${styles}`}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/70">{icon}</span>
      <p className="text-sm font-semibold text-navy">
        <span className="font-display text-2xl font-extrabold">{count}</span> {label}
      </p>
      <ArrowRight size={18} className="ml-auto text-navy/40" />
    </Link>
  );
}

function QuickLink({ href, title, description, icon }: {
  href: string; title: string; description: string; icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 transition-shadow hover:shadow-lg"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-blue-vif/10 text-brand-blue-royal">{icon}</span>
      <div className="min-w-0">
        <p className="font-display font-bold text-navy">{title}</p>
        <p className="text-sm text-text-secondary">{description}</p>
      </div>
      <ArrowRight size={18} className="ml-auto text-text-muted transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
