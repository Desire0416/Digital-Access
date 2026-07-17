import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, MessageSquare, ArrowRight, CircleDot } from "lucide-react";
import { requireUser } from "@/lib/guards";
import { getMyTickets } from "@/lib/support";
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE, TICKET_CATEGORY_LABEL } from "@/lib/support-labels";
import { EspaceHeader } from "@/components/espace/parts";
import { EmptyState } from "@/components/EmptyState";
import { TicketComposer } from "@/components/support/TicketComposer";
import type { TicketStatus } from "@da/academy-db/client";

export const metadata: Metadata = { title: "Support" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" });

const TONE_CLASS: Record<string, string> = {
  info: "bg-brand-blue-vif/10 text-brand-blue-royal",
  violet: "bg-brand-violet/10 text-brand-violet",
  warning: "bg-warning/[0.14] text-[#B45309]",
  success: "bg-success/10 text-success",
  neutral: "bg-navy/[0.05] text-text-secondary",
};

function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TONE_CLASS[TICKET_STATUS_TONE[status]] ?? TONE_CLASS.neutral}`}>
      {TICKET_STATUS_LABEL[status]}
    </span>
  );
}

export default async function SupportPage() {
  const user = await requireUser("/espace/support");
  const tickets = await getMyTickets(user.id);

  return (
    <div className="space-y-6">
      <EspaceHeader
        title="Support"
        subtitle="Une question, un problème ? Ouvrez une demande — notre équipe vous répond sous 24 h ouvrées."
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-text-secondary">
          Besoin d'une réponse rapide ? Consultez d'abord le{" "}
          <Link href="/aide" className="font-semibold text-brand-blue-royal hover:underline">
            centre d'aide
          </Link>
          .
        </p>
        <TicketComposer />
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          title="Aucune demande pour l'instant"
          description="Ouvrez une demande de support et suivez son avancement ici, du premier message jusqu'à la résolution."
          action={{ label: "Consulter le centre d'aide", href: "/aide" }}
        />
      ) : (
        <ul className="space-y-3">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link
                href={`/espace/support/${t.id}`}
                className="group flex items-center gap-4 rounded-xl border border-navy/[0.07] bg-surface-primary p-4 transition-all hover:border-brand-blue-vif/40 hover:shadow-[0_14px_30px_-18px_rgba(43,58,140,0.4)]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-violet/12 to-brand-cyan/12 text-brand-blue-royal" aria-hidden>
                  <LifeBuoy size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-muted">#{t.number}</span>
                    <StatusBadge status={t.status} />
                    {t.hasUnreadStaffReply && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-blue-royal">
                        <CircleDot size={11} aria-hidden />
                        Réponse du support
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate font-display text-sm font-bold text-navy">{t.subject}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                    <span>{TICKET_CATEGORY_LABEL[t.category]}</span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare size={12} aria-hidden />
                      {t.messageCount}
                    </span>
                    <span aria-hidden>·</span>
                    <span>Mis à jour le {dateFmt.format(t.updatedAt)}</span>
                  </p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-blue-royal" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
