import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Wallet,
  CalendarDays,
  Flag,
  ListChecks,
  FileText,
  Wrench,
  ArrowUpRight,
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
import { getProjectDetail } from "@/lib/portal-queries";
import type { ProjectStatus, InvoiceStatus } from "@/lib/portal-queries";
import { Timeline } from "./Timeline";
import { ProjectChat } from "./ProjectChat";

export const dynamic = "force-dynamic";

const statusMeta: Record<
  ProjectStatus,
  { label: string; variant: "info" | "success" | "warning" | "default" }
> = {
  PENDING: { label: "En attente", variant: "warning" },
  IN_PROGRESS: { label: "En cours", variant: "info" },
  REVIEW: { label: "En révision", variant: "warning" },
  DELIVERED: { label: "Livré", variant: "success" },
  MAINTENANCE: { label: "Maintenance", variant: "success" },
  ARCHIVED: { label: "Archivé", variant: "default" },
};

const invoiceMeta: Record<
  InvoiceStatus,
  { label: string; variant: "warning" | "success" | "default" }
> = {
  DRAFT: { label: "Brouillon", variant: "default" },
  SENT: { label: "À payer", variant: "warning" },
  PAID: { label: "Payée", variant: "success" },
  OVERDUE: { label: "En retard", variant: "warning" },
  CANCELLED: { label: "Annulée", variant: "default" },
};

const typeLabels: Record<string, string> = {
  SITE_VITRINE: "Site vitrine",
  SITE_INSTITUTIONNEL: "Site institutionnel",
  ELEARNING: "Plateforme e-learning",
  REFONTE: "Refonte",
  MAINTENANCE: "Maintenance",
  OTHER: "Autre",
};

