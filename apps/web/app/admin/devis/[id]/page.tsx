import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Monogram, formatFCFA, formatDate } from "@da/ui";
import { StatusPill } from "@/components/admin/ui";
import { getQuote } from "@/lib/crm-quote-queries";
import { QUOTE_STATUS_LABEL, QUOTE_STATUS_TONE } from "@/lib/crm-types";
import { siteConfig } from "@/lib/site";
import { PrintButton } from "./PrintButton";

/* Document A4 imprimable d'un devis (window.print). Chrome admin masqué à l'impression. */

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuote(id);
  return { title: quote ? `Devis ${quote.number}` : "Devis introuvable" };
}

export default async function QuoteDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  const backHref = quote.dealId ? `/admin/opportunites/${quote.dealId}` : "/admin/opportunites";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              html, body { background: #ffffff !important; }
              header, footer, nav, aside, .admin-shell-chrome { display: none !important; }
              .quote-doc { box-shadow: none !important; border: none !important; border-radius: 0 !important; max-width: none !important; margin: 0 !important; }
              @page { margin: 14mm; }
            }
          `,
        }}
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-navy">
          <ArrowLeft className="h-4 w-4" /> Retour à l'opportunité
        </Link>
        <PrintButton />
      </div>

      <article className="quote-doc mx-auto max-w-3xl overflow-hidden rounded-2xl border border-navy/[0.08] bg-white shadow-xl">
        <header className="relative overflow-hidden border-b border-navy/[0.08] px-8 py-8 sm:px-12 sm:py-10">
          <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-da" />
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              <Monogram size={44} />
              <div>
                <p className="font-display text-lg font-extrabold leading-none text-navy">Digital Access</p>
                <p className="mt-1 text-xs text-text-secondary">{siteConfig.tagline}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-extrabold uppercase tracking-tight text-navy">Devis</p>
              <p className="mt-1 font-mono text-sm font-semibold text-brand-blue-royal">{quote.number}</p>
              <div className="mt-2 flex justify-end">
                <StatusPill label={QUOTE_STATUS_LABEL[quote.status]} tone={QUOTE_STATUS_TONE[quote.status]} />
              </div>
            </div>
          </div>
          <p className="mt-6 font-display text-lg font-bold text-navy">{quote.title}</p>
        </header>

        <div className="grid gap-8 border-b border-navy/[0.08] px-8 py-8 sm:grid-cols-2 sm:px-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">Émetteur</p>
            <p className="mt-2 font-display text-sm font-bold text-navy">Digital Access</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              {siteConfig.contact.address}<br />{siteConfig.contact.email}<br />{siteConfig.contact.phone}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted">Destinataire</p>
            <p className="mt-2 font-display text-sm font-bold text-navy">{quote.organization?.name ?? "—"}</p>
            {quote.contactName && <p className="mt-1 text-sm text-text-secondary">{quote.contactName}</p>}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-4 border-b border-navy/[0.08] bg-surface-secondary/50 px-8 py-5 text-sm sm:px-12">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">Date</p>
            <p className="mt-1 font-semibold text-navy">{formatDate(quote.createdAt)}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">Validité</p>
            <p className="mt-1 font-semibold text-navy">{quote.expiresAt ? formatDate(quote.expiresAt) : "—"}</p>
          </div>
        </div>

        <div className="px-8 py-8 sm:px-12">
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
              {quote.items.map((item, i) => (
                <tr key={i} className="border-b border-navy/[0.06] align-top">
                  <td className="py-3.5 pr-4 font-medium text-navy">{item.label}</td>
                  <td className="py-3.5 px-4 text-center text-text-secondary">{item.quantity}</td>
                  <td className="py-3.5 px-4 text-right text-text-secondary">{formatFCFA(item.unitPrice)}</td>
                  <td className="py-3.5 pl-4 text-right font-semibold text-navy">{formatFCFA(item.unitPrice * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="grid grid-cols-1 gap-3 sm:hidden print:hidden">
            {quote.items.map((item, i) => (
              <li key={i} className="rounded-xl border border-navy/[0.08] bg-surface-secondary/40 p-4">
                <p className="font-medium text-navy">{item.label}</p>
                <div className="mt-2.5 flex items-center justify-between border-t border-navy/[0.06] pt-2.5 text-sm">
                  <span className="text-text-secondary">{item.quantity} × {formatFCFA(item.unitPrice)}</span>
                  <span className="font-display font-bold text-navy">{formatFCFA(item.unitPrice * item.quantity)}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-text-secondary">Sous-total</span>
                <span className="font-semibold tabular-nums text-navy">{formatFCFA(quote.amount)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-navy/[0.08] py-2 text-sm">
                <span className="text-text-secondary">TVA</span>
                <span className="font-semibold tabular-nums text-navy">{formatFCFA(quote.tax)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-da px-5 py-4 text-white shadow-brand">
                <span className="font-display text-sm font-bold uppercase tracking-wide">Total</span>
                <span className="font-display text-xl font-extrabold tabular-nums">{formatFCFA(quote.total)}</span>
              </div>
            </div>
          </div>

          {quote.notes && (
            <div className="mt-8 rounded-xl border border-navy/[0.08] bg-surface-secondary/40 p-4 text-sm text-text-secondary">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-text-muted">Notes</p>
              <p className="whitespace-pre-line">{quote.notes}</p>
            </div>
          )}
        </div>

        <footer className="border-t border-navy/[0.08] bg-surface-secondary/50 px-8 py-6 text-center text-xs text-text-secondary sm:px-12">
          <p className="font-semibold text-navy">Devis valable sous réserve d'acceptation.</p>
          <p className="mt-1">Digital Access — {siteConfig.contact.address} · {siteConfig.contact.email} · {siteConfig.contact.phone}</p>
          <p className="mt-1 text-text-muted">{siteConfig.url}</p>
        </footer>
      </article>
    </>
  );
}
