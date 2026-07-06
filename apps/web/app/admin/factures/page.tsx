import Link from "next/link";
import { Plus, Receipt, FolderKanban, CalendarClock } from "lucide-react";
import { buttonClasses, formatFCFA, formatDate } from "@da/ui";
import {
  AdminPageHeader,
  EmptyState,
  StatusPill,
  INVOICE_STATUS,
  type Tone,
} from "@/components/admin/ui";
import { getAdminInvoices, type InvoiceStatus } from "@/lib/admin-queries";
import { InvoiceRowActions } from "./InvoiceRowActions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Factures" };

export default async function InvoicesPage() {
  const invoices = await getAdminInvoices();

  return (
    <>
      <AdminPageHeader
        title="Factures"
        description="Émettez et suivez les factures clients — brouillon, envoi, encaissement."
      >
        <Link
          href="/admin/factures/nouvelle"
          className={buttonClasses({ variant: "primary", size: "md" })}
        >
          <Plus className="h-4 w-4" />
          Nouvelle facture
        </Link>
      </AdminPageHeader>

      {invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-6 w-6" />}
          title="Aucune facture pour l’instant"
          description="Créez votre première facture pour un client. Les brouillons, envois et encaissements apparaîtront ici."
        >
          <Link
            href="/admin/factures/nouvelle"
            className={buttonClasses({ variant: "primary", size: "md" })}
          >
            <Plus className="h-4 w-4" />
            Créer une facture
          </Link>
        </EmptyState>
      ) : (
        <>
          {/* ─────────────── Desktop : tableau ─────────────── */}
          <div className="hidden overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-navy/[0.07] bg-surface-secondary/50 text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                    <th className="px-5 py-3">Numéro</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Projet</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3">Échéance</th>
                    <th className="px-5 py-3 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const meta = INVOICE_STATUS[inv.status]!;
                    return (
                      <tr
                        key={inv.id}
                        className="group border-b border-navy/[0.05] transition-colors last:border-0 hover:bg-brand-cyan/[0.03]"
                      >
                        <td className="p-0">
                          <Link
                            href={`/admin/factures/${inv.id}`}
                            className="block px-5 py-3.5 font-display text-sm font-bold text-navy transition-colors group-hover:text-brand-blue-royal"
                            title={`Voir la facture ${inv.number}`}
                          >
                            {inv.number}
                          </Link>
                        </td>
                        <td className="p-0 text-text-secondary">
                          <Link
                            href={`/admin/factures/${inv.id}`}
                            className="block px-5 py-3.5"
                            tabIndex={-1}
                          >
                            {inv.clientName}
                          </Link>
                        </td>
                        <td className="p-0 text-text-secondary">
                          <Link
                            href={`/admin/factures/${inv.id}`}
                            className="block px-5 py-3.5"
                            tabIndex={-1}
                          >
                            {inv.projectTitle ? (
                              <span className="inline-flex items-center gap-1.5">
                                <FolderKanban className="h-3.5 w-3.5 text-text-muted" />
                                {inv.projectTitle}
                              </span>
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </Link>
                        </td>
                        <td className="p-0 text-right font-semibold tabular-nums text-navy">
                          <Link
                            href={`/admin/factures/${inv.id}`}
                            className="block px-5 py-3.5"
                            tabIndex={-1}
                          >
                            {formatFCFA(inv.total)}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusPill label={meta.label} tone={meta.tone as Tone} />
                        </td>
                        <td className="p-0 text-text-secondary">
                          <Link
                            href={`/admin/factures/${inv.id}`}
                            className="block px-5 py-3.5"
                            tabIndex={-1}
                          >
                            {inv.dueDate ? (
                              formatDate(inv.dueDate)
                            ) : (
                              <span className="text-text-muted">—</span>
                            )}
                          </Link>
                        </td>
                        <td className="relative px-5 py-3.5 text-right">
                          <div className="flex justify-end">
                            <InvoiceRowActions
                              id={inv.id}
                              number={inv.number}
                              status={inv.status as InvoiceStatus}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─────────────── Mobile : cartes empilées ─────────────── */}
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {invoices.map((inv) => {
              const meta = INVOICE_STATUS[inv.status]!;
              return (
                <div
                  key={inv.id}
                  className="group relative rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-shadow focus-within:ring-2 focus-within:ring-brand-blue-vif/40 hover:shadow-lg"
                >
                  {/* Lien pleine carte (couvre le fond, sous les actions) */}
                  <Link
                    href={`/admin/factures/${inv.id}`}
                    aria-label={`Voir la facture ${inv.number}`}
                    className="absolute inset-0 z-0 rounded-2xl focus:outline-none"
                  />

                  <div className="pointer-events-none relative z-10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-sm font-bold text-navy">{inv.number}</p>
                        <p className="mt-0.5 truncate text-xs text-text-secondary">
                          {inv.clientName}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <StatusPill label={meta.label} tone={meta.tone as Tone} />
                        {/* Réactive les interactions pour le menu */}
                        <span className="pointer-events-auto">
                          <InvoiceRowActions
                            id={inv.id}
                            number={inv.number}
                            status={inv.status as InvoiceStatus}
                          />
                        </span>
                      </div>
                    </div>

                    {inv.projectTitle && (
                      <p className="mt-2.5 flex items-center gap-1.5 truncate text-xs text-text-secondary">
                        <FolderKanban className="h-3.5 w-3.5 shrink-0 text-text-muted" />
                        <span className="truncate">{inv.projectTitle}</span>
                      </p>
                    )}

                    <div className="mt-3 flex items-end justify-between gap-3 border-t border-navy/[0.06] pt-3">
                      <span className="font-display text-lg font-extrabold tabular-nums text-brand-blue-royal">
                        {formatFCFA(inv.total)}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-text-muted">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {inv.dueDate ? formatDate(inv.dueDate) : "Sans échéance"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
