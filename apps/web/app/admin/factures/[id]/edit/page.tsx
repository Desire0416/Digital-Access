import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  UserRound,
  FolderKanban,
  CalendarDays,
  CheckCircle2,
  Printer,
} from "lucide-react";
import { buttonClasses, formatFCFA, formatDate } from "@da/ui";
import {
  AdminPageHeader,
  StatusPill,
  INVOICE_STATUS,
  type Tone,
} from "@/components/admin/ui";
import { getAdminInvoice, getClients } from "@/lib/admin-queries";
import { InvoiceForm } from "../../InvoiceForm";
import { InvoiceControls } from "./InvoiceControls";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getAdminInvoice(id);
  return { title: invoice ? `Facture ${invoice.number}` : "Facture introuvable" };
}

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, clients] = await Promise.all([getAdminInvoice(id), getClients()]);
  if (!invoice) notFound();

  const meta = INVOICE_STATUS[invoice.status]!;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/factures"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux factures
        </Link>
        <Link
          href={`/admin/factures/${invoice.id}`}
          className={buttonClasses({ variant: "outline", size: "sm" })}
        >
          <Printer className="h-4 w-4" />
          Voir / Imprimer PDF
        </Link>
      </div>

      {/* En-tête facture */}
      <header className="relative overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-7">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-da" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusPill label={meta.label} tone={meta.tone as Tone} />
              {invoice.status === "PAID" && invoice.paidAt && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
                  <CheckCircle2 className="h-3 w-3" />
                  Payée le {formatDate(invoice.paidAt)}
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
              {invoice.number}
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Émise le {formatDate(invoice.createdAt)}
            </p>
          </div>

          <div className="shrink-0 rounded-xl border border-navy/[0.07] bg-surface-secondary/60 px-5 py-4 text-center sm:min-w-[160px]">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Total TTC
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold tabular-nums text-brand-blue-royal sm:text-3xl">
              {formatFCFA(invoice.total)}
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-navy/[0.06] pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            icon={<UserRound className="h-4 w-4" />}
            label="Client"
            value={invoice.client.name}
          />
          <InfoItem
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={
              <a
                href={`mailto:${invoice.client.email}`}
                className="truncate text-brand-blue-royal hover:underline"
              >
                {invoice.client.email}
              </a>
            }
          />
          <InfoItem
            icon={<FolderKanban className="h-4 w-4" />}
            label="Projet"
            value={
              invoice.project ? (
                <Link
                  href={`/admin/projets/${invoice.project.id}`}
                  className="truncate text-brand-blue-royal hover:underline"
                >
                  {invoice.project.title}
                </Link>
              ) : (
                "Aucun"
              )
            }
          />
          <InfoItem
            icon={<CalendarDays className="h-4 w-4" />}
            label="Échéance"
            value={invoice.dueDate ? formatDate(invoice.dueDate) : "Non définie"}
          />
        </dl>
      </header>

      {/* Contrôles de statut + suppression */}
      <div className="mt-6">
        <InvoiceControls
          id={invoice.id}
          number={invoice.number}
          status={invoice.status}
        />
      </div>

      {/* Édition des lignes */}
      <div className="mt-6">
        <InvoiceForm mode="edit" invoice={invoice} clients={clients} />
      </div>
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
