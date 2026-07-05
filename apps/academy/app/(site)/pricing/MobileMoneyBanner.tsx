"use client";

import { motion } from "framer-motion";
import { BellRing, ShieldCheck, Timer } from "lucide-react";
import { Container, Monogram, buttonClasses, cn } from "@da/ui";
import { academyConfig } from "@/lib/site";

const wallets = [
  { name: "Orange Money", short: "OM", color: "#FF7900", text: "#FFFFFF" },
  { name: "MTN MoMo", short: "MT", color: "#FFCB05", text: "#1A1A2E" },
  { name: "Wave", short: "WA", color: "#1DC4FF", text: "#1A1A2E" },
];

const whatsappHref = `https://wa.me/${academyConfig.contact.whatsapp}?text=${encodeURIComponent(
  "Bonjour Digital Access ! Je souhaite un accès anticipé aux cours payants d'Access Academy.",
)}`;

/** Icône WhatsApp inline (lucide v1 n'embarque pas les icônes de marque). */
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

/** Bandeau paiement Mobile Money — volet dégradé signature + accès anticipé WhatsApp. */
export function MobileMoneyBanner() {
  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-navy/[0.08] bg-surface-primary"
      >
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          {/* Volet dégradé — Mobile Money */}
          <div className="relative overflow-hidden bg-gradient-da p-8 sm:p-10 lg:p-12">
            <div aria-hidden className="absolute inset-0 bg-grid opacity-20" />
            <Monogram
              variant="white"
              size={200}
              className="absolute -bottom-14 -right-10 opacity-10"
            />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
                Paiement Mobile Money
              </span>
              <h3 className="mt-5 font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                Payez vos cours comme vous payez tout, depuis votre téléphone
              </h3>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
                Pas besoin de carte bancaire&nbsp;: Orange Money, MTN MoMo et
                Wave, en FCFA, en quelques secondes. Le moyen de paiement
                n°1 en Côte d&apos;Ivoire, intégré au cœur d&apos;Academy.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {wallets.map((w) => (
                  <motion.span
                    key={w.name}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="inline-flex items-center gap-2.5 rounded-xl bg-white/95 px-4 py-2.5 shadow-sm"
                  >
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg font-display text-[11px] font-extrabold"
                      style={{ backgroundColor: w.color, color: w.text }}
                    >
                      {w.short}
                    </span>
                    <span className="font-display text-sm font-bold text-navy">
                      {w.name}
                    </span>
                  </motion.span>
                ))}
              </div>
            </div>
          </div>

          {/* Volet clair — accès anticipé WhatsApp */}
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-blue-royal">
              <Timer size={14} />
              Lancement imminent
            </span>
            <h4 className="mt-3 font-display text-xl font-bold leading-snug text-navy sm:text-2xl">
              Paiement en ligne bientôt disponible
            </h4>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary sm:text-base">
              L&apos;encaissement automatique arrive très bientôt. En attendant,
              contactez-nous sur WhatsApp pour un{" "}
              <strong className="font-semibold text-navy">accès anticipé</strong>{" "}
              aux cours payants — on s&apos;occupe de tout, vous commencez à
              apprendre aujourd&apos;hui.
            </p>
            <div className="mt-6">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonClasses({ variant: "primary", size: "lg" }),
                  "w-full sm:w-auto",
                )}
              >
                <WhatsAppIcon size={18} />
                Demander un accès anticipé
              </a>
            </div>
            <ul className="mt-6 space-y-2 text-xs font-medium text-text-muted">
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-success" />
                Transactions sécurisées via nos partenaires agréés
              </li>
              <li className="flex items-center gap-2">
                <BellRing size={14} className="text-brand-blue-royal" />
                Vous serez prévenu dès l&apos;ouverture du paiement en ligne
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </Container>
  );
}
