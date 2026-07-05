import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  User2,
  Mail,
  FolderKanban,
  CalendarDays,
  AlertTriangle,
} from "lucide-react";
import { formatDate } from "@da/ui";
import {
  StatusPill,
  TICKET_PRIORITY,
  TICKET_STATUS,
} from "@/components/admin/ui";
import { getAdminTicket } from "@/lib/admin-queries";
import { TicketThread } from "./TicketThread";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getAdminTicket(id);
  return { title: ticket ? ticket.title : "Ticket introuvable" };
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await getAdminTicket(id);
  if (!ticket) notFound();

  const status = TICKET_STATUS[ticket.status]!;
  const priority = TICKET_PRIORITY[ticket.priority]!;
  const urgent = ticket.priority === "URGENT";

  return (
    <div>
      {/* Fil d'Ariane */}
      <Link
        href="/admin/tickets"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au support
      </Link>

      {/* En-tête du ticket */}
      <header className="relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-7">
        {/* Filet dégradé signature (rouge pour un ticket urgent) */}
        <div
          className={`absolute inset-x-0 top-0 h-1 ${
            urgent ? "bg-error" : "bg-gradient-da"
          }`}
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <StatusPill label={status.label} tone={status.tone} />
          <StatusPill
            label={`Priorité ${priority.label.toLowerCase()}`}
            tone={priority.tone}
          />
          {urgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2.5 py-1 text-[11px] font-semibold text-error">
              <AlertTriangle className="h-3 w-3" />
              À traiter en priorité
            </span>
          )}
        </div>

        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          {ticket.title}
        </h1>

        {ticket.description && (
          <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
            {ticket.description}
          </p>
        )}

        {/* Méta-infos */}
        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-navy/[0.06] pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            icon={<User2 className="h-4 w-4" />}
            label="Client"
            value={ticket.client.name}
          />
          <InfoItem
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={
              <a
                href={`mailto:${ticket.client.email}`}
                className="truncate text-brand-blue-royal hover:underline"
              >
                {ticket.client.email}
              </a>
            }
          />
          <InfoItem
            icon={<FolderKanban className="h-4 w-4" />}
            label="Projet lié"
            value={ticket.projectTitle ?? "Aucun"}
          />
          <InfoItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Ouvert le"
            value={formatDate(ticket.createdAt)}
          />
        </dl>
      </header>

      {/* Fil de discussion + actions interactives */}
      <TicketThread ticket={ticket} />
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
