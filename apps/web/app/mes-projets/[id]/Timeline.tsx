"use client";

import { motion } from "framer-motion";
import { Check, Download, FileText } from "lucide-react";
import { formatDate, cn } from "@da/ui";
import type { StageItem } from "@/lib/portal-queries";
import { ValidateDeliverable } from "./ValidateDeliverable";

const stageStatusLabel: Record<StageItem["status"], string> = {
  PENDING: "À venir",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminée",
};

function fileName(url: string): string {
  try {
    const clean = url.split("?")[0] ?? url;
    const parts = clean.split("/");
    return decodeURIComponent(parts[parts.length - 1] || "Livrable");
  } catch {
    return "Livrable";
  }
}

/** Timeline verticale des étapes du projet, avec livrables et validation client. */
export function Timeline({
  projectId,
  stages,
}: {
  projectId: string;
  stages: StageItem[];
}) {
  if (stages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-navy/15 bg-surface-secondary/50 p-8 text-center text-sm text-text-muted">
        Les étapes de ce projet seront bientôt planifiées par l'équipe.
      </div>
    );
  }

  return (
    <ol className="relative">
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1;
        const done = stage.status === "COMPLETED";
        const active = stage.status === "IN_PROGRESS";
        const canValidate = done || active;

        return (
          <motion.li
            key={stage.id}
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="relative flex gap-4 pb-8 last:pb-0"
          >
            {/* Trait vertical */}
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-1rem)] w-0.5",
                  done ? "bg-gradient-to-b from-brand-blue-royal to-brand-cyan" : "bg-navy/10",
                )}
              />
            )}

            {/* Pastille */}
            <div className="relative z-10 shrink-0">
              {done ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-da text-white shadow-brand">
                  <Check size={17} strokeWidth={3} />
                </span>
              ) : active ? (
                <span className="relative flex h-8 w-8 items-center justify-center">
                  <motion.span
                    className="absolute inset-0 rounded-full bg-brand-blue-vif/30"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span className="relative h-8 w-8 rounded-full border-[3px] border-brand-blue-vif bg-surface-primary" />
                  <span className="absolute h-2.5 w-2.5 rounded-full bg-gradient-da" />
                </span>
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-navy/15 bg-surface-primary">
                  <span className="h-2 w-2 rounded-full bg-navy/20" />
                </span>
              )}
            </div>

            {/* Contenu */}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3
                  className={cn(
                    "font-display text-base font-bold",
                    active ? "text-brand-blue-royal" : "text-navy",
                  )}
                >
                  {stage.name}
                </h3>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-none",
                    done && "bg-success/10 text-success",
                    active && "bg-brand-blue-vif/10 text-brand-blue-royal",
                    stage.status === "PENDING" && "bg-navy/[0.06] text-text-muted",
                  )}
                >
                  {stageStatusLabel[stage.status]}
                </span>
              </div>

              {stage.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                  {stage.description}
                </p>
              )}

              {done && stage.completedAt && (
                <p className="mt-1.5 text-xs font-medium text-text-muted">
                  Terminée le {formatDate(stage.completedAt)}
                </p>
              )}

              {/* Livrables téléchargeables */}
              {stage.deliverables.length > 0 && (
                <div className="mt-3 space-y-2">
                  {stage.deliverables.map((url, k) => (
                    <a
                      key={k}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-lg border border-navy/[0.08] bg-surface-primary px-3 py-2.5 text-sm transition-all hover:border-brand-blue-vif/40 hover:shadow-sm"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-blue-vif/10 text-brand-blue-royal">
                        <FileText size={16} />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium text-navy">
                        {fileName(url)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-royal opacity-70 transition-opacity group-hover:opacity-100">
                        <Download size={14} />
                        Télécharger
                      </span>
                    </a>
                  ))}
                </div>
              )}

              {/* Validation client (étape en cours ou terminée) */}
              {canValidate && (
                <ValidateDeliverable projectId={projectId} stageName={stage.name} />
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
