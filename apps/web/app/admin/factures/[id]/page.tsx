import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { Monogram, buttonClasses, formatFCFA, formatDate } from "@da/ui";
import { StatusPill, INVOICE_STATUS, type Tone } from "@/components/admin/ui";
import { getAdminInvoice } from "@/lib/admin-queries";
import { siteConfig } from "@/lib/site";
import { PrintButton } from "./PrintButton";

/* ══════════════════════════════════════════════════════════════════════════
   Vue détail imprimable d'une facture (admin). Document propre façon A4, prêt
   à l'impression / export PDF (window.print). Le chrome admin (nav, sidebar,
   barre d'actions) est masqué à l'impression.
   ══════════════════════════════════════════════════════════════════════════ */

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

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getAdminInvoice(id);
  if (!invoice) notFound();

  const meta = INVOICE_STATUS[invoice.status]!;

  return (
    <>
      {/* Styles d'impression co-localisés : fond blanc net, on masque le chrome. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              html, body { background: #ffffff !important; }
              header, footer, nav, aside, .admin-shell-chrome { display: none !important; }
              .invoice-doc {
                box-shadow: none !important;
                border: none !important;
                border-radius: 0 !important;
                max-width: none !important;
                margin: 0 !important;
              }
              @page { margin: 14mm; }
            }
          `,
        }}
      />

      {/* Barre d'actions (masquée à l'impression) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/admin/factures"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux factures
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/factures/${invoice.id}/edit`}
            className={buttonClasses({ variant: "outline", size: "md" })}
          >
            <Pencil className="h-4 w-4" />
            Éditer
          </Link>
          <PrintButton />
        </div>
      </div>

      {/* Document A4 imprimable */}
      <article className="invoice-doc mx-auto max-w-3xl overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-xl">
        {/* En-tête */}
        <header className="relative overflow-hidden border-b border-navy/[0.08] px-8 py-8 sm:px-12 sm:py-10">
          <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-da" />
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              <Monogram size={44} />
              <div>
                <p className="font-display text-lg font-extrabold leading-none text-navy">
                  Digital Access
                </p>
                <p className="mt-1 text-xs text-text-secondary">{siteConfig.tagline}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-extrabold uppercase tracking-tight text-navy">
                Facture
              </p>
              <p className="mt-1 font-mono text-sm font-semibold text-brand-blue-royal">
                {invoice.number}
              </p>
              <div className="mt-2 flex justify-end">
                <StatusPill label={meta.label} tone={meta.tone as Tone} />
              </div>
            </div>
          </div>
        </header>

        {/* Parties */}
        <div className="grid gap-8 border-b border-navy/[0.08] px-8 py-8 sm:grid-cols-2 sm:px-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
              Émetteur
            </p>
            <p className="mt-2 font-display text-sm font-bold text-navy">Digital Access</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              {siteConfig.contact.address}
              <br />
              {siteConfig.contact.email}
              <br />
              {siteConfig.contact.phone}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
              Facturé à
            </p>
            <p className="mt-2 font-display text-sm font-bold text-navy">{invoice.client.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              {invoice.client.email}
            </p>
          </div>
        </div>

        {/* Bandeau méta */}
        <div className="flex flex-wrap gap-x-10 gap-y-4 border-b border-navy/[0.08] bg-surface-secondary/50 px-8 py-5 text-sm sm:px-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
              Date d'émission
            </p>
            <p className="mt-1 font-semibold text-navy">{formatDate(invoice.createdAt)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
              Échéance
            </p>
            <p className="mt-1 font-semibold text-navy">
              {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
            </p>
          </div>
          {invoice.project && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                Projet
              </p>
              <p className="mt-1 font-semibold text-navy">{invoice.project.title}</p>
            </div>
          )}
        </div>

        {/* Lignes */}
        <div className="px-8 py-8 sm:px-12">
          {/* Tableau — tablette, desktop et impression */}
          <table className="hidden w-full text-left text-sm sm:table print:table">
            <thead>
              <tr className="border-b-2 border-navy/10 text-[11px] uppercase tracking-[0.12em] text-text-muted">
                <th className="pb-3 pr-4 font-bold">Désignation</th>
                <th className="pb-3 px-4 text-center font-bold">Qté</th>
                <th className="pb-3 px-4 text-right font-bold">Prix unitaire</th>
                <th className="pb-3 pl-4 text-right font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.length > 0 ? (
                invoice.items.map((item, i) => (
                  <tr key={i} className="border-b border-navy/[0.06] align-top">
                    <td className="py-3.5 pr-4 font-medium text-navy">{item.label}</td>
                    <td className="py-3.5 px-4 text-center text-text-secondary">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right text-text-secondary">
                      {formatFCFA(item.unitPrice)}
                    </td>
                    <td className="py-3.5 pl-4 text-right font-semibold text-navy">
                      {formatFCFA(item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-navy/[0.06]">
                  <td className="py-4 text-text-muted" colSpan={4}>
                    Aucune ligne détaillée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Cartes empilées — mobile (pas de défilement horizontal) */}
          <ul className="grid grid-cols-1 gap-3 sm:hidden print:hidden">
            {invoice.items.length > 0 ? (
              invoice.items.map((item, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-navy/[0.08] bg-surface-secondary/40 p-4"
                >
                  <p className="font-medium text-navy">{item.label}</p>
                  <div className="mt-2.5 flex items-center justify-between border-t border-navy/[0.06] pt-2.5 text-sm">
                    <span className="text-text-secondary">
                      {item.quantity} × {formatFCFA(item.unitPrice)}
                    </span>
                    <span className="font-display font-bold text-navy">
                      {formatFCFA(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-xl border border-dashed border-navy/15 p-4 text-sm text-text-muted">
                Aucune ligne détaillée.
              </li>
            )}
          </ul>

          {/* Totaux */}
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-text-secondary">Sous-total</span>
                <span className="font-semibold tabular-nums text-navy">
                  {formatFCFA(invoice.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-navy/[0.08] py-2 text-sm">
                <span className="text-text-secondary">TVA</span>
                <span className="font-semibold tabular-nums text-navy">
                  {formatFCFA(invoice.tax)}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-da px-5 py-4 text-white shadow-brand">
                <span className="font-display text-sm font-bold uppercase tracking-wide">
                  Total
                </span>
                <span className="font-display text-xl font-extrabold tabular-nums">
                  {formatFCFA(invoice.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Mentions de paiement */}
          <div className="mt-8 space-y-1.5 text-sm">
            {invoice.status === "PAID" && invoice.paidAt ? (
              <p className="inline-flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 font-semibold text-success">
                Facture réglée le {formatDate(invoice.paidAt)}.
              </p>
            ) : invoice.dueDate ? (
              <p className="text-text-secondary">
                Montant à régler avant le{" "}
                <span className="font-semibold text-navy">{formatDate(invoice.dueDate)}</span> par
                Mobile Money (Orange, MTN, Wave) ou virement.
              </p>
            ) : null}
          </div>
        </div>

        {/* Pied de page */}
        <footer className="border-t border-navy/[0.08] bg-surface-secondary/50 px-8 py-6 text-center text-xs text-text-secondary sm:px-12">
          <p className="font-semibold text-navy">Merci de votre confiance.</p>
          <p className="mt-1">
            Digital Access — {siteConfig.contact.address} · {siteConfig.contact.email} ·{" "}
            {siteConfig.contact.phone}
          </p>
          <p className="mt-1 text-text-muted">{siteConfig.url}</p>
        </footer>
      </article>
    </>
  );
}
