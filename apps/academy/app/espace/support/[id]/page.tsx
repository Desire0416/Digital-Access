import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/guards";
import { getMyTicket } from "@/lib/support";
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE, TICKET_CATEGORY_LABEL, TICKET_PRIORITY_LABEL } from "@/lib/support-labels";
import { TicketThread } from "@/components/support/TicketThread";
import type { TicketStatus } from "@da/academy-db/client";

export const metadata: Metadata = { title: "Demande de support" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const TONE_CLASS: Record<string, string> = {
  info: "bg-brand-blue-vif/10 text-brand-blue-royal",
  violet: "bg-brand-violet/10 text-brand-violet",
  warning: "bg-warning/[0.14] text-[#B45309]",
  success: "bg-success/10 text-success",
  neutral: "bg-navy/[0.05] text-text-secondary",
};

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser("/espace/support");
  const ticket = await getMyTicket(id, user.id);
  if (!ticket) notFound();

  const status = ticket.status as TicketStatus;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Link
        href="/espace/support"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft size={15} aria-hidden />
        Toutes mes demandes
      </Link>

      <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-text-muted">#{ticket.number}</span>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TONE_CLASS[TICKET_STATUS_TONE[status]] ?? TONE_CLASS.neutral}`}>
            {TICKET_STATUS_LABEL[status]}
          </span>
        </div>
        <h1 className="mt-2 font-display text-xl font-bold leading-tight text-navy sm:text-2xl">{ticket.subject}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
          <span>{TICKET_CATEGORY_LABEL[ticket.category]}</span>
          <span aria-hidden>·</span>
          <span>Priorité : {TICKET_PRIORITY_LABEL[ticket.priority]}</span>
          <span aria-hidden>·</span>
          <span>Ouvert le {dateFmt.format(ticket.createdAt)}</span>
        </p>
      </div>

      <TicketThread ticket={ticket} />
    </div>
  );
}
