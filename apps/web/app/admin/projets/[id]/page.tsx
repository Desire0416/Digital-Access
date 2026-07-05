import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  Coins,
  CalendarDays,
  ExternalLink,
  Layers,
} from "lucide-react";
import { formatFCFA, formatDate } from "@da/ui";
import { PROJECT_STATUS, PROJECT_TYPE, StatusPill, type Tone } from "@/components/admin/ui";
import { getAdminProject } from "@/lib/admin-queries";
import { ProjectManager } from "./ProjectManager";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getAdminProject(id);
  return { title: project ? project.title : "Projet introuvable" };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getAdminProject(id);
  if (!project) notFound();

  const meta = PROJECT_STATUS[project.status]!;

  return (
    <div>
      {/* Fil d'Ariane */}
      <Link
        href="/admin/projets"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux projets
      </Link>

      {/* En-tête du projet */}
      <header className="relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-7">
        {/* Filet dégradé signature */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-da" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusPill label={meta.label} tone={meta.tone as Tone} />
              <span className="inline-flex items-center rounded-full bg-brand-violet/10 px-2.5 py-1 text-[11px] font-semibold text-brand-violet">
                {PROJECT_TYPE[project.type] ?? project.type}
              </span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
              {project.title}
            </h1>
            {project.description && (
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
                {project.description}
              </p>
            )}
          </div>

          {/* Progression synthétique */}
          <div className="shrink-0 rounded-xl border border-navy/[0.07] bg-surface-secondary/60 px-5 py-4 text-center sm:min-w-[140px]">
            <p className="font-display text-3xl font-extrabold text-navy">
              {project.progress}
              <span className="text-lg text-text-muted">%</span>
            </p>
            <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-medium text-text-secondary">
              <Layers className="h-3 w-3" />
              {project.completedStages}/{project.totalStages} étape
              {project.totalStages > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Méta-infos */}
        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-navy/[0.06] pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            icon={<Building2 className="h-4 w-4" />}
            label="Client"
            value={project.client.name}
          />
          <InfoItem
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={
              <a
                href={`mailto:${project.client.email}`}
                className="truncate text-brand-blue-royal hover:underline"
              >
                {project.client.email}
              </a>
            }
          />
          <InfoItem
            icon={<Coins className="h-4 w-4" />}
            label="Budget"
            value={project.budget != null ? formatFCFA(project.budget) : "À définir"}
          />
          <InfoItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Échéance"
            value={
              project.endDate
                ? formatDate(project.endDate)
                : project.startDate
                  ? `Démarré le ${formatDate(project.startDate)}`
                  : "Non planifiée"
            }
          />
        </dl>

        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-navy/[0.09] bg-surface-primary px-3.5 py-2 text-sm font-semibold text-navy transition-colors hover:border-brand-cyan/40 hover:text-brand-blue-royal"
          >
            <ExternalLink className="h-4 w-4" />
            Voir le site en ligne
          </a>
        )}
      </header>

      {/* Gestion interactive */}
      <ProjectManager project={project} />
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy/[0.05] text-text-secondary">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
          {label}
        </dt>
        <dd className="mt-0.5 truncate text-sm font-semibold text-navy">{value}</dd>
      </div>
    </div>
  );
}
