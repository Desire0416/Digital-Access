import Link from "next/link";
import { Plus, Receipt, FolderKanban, CalendarClock } from "lucide-react";
import { cn, buttonClasses, formatFCFA, formatDate } from "@da/ui";
import {
  AdminPageHeader,
  EmptyState,
  StatusPill,
  INVOICE_STATUS,
  type Tone,
} from "@/components/admin/ui";
import { getAdminInvoices } from "@/lib/admin-queries";

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
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/factures/${inv.id}/edit`}
                            className="font-display text-sm font-bold text-navy transition-colors group-hover:text-brand-blue-royal"
                          >
                            {inv.number}
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-text-secondary">{inv.clientName}</td>
                        <td className="px-5 py-3.5 text-text-secondary">
                          {inv.projectTitle ? (
                            <span className="inline-flex items-center gap-1.5">
                              <FolderKanban className="h-3.5 w-3.5 text-text-muted" />
                              {inv.projectTitle}
                            </span>
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-navy">
                          {formatFCFA(inv.total)}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusPill label={meta.label} tone={meta.tone as Tone} />
                        </td>
                        <td className="px-5 py-3.5 text-text-secondary">
                          {inv.dueDate ? (
                            formatDate(inv.dueDate)
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
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
                <Link
                  key={inv.id}
                  href={`/admin/factures/${inv.id}/edit`}
                  className={cn(
                    "block rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 transition-shadow",
                    "hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/40",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-sm font-bold text-navy">{inv.number}</p>
                      <p className="mt-0.5 truncate text-xs text-text-secondary">
                        {inv.clientName}
                      </p>
                    </div>
                    <StatusPill label={meta.label} tone={meta.tone as Tone} />
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
                </Link>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
