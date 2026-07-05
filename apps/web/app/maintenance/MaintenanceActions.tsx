"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, Headset, Info, X } from "lucide-react";
import { Button, buttonClasses, cn } from "@da/ui";
import { siteConfig } from "@/lib/site";

/** Icône WhatsApp officielle (SVG inline — pas de dépendance externe). */
function WhatsAppGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="shrink-0"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.002-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
    </svg>
  );
}

type Note = null | "pay" | "manage";

/** Actions client sur un contrat de maintenance : paiement Mobile Money (à venir), aide, gestion. */
export function MaintenanceActions({
  plan,
  projectTitle,
}: {
  plan: string;
  projectTitle: string;
}) {
  const [note, setNote] = React.useState<Note>(null);

  const waHref = `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(
    `Bonjour Digital Access, je souhaite gérer mon contrat de maintenance ${plan} pour le projet « ${projectTitle} ».`,
  )}`;

  return (
    <div>
      <div className="flex flex-wrap gap-2.5">
        <Button
          variant="primary"
          size="sm"
          onClick={() => setNote((n) => (n === "pay" ? null : "pay"))}
        >
          <CreditCard size={15} />
          Payer ce mois
        </Button>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ variant: "outline", size: "sm" })}
        >
          <WhatsAppGlyph />
          Assistance WhatsApp
        </a>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setNote((n) => (n === "manage" ? null : "manage"))}
        >
          <Headset size={15} />
          Gérer / résilier
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {note && (
          <motion.div
            key={note}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "mt-3 flex items-start gap-3 rounded-xl border p-4 text-sm",
                note === "pay"
                  ? "border-brand-blue-vif/25 bg-brand-blue-vif/[0.05]"
                  : "border-navy/[0.1] bg-surface-secondary/70",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  note === "pay"
                    ? "bg-gradient-da text-white"
                    : "bg-navy/[0.06] text-navy",
                )}
              >
                <Info size={15} />
              </span>
              <div className="flex-1">
                {note === "pay" ? (
                  <>
                    <p className="font-semibold text-navy">
                      Paiement Mobile Money bientôt disponible
                    </p>
                    <p className="mt-1 leading-relaxed text-text-secondary">
                      Le règlement en ligne par Orange Money, MTN MoMo et Wave
                      arrive très prochainement. En attendant, notre équipe vous
                      accompagne pour votre prélèvement du mois via WhatsApp.
                    </p>
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
                    >
                      <WhatsAppGlyph size={15} />
                      Régler via WhatsApp
                    </a>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-navy">
                      Un conseiller s'occupe de tout
                    </p>
                    <p className="mt-1 leading-relaxed text-text-secondary">
                      Pour faire évoluer votre formule, mettre en pause ou
                      résilier votre contrat, contactez votre chargé de compte.
                      Nous traitons chaque demande sous 24&nbsp;h ouvrées.
                    </p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <a
                        href={`mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(
                          `Gestion de mon contrat de maintenance — ${projectTitle}`,
                        )}`}
                        className="font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
                      >
                        {siteConfig.contact.email}
                      </a>
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
                      >
                        <WhatsAppGlyph size={15} />
                        WhatsApp
                      </a>
                    </div>
                  </>
                )}
              </div>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setNote(null)}
                className="rounded-full p-1 text-text-muted transition-colors hover:bg-navy/[0.06] hover:text-navy"
              >
                <X size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