const planLabels: Record<string, string> = {
  BASIC: "Basic",
  STANDARD: "Standard",
  PREMIUM: "Premium",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return { title: "Projet", robots: { index: false, follow: false } };
  const project = await getProjectDetail(user.id, id);
  return {
    title: project ? project.title : "Projet introuvable",
    robots: { index: false, follow: false },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect(`/auth/login?callbackUrl=/mes-projets/${id}`);

  const project = await getProjectDetail(user.id, id);
  if (!project) notFound();

  const st = statusMeta[project.status] ?? statusMeta.PENDING;
  const typeLabel = typeLabels[project.type] ?? project.type;

  return (
    <Section spacing="md" className="min-h-[80vh] pt-28">
      <Container>
        {/* Fil d'ariane */}
        <Link
          href="/mes-projets"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal"
        >
          <ArrowLeft size={16} />
          Mes projets
        </Link>

        {/* En-tête projet */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary">
          <div className="relative border-b border-navy/[0.06] bg-grid p-7 sm:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-da" />
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-blue-royal">
                    {typeLabel}
                  </span>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
                <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
                  {project.title}
                </h1>
                {project.description && (
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                    {project.description}
                  </p>
                )}
              </div>

              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses({ variant: "primary", size: "md" })}
                >
                  <ExternalLink size={16} />
                  Voir le site
                </a>
              )}
            </div>

            {/* Méta : budget, dates */}
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              {project.budget != null && (
                <span className="flex items-center gap-2 text-text-secondary">
                  <Wallet size={16} className="text-brand-blue-vif" />
                  Budget&nbsp;
                  <span className="font-display font-bold text-navy">
                    {formatFCFA(project.budget)}
                  </span>
                </span>
              )}
              {project.startDate && (
                <span className="flex items-center gap-2 text-text-secondary">
                  <CalendarDays size={16} className="text-brand-blue-vif" />
                  Début&nbsp;
                  <span className="font-semibold text-navy">
                    {formatDate(project.startDate)}
                  </span>
                </span>
              )}
              {project.endDate && (
                <span className="flex items-center gap-2 text-text-secondary">
                  <Flag size={16} className="text-brand-blue-vif" />
                  Livraison prévue&nbsp;
                  <span className="font-semibold text-navy">
                    {formatDate(project.endDate)}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Barre de progression globale */}
          <div className="p-7 sm:p-8">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-semibold text-navy">
                <ListChecks size={16} className="text-brand-blue-royal" />
                Avancement global
              </span>
              <span className="font-display text-lg font-extrabold text-navy">
                {project.progress}%
              </span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-navy/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-da transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-text-muted">
              {project.completedStages} étape{project.completedStages > 1 ? "s" : ""} terminée
              {project.completedStages > 1 ? "s" : ""} sur {project.totalStages}
            </p>
          </div>
        </div>

        {/* Layout 2 colonnes */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.55fr_1fr]">
          {/* Colonne principale : timeline + messagerie */}
          <div className="space-y-8">
            <div>
              <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-bold text-navy">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue-vif/10 text-brand-blue-royal">
                  <ListChecks size={18} />
                </span>
                Étapes du projet
              </h2>
              <Timeline projectId={project.id} stages={project.stages} />
            </div>

            <ProjectChat
              projectId={project.id}
              clientName={user.name ?? user.email ?? "Vous"}
              messages={project.messages}
            />
          </div>

          {/* Encart latéral */}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            {/* Factures du projet */}
            <div className="overflow-hidden rounded-xl border border-navy/[0.07] bg-surface-primary">
              <div className="flex items-center gap-2 border-b border-navy/[0.06] px-5 py-3.5">
                <FileText size={16} className="text-brand-blue-royal" />
                <h3 className="font-display text-base font-bold text-navy">Factures</h3>
              </div>
              {project.invoices.length > 0 ? (
                <ul className="divide-y divide-navy/[0.06]">
                  {project.invoices.map((inv) => {
                    const im = invoiceMeta[inv.status] ?? invoiceMeta.SENT;
                    return (
                      <li key={inv.id}>
                        <Link
                          href={`/factures/${inv.id}`}
                          className="group flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface-secondary/50"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-navy">
                              Facture {inv.number}
                            </p>
                            <p className="mt-0.5 text-sm text-text-secondary">
                              {formatFCFA(inv.total)}
                              {inv.dueDate && ` · échéance ${formatDate(inv.dueDate)}`}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge variant={im.variant}>{im.label}</Badge>
                            <ArrowUpRight
                              size={15}
                              className="text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-blue-royal"
                            />
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-5 py-6 text-sm text-text-muted">
                  Aucune facture rattachée à ce projet.
                </p>
              )}
            </div>

            {/* Contrat de maintenance */}
            {project.maintenance && (
              <div className="relative overflow-hidden rounded-xl border border-navy/[0.07] bg-surface-primary p-5">
                <div className="flex items-start gap-3">
                  <IconBadge tone="gradient" size="sm">
                    <Wrench size={18} />
                  </IconBadge>
                  <div>
                    <h3 className="font-display text-base font-bold text-navy">
                      Contrat de maintenance
                    </h3>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      Plan{" "}
                      <span className="font-semibold text-navy">
                        {planLabels[project.maintenance.plan] ?? project.maintenance.plan}
                      </span>{" "}
                      actif sur ce projet.
                    </p>
                  </div>
                </div>
                <Link
                  href="/maintenance"
                  className={cn(
                    buttonClasses({ variant: "outline", size: "sm" }),
                    "mt-4 w-full",
                  )}
                >
                  Gérer la maintenance
                  <ArrowUpRight size={15} />
                </Link>
              </div>
            )}

            {/* Aide */}
            <div className="rounded-xl border border-dashed border-navy/15 bg-surface-secondary/50 p-5 text-sm">
              <p className="font-semibold text-navy">Une question ?</p>
              <p className="mt-1 text-text-secondary">
                Utilisez la messagerie du projet, ou ouvrez un ticket depuis le
                support pour toute demande.
              </p>
              <Link
                href="/support"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal hover:text-brand-violet"
              >
                Contacter le support
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </aside>
        </div>
      </Container>
    </Section>
  );
}
