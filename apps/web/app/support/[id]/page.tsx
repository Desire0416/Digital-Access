import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  FolderKanban,
  CalendarDays,
  Hash,
  FileText,
} from "lucide-react";
import { Container, Section, Badge, cn, formatDate } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getTicketDetail } from "@/lib/portal-queries";
import type { TicketPriority, TicketStatus } from "@/lib/portal-queries";
import { TicketThread } from "./TicketThread";

export const dynamic = "force-dynamic";

const priorityMeta: Record<
  TicketPriority,
  { label: string; className: string; dot: string }
> = {
  URGENT: { label: "Urgente", className: "bg-error/10 text-error", dot: "bg-error" },
  HIGH: { label: "Haute", className: "bg-warning/10 text-[#B45309]", dot: "bg-warning" },
  MEDIUM: { label: "Moyenne", className: "bg-info/10 text-info", dot: "bg-info" },
  LOW: { label: "Basse", className: "bg-navy/[0.06] text-text-secondary", dot: "bg-text-muted" },
};

const statusMeta: Record<
  TicketStatus,
  { label: string; variant: "info" | "success" | "warning" | "default" }
> = {
  OPEN: { label: "Ouvert", variant: "warning" },
  IN_PROGRESS: { label: "En cours", variant: "info" },
  RESOLVED: { label: "Résolu", variant: "success" },
  CLOSED: { label: "Fermé", variant: "default" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return { title: "Ticket", robots: { index: false, follow: false } };
  const ticket = await getTicketDetail(user.id, id);
  return {
    title: ticket ? `Ticket — ${ticket.title}` : "Ticket introuvable",
    robots: { index: false, follow: false },
  };
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect(`/auth/login?callbackUrl=/support/${id}`);

  const ticket = await getTicketDetail(user.id, id);
  if (!ticket) notFound();

  const pm = priorityMeta[ticket.priority];
  const sm = statusMeta[ticket.status];
  const clientName = user.name ?? user.email ?? "Vous";

  return (
    <Section spacing="md" className="min-h-[80vh] pt-28">
      <Container className="max-w-4xl">
        {/* Fil d'ariane */}
        <Link
          href="/support"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal"
        >
          <ArrowLeft size={16} />
          Support
        </Link>

        {/* En-tête ticket */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary">
          <div className="relative border-b border-navy/[0.06] bg-grid p-7 sm:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-da" />
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
                  pm.className,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", pm.dot)} />
                Priorité {pm.label.toLowerCase()}
              </span>
              <Badge variant={sm.variant}>{sm.label}</Badge>
            </div>

            <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
              {ticket.title}
            </h1>

            {/* Méta */}
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-text-secondary">
              <span className="inline-flex items-center gap-1.5">
                <Hash size={14} className="text-brand-blue-vif" />
                <span className="font-mono text-xs">{ticket.id.slice(-8).toUpperCase()}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={14} className="text-brand-blue-vif" />
                Ouvert le{" "}
                <span className="font-semibold text-navy">
                  {formatDate(ticket.createdAt)}
                </span>
              </span>
              {ticket.projectTitle && (
                <span className="inline-flex items-center gap-1.5">
                  <FolderKanban size={14} className="text-brand-blue-vif" />
                  {ticket.projectTitle}
                </span>
              )}
            </div>
          </div>

          {/* Description initiale */}
          <div className="p-7 sm:p-8">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
              <FileText size={15} className="text-brand-blue-royal" />
              Votre demande
            </h2>
            <p className="mt-2.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary">
              {ticket.description}
            </p>
          </div>
        </div>

        {/* Fil de discussion */}
        <div className="mt-8">
          <TicketThread
            ticketId={ticket.id}
            status={ticket.status}
            clientName={clientName}
            description={ticket.description}
            createdAt={ticket.createdAt}
            messages={ticket.messages}
          />
        </div>

        {/* Retour bas de page */}
        <div className="mt-8">
          <Link
            href="/support"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
          >
            <ArrowLeft size={15} />
            Retour au support
          </Link>
        </div>
      </Container>
    </Section>
  );
}
