import type { Metadata } from "next";
import {
  Users,
  BookOpen,
  BadgeCheck,
  CreditCard,
  Tags,
  Globe,
  Mail,
  ExternalLink,
  Database,
  KeyRound,
  GitBranch,
  Wallet,
  Coins,
  HardDrive,
  Radio,
  ShieldAlert,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { Monogram } from "@da/ui";
import { getSystemStatus } from "@/lib/admin-queries";
import {
  AdminPageHeader,
  StatCard,
  AdminCard,
  StatusPill,
} from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paramètres — Administration",
  robots: { index: false, follow: false },
};

type Integrations = Awaited<ReturnType<typeof getSystemStatus>>["integrations"];

/** Description d'un service pour la grille « Intégrations ». */
type ServiceItem = {
  key: keyof Integrations;
  icon: LucideIcon;
  name: string;
  description: string;
};

const SERVICES: ServiceItem[] = [
  {
    key: "database",
    icon: Database,
    name: "Base de données",
    description: "PostgreSQL Neon — persistance des données.",
  },
  {
    key: "email",
    icon: Mail,
    name: "Email transactionnel",
    description: "Resend — vérification de compte, reçus, notifications.",
  },
  {
    key: "googleOAuth",
    icon: KeyRound,
    name: "Connexion Google",
    description: "OAuth Google (optionnel).",
  },
  {
    key: "githubOAuth",
    icon: GitBranch,
    name: "Connexion GitHub",
    description: "OAuth GitHub (optionnel).",
  },
  {
    key: "cinetpay",
    icon: Wallet,
    name: "Paiement CinetPay",
    description: "Mobile Money automatique (à venir).",
  },
  {
    key: "fedapay",
    icon: Coins,
    name: "Paiement FedaPay",
    description: "Alternative Mobile Money (optionnel).",
  },
  {
    key: "blob",
    icon: HardDrive,
    name: "Stockage de fichiers",
    description: "Vercel Blob — vidéos et pièces jointes.",
  },
  {
    key: "ably",
    icon: Radio,
    name: "Temps réel",
    description: "Ably — chat en direct (sinon polling).",
  },
  {
    key: "sentry",
    icon: ShieldAlert,
    name: "Supervision",
    description: "Sentry — suivi des erreurs (optionnel).",
  },
];

