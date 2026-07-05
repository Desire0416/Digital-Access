"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Layers, Flag } from "lucide-react";
import { Badge, formatDate } from "@da/ui";
import type { ProjectListItem } from "@/lib/portal-queries";

const statusMeta: Record<
  ProjectListItem["status"],
  { label: string; variant: "info" | "success" | "warning" | "default" }
> = {
  PENDING: { label: "En attente", variant: "warning" },
  IN_PROGRESS: { label: "En cours", variant: "info" },
  REVIEW: { label: "En révision", variant: "warning" },
  DELIVERED: { label: "Livré", variant: "success" },
  MAINTENANCE: { label: "Maintenance", variant: "success" },
  ARCHIVED: { label: "Archivé", variant: "default" },
};

const typeLabels: Record<string, string> = {
  SITE_VITRINE: "Site vitrine",
  SITE_INSTITUTIONNEL: "Site institutionnel",
  ELEARNING: "Plateforme e-learning",
  REFONTE: "Refonte",
  MAINTENANCE: "Maintenance",
  OTHER: "Autre",
};

export function ProjectCard({ project }: { project: ProjectListItem }) {
  const st = statusMeta[project.status] ?? statusMeta.PENDING;
  const typeLabel = typeLabels[project.type] ?? project.type;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="h-full"
    >
      <Link
        href={`/mes-projets/${project.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-navy/[0.07] bg-surface-primary transition-shadow hover:shadow-xl"
      >
        {/* Bandeau dégradé signature */}
        <div className="relative h-1.5 w-full bg-gradient-da" />

        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-blue-royal">
                {typeLabel}
              </span>
              <h3 className="mt-1 font-display text-lg font-bold leading-snug text-navy transition-colors group-hover:text-brand-blue-royal">
                {project.title}
              </h3>
            </div>
            <Badge variant={st.variant} className="shrink-0">
              {st.label}
            </Badge>
          </div>

          {/* Étape en cours */}
          <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
            <Flag size={15} className="shrink-0 text-brand-blue-vif" />
            {project.currentStage ? (
              <span>
                Étape en cours&nbsp;:{" "}
                <span className="font-semibold text-navy">{project.currentStage}</span>
              </span>
            ) : (
              <span className="text-text-muted">
                {project.status === "DELIVERED"
                  ? "Toutes les étapes sont terminées"
                  : "Étapes en préparation"}
              </span>
            )}
          </div>

          {/* Barre de progression dégradée */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-text-secondary">
                <Layers size={13} />
                {project.completedStages}/{project.totalStages} étapes
              </span>
              <span className="font-display font-bold text-navy">{project.progress}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy/[0.08]">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${project.progress}%` }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="h-full rounded-full bg-gradient-da"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted">
            {project.startDate && (
              <span className="flex items-center gap-1.5">
                <CalendarDays size={13} />
                Début {formatDate(project.startDate)}
              </span>
            )}
            {project.endDate && (
              <span className="flex items-center gap-1.5">
                <Flag size={13} />
                Livraison {formatDate(project.endDate)}
              </span>
            )}
          </div>

          {/* Pied de card */}
          <div className="mt-6 flex items-center justify-between border-t border-navy/[0.06] pt-4">
            <span className="text-sm font-semibold text-navy">Suivre le projet</span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue-vif/10 text-brand-blue-royal transition-all group-hover:bg-gradient-da group-hover:text-white">
              <ArrowRight size={16} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
