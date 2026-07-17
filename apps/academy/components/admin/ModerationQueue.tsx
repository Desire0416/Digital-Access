"use client";

import * as React from "react";
import {
  MessageSquare,
  CornerDownRight,
  MessageCircle,
  ExternalLink,
  Flag,
  User2,
  Clock,
  ShieldX,
  Loader2,
} from "lucide-react";
import type { ReportTarget, ReportStatus } from "@da/academy-db/client";
import type { ReportItem } from "@/lib/moderation-queries";
import { resolveReport } from "@/lib/moderation-actions";
import { AdminCard, StatusPill, type PillTone } from "@/components/admin/ui";
import { useAdminAction, Feedback, DeleteButton } from "@/components/admin/action-hooks";

/* ══════════════════════════════════════════════════════════════════════════
   File de modération — actions client (cahier §25.3). Reçoit tous les
   signalements et rend un rang par cible. Pour un signalement PENDING : rejet
   (classe sans suite) ou suppression de la cible (confirmation). Les
   signalements déjà traités (ACTIONED / DISMISSED) sont en lecture seule avec
   leur pastille de statut. Aucune suppression n'est irréversible sans double
   clic (DeleteButton). Après succès, router.refresh() recharge la liste.
   ══════════════════════════════════════════════════════════════════════════ */

const TARGET_META: Record<
  ReportTarget,
  { label: string; icon: React.ComponentType<{ size?: number | string; className?: string }> }
> = {
  DISCUSSION: { label: "Discussion", icon: MessageSquare },
  REPLY: { label: "Réponse", icon: CornerDownRight },
  LESSON_COMMENT: { label: "Commentaire", icon: MessageCircle },
};

const STATUS_META: Record<ReportStatus, { label: string; tone: PillTone }> = {
  PENDING: { label: "En attente", tone: "warning" },
  ACTIONED: { label: "Contenu retiré", tone: "success" },
  DISMISSED: { label: "Classé sans suite", tone: "neutral" },
};

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function ModerationQueue({ reports }: { reports: ReportItem[] }) {
  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <ReportRow key={report.id} report={report} />
      ))}
    </div>
  );
}

function ReportRow({ report }: { report: ReportItem }) {
  const { pending, msg, run } = useAdminAction();
  const target = TARGET_META[report.targetType];
  const TargetIcon = target.icon;
  const isPending = report.status === "PENDING";
  const statusMeta = STATUS_META[report.status];

  return (
    <AdminCard className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* ─── Détail du signalement ────────────────────────────────────── */}
        <div className="min-w-0 flex-1">
          {/* Type de cible + motif */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-violet/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-violet">
              <TargetIcon size={12} />
              {target.label}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-navy">
              <Flag size={13} className="shrink-0 text-error" />
              <span className="truncate">{report.reason}</span>
            </span>
          </div>

          {/* Extrait de la cible */}
          <div className="mt-2.5">
            {report.target.exists ? (
              <blockquote className="border-l-2 border-brand-blue-vif/40 bg-surface-secondary px-3.5 py-2.5 text-sm leading-relaxed text-text-secondary">
                {report.target.excerpt || "(contenu sans texte)"}
              </blockquote>
            ) : (
              <p className="inline-flex items-center gap-1.5 rounded-lg bg-navy/[0.04] px-3 py-2 text-xs font-medium italic text-text-muted">
                <ShieldX size={13} />
                Contenu déjà supprimé
              </p>
            )}
          </div>

          {/* Auteur de la cible · signalé par · date · lien */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-text-muted">
            {report.target.exists && report.target.authorName && (
              <span className="inline-flex items-center gap-1">
                <User2 size={11} />
                Auteur : {report.target.authorName}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Flag size={11} />
              Signalé par {report.reporter?.name ?? "un compte supprimé"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={11} />
              {dateFmt.format(report.createdAt)}
            </span>
            {report.target.exists && report.target.href && (
              <a
                href={report.target.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-brand-blue-royal hover:underline"
              >
                <ExternalLink size={11} />
                Voir le contenu
              </a>
            )}
          </div>
        </div>

        {/* ─── Actions / statut ─────────────────────────────────────────── */}
        <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
          {isPending ? (
            <>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => run(() => resolveReport(report.id, "dismiss"))}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-navy/12 px-3 py-1.5 text-xs font-semibold text-text-secondary transition-colors hover:border-navy/25 hover:text-navy disabled:opacity-60"
                >
                  {pending && <Loader2 size={13} className="animate-spin" />}
                  Rejeter le signalement
                </button>
                <DeleteButton
                  label="Supprimer le contenu"
                  onConfirm={() => run(() => resolveReport(report.id, "remove"))}
                  pending={pending}
                />
              </div>
              <Feedback msg={msg} className="sm:text-right" />
            </>
          ) : (
            <StatusPill label={statusMeta.label} tone={statusMeta.tone} />
          )}
        </div>
      </div>
    </AdminCard>
  );
}
