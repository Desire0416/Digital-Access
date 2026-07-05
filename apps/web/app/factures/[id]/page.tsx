import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container, Monogram, Badge, formatFCFA, formatDate } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getInvoiceDetail, type InvoiceStatus } from "@/lib/portal-queries";
import { siteConfig } from "@/lib/site";
import { InvoiceActions } from "./InvoiceActions";

export const dynamic = "force-dynamic";

const invoiceStatus: Record<
  InvoiceStatus,
  { label: string; variant: "warning" | "success" | "default" }
> = {
  SENT: { label: "À payer", variant: "warning" },
  OVERDUE: { label: "En retard", variant: "warning" },
  PAID: { label: "Payée", variant: "success" },
  DRAFT: { label: "Brouillon", variant: "default" },
  CANCELLED: { label: "Annulée", variant: "default" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const user = await currentUser();
  if (!user) return { title: "Facture", robots: { index: false, follow: false } };
  const { id } = await params;
  const invoice = await getInvoiceDetail(user.id, id);
  return {
    title: invoice ? `Facture ${invoice.number}` : "Facture introuvable",
    robots: { index: false, follow: false },
  };
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) redirect(`/auth/login?callbackUrl=/factures/${id}`);

  const invoice = await getInvoiceDetail(user.id, id);
  if (!invoice) notFound();

  const st = invoiceStatus[invoice.status];
  const payable = invoice.status === "SENT" || invoice.status === "OVERDUE";

  return (
    <>
      {/* Styles d'impression co-localisés : fond blanc net, on masque le superflu. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              html, body { background: #ffffff !important; }
              header, footer, nav { display: none !important; }
              .invoice-shell { padding: 0 !important; }
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

      <div className="invoice-shell bg-surface-secondary pb-20 pt-28 sm:pt-32">
        <Container>
          {/* Navette + actions (masqués à l'impression) */}
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 print:hidden">
            <Link
              href="/factures"
              className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal"
            >
              <ArrowLeft size={16} />
              Mes factures
            </Link>
            <InvoiceActions invoiceNumber={invoice.number} payable={payable} />
          </div>

          {/* Document A4 imprimable */}
          <article className="invoice-doc mx-auto mt-6 max-w-3xl overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-xl print:mt-0">
            {/* En-tête */}
            <header className="relative overflow-hidden border-b border-navy/[0.08] px-8 py-8 sm:px-12 sm:py-10">
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1.5 bg-gradient-da"
              />
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex items-center gap-3">
                  <Monogram size={44} />
                  <div>
                    <p className="font-display text-lg font-extrabold leading-none text-navy">
                      Digital Access
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      {siteConfig.tagline}
                    </p>
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
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                </div>
              </div>
            </header>

            {/* Parties + méta */}
            <div className="grid gap-8 border-b border-navy/[0.08] px-8 py-8 sm:grid-cols-2 sm:px-12">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">
                  Émetteur
                </p>
                <p className="mt-2 font-display text-sm font-bold text-navy">
                  Digital Access
                </p>
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
                <p className="mt-2 font-display text-sm font-bold text-navy">
                  {invoice.client.name}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                  {invoice.client.email}
                  {invoice.client.phone && (
                    <>
                      <br />
                      {invoice.client.phone}
                    </>
                  )}
                  {invoice.client.location && (
                    <>
                      <br />
                      {invoice.client.location}
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Bandeau méta */}
            <div className="flex flex-wrap gap-x-10 gap-y-4 border-b border-navy/[0.08] bg-surface-secondary/50 px-8 py-5 text-sm sm:px-12">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  Date d'émission
                </p>
                <p className="mt-1 font-semibold text-navy">
                  {formatDate(invoice.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                  Échéance
                </p>
                <p className="mt-1 font-semibold text-navy">
                  {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                </p>
              </div>
              {invoice.projectTitle && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">
                    Projet
                  </p>
                  <p className="mt-1 font-semibold text-navy">
                    {invoice.projectTitle}
                  </p>
                </div>
              )}
            </div>

            {/* Lignes de facturation */}
            <div className="px-8 py-8 sm:px-12">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-navy/10 text-[11px] uppercase tracking-[0.12em] text-text-muted">
                      <th className="pb-3 pr-4 font-bold">Désignation</th>
                      <th className="pb-3 px-4 text-center font-bold">Qté</th>
                      <th className="pb-3 px-4 text-right font-bold">
                        Prix unitaire
                      </th>
                      <th className="pb-3 pl-4 text-right font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.length > 0 ? (
                      invoice.items.map((item, i) => (
                        <tr
                          key={i}
                          className="border-b border-navy/[0.06] align-top"
                        >
                          <td className="py-3.5 pr-4 font-medium text-navy">
                            {item.label}
                          </td>
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
                        <td
                          className="py-4 text-text-muted"
                          colSpan={4}
                        >
                          Aucune ligne détaillée.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totaux */}
              <div className="mt-8 flex justify-end">
                <div className="w-full max-w-xs">
                  <div className="flex items-center justify-between py-2 text-sm">
                    <span className="text-text-secondary">Sous-total</span>
                    <span className="font-semibold text-navy">
                      {formatFCFA(invoice.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-navy/[0.08] py-2 text-sm">
                    <span className="text-text-secondary">TVA</span>
                    <span className="font-semibold text-navy">
                      {formatFCFA(invoice.tax)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-da px-5 py-4 text-white shadow-brand">
                    <span className="font-display text-sm font-bold uppercase tracking-wide">
                      Total
                    </span>
                    <span className="font-display text-xl font-extrabold">
                      {formatFCFA(invoice.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mentions de paiement */}
              <div className="mt-8 space-y-1.5 text-sm">
                {invoice.status === "PAID" && invoice.paidAt ? (
                  <p className="inline-flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 font-semibold text-success">
                    Facture réglée le {formatDate(invoice.paidAt)}. Merci !
                  </p>
                ) : invoice.dueDate ? (
                  <p className="text-text-secondary">
                    Montant à régler avant le{" "}
                    <span className="font-semibold text-navy">
                      {formatDate(invoice.dueDate)}
                    </span>
                    {" "}par Mobile Money (Orange, MTN, Wave) ou virement.
                  </p>
                ) : null}
              </div>
            </div>

            {/* Pied de page */}
            <footer className="border-t border-navy/[0.08] bg-surface-secondary/50 px-8 py-6 text-center text-xs text-text-secondary sm:px-12">
              <p className="font-semibold text-navy">
                Merci de votre confiance.
              </p>
              <p className="mt-1">
                Digital Access — {siteConfig.contact.address} ·{" "}
                {siteConfig.contact.email} · {siteConfig.contact.phone}
              </p>
              <p className="mt-1 text-text-muted">{siteConfig.url}</p>
            </footer>
          </article>
        </Container>
      </div>
    </>
  );
}
