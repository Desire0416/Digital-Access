import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ShieldCheck,
  CalendarClock,
  RefreshCw,
  Check,
  CalendarDays,
  Wallet,
  ArrowRight,
  ArrowUpRight,
  FolderKanban,
  LifeBuoy,
  DatabaseBackup,
  Rocket,
  Crown,
  Sparkles,
} from "lucide-react";
import {
  Container,
  Section,
  Badge,
  IconBadge,
  buttonClasses,
  cn,
  formatFCFA,
  formatDate,
} from "@da/ui";
import { currentUser } from "@da/auth/guards";
import {
  getClientMaintenance,
  type MaintenancePlan,
} from "@/lib/portal-queries";
import { PageHero } from "@/components/PageHero";
import { MaintenanceActions } from "./MaintenanceActions";

export const metadata: Metadata = {
  title: "Contrat de maintenance",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/* ── Configuration visuelle des formules ─────────────────────────────────── */

const planConfig: Record<
  MaintenancePlan,
  { label: string; badge: "gradient" | "info" | "soft"; accent: string; icon: typeof ShieldCheck }
> = {
  BASIC: { label: "Basic", badge: "soft", accent: "text-brand-blue-royal", icon: ShieldCheck },
  STANDARD: { label: "Standard", badge: "gradient", accent: "text-brand-violet", icon: Rocket },
  PREMIUM: { label: "Premium", badge: "gradient", accent: "text-accent", icon: Crown },
};

/* ── Comparatif pédagogique des 3 formules ───────────────────────────────── */

const planCompare: {
  plan: MaintenancePlan;
  icon: typeof ShieldCheck;
  tagline: string;
  price: string;
  featured?: boolean;
  features: string[];
}[] = [
  {
    plan: "BASIC",
    icon: ShieldCheck,
    tagline: "L'essentiel pour rester en ligne sereinement.",
    price: "à partir de 15 000 FCFA/mois",
    features: [
      "Mises à jour de sécurité mensuelles",
      "Sauvegarde hebdomadaire du site",
      "Surveillance de disponibilité 24/7",
      "Support par email sous 48 h",
      "1 h de petites modifications / mois",
    ],
  },
  {
    plan: "STANDARD",
    icon: Rocket,
    tagline: "Le meilleur équilibre pour un site qui évolue.",
    price: "à partir de 35 000 FCFA/mois",
    featured: true,
    features: [
      "Tout le pack Basic inclus",
      "Sauvegarde quotidienne + restauration rapide",
      "Mises à jour du CMS et des plugins",
      "Support prioritaire WhatsApp sous 24 h",
      "3 h de modifications / mois",
      "Rapport de performance mensuel",
    ],
  },
  {
    plan: "PREMIUM",
    icon: Crown,
    tagline: "Accompagnement complet et réactivité maximale.",
    price: "sur devis",
    features: [
      "Tout le pack Standard inclus",
      "Sauvegarde en continu + PRA dédié",
      "Optimisation SEO & vitesse trimestrielle",
      "Support dédié sous 4 h ouvrées",
      "8 h de modifications / mois",
      "Point stratégique mensuel avec un expert",
    ],
  },
];

export default async function MaintenancePage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/maintenance");

  const contracts = await getClientMaintenance(user.id);
  const hasContracts = contracts.length > 0;

  return (
    <>
      <PageHero
        eyebrow="Espace client"
        title={
          <>
            Contrat de <span className="text-gradient-da">maintenance</span>
          </>
        }
        description="Votre site entretenu, sécurisé et sauvegardé — sans y penser. Retrouvez ici votre formule active, les services inclus et vos prochaines échéances."
      />

      <Section spacing="md" className="pt-0">
        <Container>
          {hasContracts ? (
            <div className="grid gap-6">
              {contracts.map((c) => {
                const cfg = planConfig[c.plan];
                const PlanIcon = cfg.icon;
                return (
                  <article
                    key={c.id}
                    className="card-gradient-border overflow-hidden rounded-2xl bg-surface-primary"
                  >
                    <div className="grid gap-0 lg:grid-cols-[1.55fr_1fr]">
                      {/* Corps du contrat */}
                      <div className="p-6 sm:p-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <IconBadge
                              tone={c.plan === "BASIC" ? "soft" : "gradient"}
                              size="lg"
                            >
                              <PlanIcon size={24} />
                            </IconBadge>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                                Formule
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <h2 className="font-display text-2xl font-extrabold text-navy">
                                  Maintenance {cfg.label}
                                </h2>
                                <Badge variant={cfg.badge}>{cfg.label}</Badge>
                              </div>
                            </div>
                          </div>
                          {c.autoRenew && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-success/25 bg-success/[0.08] px-3 py-1.5 text-xs font-semibold text-success">
                              <RefreshCw size={13} />
                              Renouvellement automatique
                            </span>
                          )}
                        </div>

                        {/* Projet concerné */}
                        <Link
                          href="/mes-projets"
                          className="group mt-6 flex items-center justify-between rounded-xl border border-navy/[0.07] bg-surface-secondary/60 px-4 py-3.5 transition-colors hover:border-brand-blue-vif/30 hover:bg-brand-blue-vif/[0.04]"
                        >
                          <span className="flex items-center gap-3">
                            <FolderKanban
                              size={18}
                              className="text-brand-blue-royal"
                            />
                            <span>
                              <span className="block text-xs text-text-muted">
                                Projet couvert
                              </span>
                              <span className="block font-display text-sm font-bold text-navy">
                                {c.projectTitle}
                              </span>
                            </span>
                          </span>
                          <ArrowUpRight
                            size={16}
                            className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          />
                        </Link>

                        {/* Période */}
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-navy/[0.07] px-4 py-3.5">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                              <CalendarDays size={14} />
                              Début du contrat
                            </div>
                            <p className="mt-1 font-display text-sm font-bold text-navy">
                              {formatDate(c.startDate)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-navy/[0.07] px-4 py-3.5">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                              <CalendarClock size={14} />
                              Échéance
                            </div>
                            <p className="mt-1 font-display text-sm font-bold text-navy">
                              {formatDate(c.endDate)}
                            </p>
                          </div>
                        </div>

                        {/* Services inclus */}
                        <div className="mt-6">
                          <h3 className="flex items-center gap-2 text-sm font-bold text-navy">
                            <ShieldCheck
                              size={16}
                              className="text-brand-blue-royal"
                            />
                            Services inclus dans votre formule
                          </h3>
                          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                            {c.services.map((service) => (
                              <li
                                key={service}
                                className="flex items-start gap-2.5 text-sm text-text-secondary"
                              >
                                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-da text-white">
                                  <Check size={12} strokeWidth={3} />
                                </span>
                                <span>{service}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Encart prélèvement + actions */}
                      <aside className="relative flex flex-col justify-between gap-6 border-t border-navy/[0.07] bg-surface-secondary/50 p-6 sm:p-8 lg:border-l lg:border-t-0">
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 bg-grid opacity-[0.4]"
                        />
                        <div className="relative">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-text-muted">
                            Montant mensuel
                          </p>
                          <p className="mt-1.5 font-display text-4xl font-extrabold leading-none text-navy">
                            {formatFCFA(c.monthlyAmount)}
                          </p>
                          <p className="mt-1 text-sm text-text-secondary">
                            par mois, {c.autoRenew ? "renouvelé automatiquement" : "sans engagement"}
                          </p>

                          {/* Prochain prélèvement — encart décoratif */}
                          <div className="mt-5 overflow-hidden rounded-xl bg-gradient-da p-[1.5px]">
                            <div className="rounded-[10.5px] bg-surface-primary px-4 py-3.5">
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-blue-royal">
                                <Wallet size={14} />
                                Prochain prélèvement
                              </div>
                              <p className="mt-1.5 flex items-baseline gap-1.5">
                                <span className="font-display text-lg font-extrabold text-navy">
                                  {formatFCFA(c.monthlyAmount)}
                                </span>
                                <span className="text-xs text-text-muted">
                                  · échéance {formatDate(c.endDate)}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <MaintenanceActions
                            plan={cfg.label}
                            projectTitle={c.projectTitle}
                          />
                        </div>
                      </aside>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* ── État vide brandé ─────────────────────────────────────────── */
            <div className="overflow-hidden rounded-2xl border border-dashed border-navy/15 bg-surface-secondary/40">
              <div className="relative isolate px-6 py-12 text-center sm:px-10 sm:py-16">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-grid opacity-50"
                />
                <div className="relative mx-auto max-w-2xl">
                  <IconBadge tone="gradient" size="lg" className="mx-auto">
                    <ShieldCheck size={24} />
                  </IconBadge>
                  <h2 className="mt-5 font-display text-2xl font-extrabold text-navy">
                    Aucun contrat de maintenance actif
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
                    Un site web est vivant : il doit être mis à jour, sauvegardé
                    et surveillé pour rester rapide, sûr et en ligne. Nos
                    formules de maintenance vous libèrent de cette charge.
                  </p>

                  <div className="mx-auto mt-8 grid max-w-lg gap-3 text-left sm:grid-cols-3">
                    {[
                      { icon: Rocket, label: "Mises à jour", desc: "CMS, plugins et sécurité" },
                      { icon: DatabaseBackup, label: "Sauvegardes", desc: "Restauration en un clic" },
                      { icon: LifeBuoy, label: "Support prioritaire", desc: "Réponse rapide garantie" },
                    ].map((f) => (
                      <div
                        key={f.label}
                        className="rounded-xl border border-navy/[0.07] bg-surface-primary p-4"
                      >
                        <IconBadge tone="soft" size="sm">
                          <f.icon size={16} />
                        </IconBadge>
                        <p className="mt-2.5 text-sm font-bold text-navy">
                          {f.label}
                        </p>
                        <p className="mt-0.5 text-xs text-text-secondary">
                          {f.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/services#maintenance"
                      className={buttonClasses({ variant: "primary", size: "md" })}
                    >
                      Découvrir la maintenance
                      <ArrowRight size={17} />
                    </Link>
                    <Link
                      href="/mon-espace"
                      className={buttonClasses({ variant: "outline", size: "md" })}
                    >
                      <Sparkles size={16} />
                      Mon espace
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Comparatif des formules ────────────────────────────────────── */}
          <div className="mt-16">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue-vif/20 bg-brand-blue-vif/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-blue-royal">
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-da" />
                Nos formules
              </span>
              <h2 className="mt-4 font-display text-2xl font-extrabold text-navy sm:text-3xl">
                Choisissez le niveau d'accompagnement
                <span className="text-gradient-da"> qui vous ressemble</span>
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-text-secondary">
                {hasContracts
                  ? "Besoin de plus de réactivité ou d'heures de modification ? Passez à la formule supérieure à tout moment."
                  : "Trois formules pensées pour les sites de nos clients en Côte d'Ivoire, du plus simple au plus exigeant."}
              </p>
            </div>

            <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-3">
              {planCompare.map((p) => {
                const cfg = planConfig[p.plan];
                const Icon = p.icon;
                return (
                  <div
                    key={p.plan}
                    className={cn(
                      "relative flex flex-col rounded-2xl bg-surface-primary p-6 transition-all hover:-translate-y-1 hover:shadow-xl",
                      p.featured
                        ? "card-gradient-border shadow-lg lg:-mt-3"
                        : "border border-navy/[0.09]",
                    )}
                  >
                    {p.featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-da px-3.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
                        Le plus choisi
                      </span>
                    )}
                    <div className="flex items-center gap-3">
                      <IconBadge tone={p.plan === "BASIC" ? "soft" : "gradient"}>
                        <Icon size={20} />
                      </IconBadge>
                      <h3
                        className={cn(
                          "font-display text-xl font-extrabold",
                          cfg.accent,
                        )}
                      >
                        {cfg.label}
                      </h3>
                    </div>
                    <p className="mt-3 text-sm text-text-secondary">
                      {p.tagline}
                    </p>
                    <p className="mt-4 font-display text-base font-bold text-navy">
                      {p.price}
                    </p>
                    <ul className="mt-5 flex-1 space-y-2.5 border-t border-navy/[0.07] pt-5">
                      {p.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2.5 text-sm text-text-secondary"
                        >
                          <span
                            className={cn(
                              "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                              p.featured
                                ? "bg-gradient-da text-white"
                                : "bg-brand-blue-vif/10 text-brand-blue-royal",
                            )}
                          >
                            <Check size={12} strokeWidth={3} />
                          </span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/services#maintenance"
                      className={cn(
                        buttonClasses({
                          variant: p.featured ? "primary" : "outline",
                          size: "sm",
                        }),
                        "mt-6 w-full",
                      )}
                    >
                      {p.featured ? "Souscrire" : "En savoir plus"}
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                );
              })}
            </div>

            <p className="mt-8 text-center text-xs text-text-muted">
              Tarifs indicatifs HT. Le montant exact dépend de la taille et de la
              complexité de votre site — parlons-en depuis votre{" "}
              <Link
                href="/support"
                className="font-semibold text-brand-blue-royal hover:text-brand-violet"
              >
                espace support
              </Link>
              .
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
