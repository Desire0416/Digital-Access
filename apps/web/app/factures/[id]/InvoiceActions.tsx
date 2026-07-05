"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Printer, Smartphone, X } from "lucide-react";
import { Button, cn } from "@da/ui";
import { siteConfig } from "@/lib/site";

/** Icône WhatsApp inline (SVG, pas de dépendance externe). */
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function InvoiceActions({
  invoiceNumber,
  payable,
}: {
  invoiceNumber: string;
  payable: boolean;
}) {
  const [payOpen, setPayOpen] = React.useState(false);

  const whatsappHref = `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(
    `Bonjour Digital Access, je souhaite régler ma facture ${invoiceNumber} par Mobile Money.`,
  )}`;

  return (
    <div className="print:hidden">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          size="md"
          onClick={() => window.print()}
          type="button"
        >
          <Printer size={17} />
          Imprimer / Télécharger en PDF
        </Button>

        {payable && (
          <Button
            variant="outline"
            size="md"
            type="button"
            onClick={() => setPayOpen((v) => !v)}
          >
            <Smartphone size={17} />
            Payer par Mobile Money
          </Button>
        )}
      </div>

      <AnimatePresence>
        {payable && payOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="relative rounded-2xl border border-brand-blue-vif/20 bg-brand-blue-vif/[0.04] p-5">
              <button
                type="button"
                onClick={() => setPayOpen(false)}
                aria-label="Fermer"
                className="absolute right-3 top-3 rounded-lg p-1 text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-navy"
              >
                <X size={16} />
              </button>
              <div className="flex items-start gap-3 pr-6">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-da text-white shadow-brand">
                  <Smartphone size={18} />
                </span>
                <div>
                  <p className="font-display text-sm font-bold text-navy">
                    Paiement en ligne bientôt disponible
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    Le règlement direct par Orange Money, MTN et Wave arrive
                    très prochainement. En attendant, contactez notre équipe sur
                    WhatsApp pour finaliser votre paiement en quelques minutes.
                  </p>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "mt-4 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5",
                    )}
                  >
                    <WhatsAppIcon size={17} />
                    Régler via WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