export default async function AdminSettingsPage() {
  const s = await getSystemStatus();
  const configuredCount = SERVICES.filter((svc) => s.integrations[svc.key] === true).length;

  return (
    <div>
      <AdminPageHeader
        title="Paramètres"
        description="Configuration et état des services de la plateforme."
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-navy/[0.08] bg-surface-primary px-3.5 py-2 text-sm font-semibold text-text-secondary">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-da text-[11px] font-bold text-white tabular-nums">
            {configuredCount}
          </span>
          service{configuredCount > 1 ? "s" : ""} configuré{configuredCount > 1 ? "s" : ""}
        </span>
      </AdminPageHeader>

      {/* ─────────────────── Identité de la plateforme ─────────────────── */}
      <AdminCard title="Identité de la plateforme" bodyClassName="p-0">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-da shadow-lg">
            <Monogram variant="white" size={36} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-lg font-extrabold text-navy">Access Academy</p>
            <p className="mt-0.5 text-sm text-text-secondary">
              Plateforme e-learning de Digital Access — Côte d&apos;Ivoire.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px border-t border-navy/[0.06] bg-navy/[0.06] sm:grid-cols-3">
          <InfoTile
            icon={<Globe size={16} />}
            label="Academy"
            value={displayUrl(s.urls.academy)}
            href={s.urls.academy}
            tone="violet"
          />
          <InfoTile
            icon={<ExternalLink size={16} />}
            label="Site Digital Access"
            value={displayUrl(s.urls.web)}
            href={s.urls.web}
            tone="cyan"
          />
          <InfoTile
            icon={<Mail size={16} />}
            label="Adresse d'envoi"
            value={s.integrations.emailFrom}
            tone="blue"
          />
        </div>
      </AdminCard>

      {/* ──────────────────────────── Statistiques ──────────────────────────── */}
      <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={<Users size={20} />}
          label="Utilisateurs"
          value={s.stats.users}
          tone="blue"
        />
        <StatCard
          icon={<BookOpen size={20} />}
          label="Cours"
          value={s.stats.courses}
          tone="violet"
        />
        <StatCard
          icon={<BadgeCheck size={20} />}
          label="Cours publiés"
          value={s.stats.published}
          tone="green"
        />
        <StatCard
          icon={<CreditCard size={20} />}
          label="Paiements"
          value={s.stats.payments}
          tone="amber"
        />
        <StatCard
          icon={<Tags size={20} />}
          label="Catégories"
          value={s.stats.categories}
          tone="cyan"
        />
      </section>

      {/* ────────────────────── Intégrations & services ────────────────────── */}
      <AdminCard
        title="Intégrations & services"
        className="mt-6"
        action={
          <span className="text-xs font-semibold text-text-muted tabular-nums">
            {configuredCount} / {SERVICES.length}
          </span>
        }
        bodyClassName="p-0"
      >
        <ul className="grid grid-cols-1 gap-px bg-navy/[0.06] sm:grid-cols-2">
          {SERVICES.map((svc) => {
            const configured = s.integrations[svc.key] === true;
            const Icon = svc.icon;
            return (
              <li
                key={svc.key}
                className="flex items-start gap-3 bg-surface-primary p-4"
              >
                <span
                  className={
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl " +
                    (configured
                      ? "bg-brand-violet/10 text-brand-violet"
                      : "bg-navy/[0.05] text-text-muted")
                  }
                >
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-navy">{svc.name}</p>
                    <StatusPill
                      label={configured ? "Configuré" : "Non configuré"}
                      tone={configured ? "green" : "slate"}
                    />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                    {svc.description}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </AdminCard>

      {/* ─────────────────────────── Note secrets ─────────────────────────── */}
      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-navy/[0.07] bg-surface-secondary px-5 py-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy/[0.05] text-text-secondary">
          <Lock size={16} />
        </span>
        <p className="text-sm leading-relaxed text-text-secondary">
          Les clés d&apos;API et secrets se configurent dans les{" "}
          <span className="font-semibold text-navy">variables d&apos;environnement</span> du
          déploiement. Ils ne sont jamais exposés sur cette page — seul l&apos;état
          « configuré / non configuré » est affiché.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Sous-composants ─────────────────────────── */

const TILE_TONE: Record<"violet" | "cyan" | "blue", string> = {
  violet: "bg-brand-violet/10 text-brand-violet",
  cyan: "bg-brand-cyan/15 text-[#0891a6]",
  blue: "bg-brand-blue-royal/10 text-brand-blue-royal",
};

/** Tuile d'information dans la carte identité (lien cliquable si href fourni). */
function InfoTile({
  icon,
  label,
  value,
  href,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  tone: "violet" | "cyan" | "blue";
}) {
  const inner = (
    <>
      <span className={"grid h-9 w-9 shrink-0 place-items-center rounded-xl " + TILE_TONE[tone]}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-text-muted">{label}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-sm font-semibold text-navy">
          <span className="truncate">{value}</span>
          {href && (
            <ExternalLink
              size={13}
              className="shrink-0 text-text-muted transition-colors group-hover:text-brand-violet"
            />
          )}
        </p>
      </div>
    </>
  );

  const baseClass = "flex items-center gap-3 bg-surface-primary p-4";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={"group transition-colors hover:bg-navy/[0.02] " + baseClass}
      >
        {inner}
      </a>
    );
  }

  return <div className={baseClass}>{inner}</div>;
}

/** Affiche une URL sans le préfixe protocolaire, pour la lisibilité. */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}
