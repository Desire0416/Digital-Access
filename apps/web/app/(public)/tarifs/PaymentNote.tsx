"use client";

import { motion } from "framer-motion";
import { CalendarClock, Landmark, ShieldCheck } from "lucide-react";
import { Container, Monogram } from "@da/ui";

const wallets = [
  { name: "Orange Money", short: "Orange", color: "#FF7900" },
  { name: "MTN MoMo", short: "MTN", color: "#FFCB05", text: "#1A1A2E" },
  { name: "Wave", short: "Wave", color: "#1DC4FF", text: "#1A1A2E" },
];

const perks = [
  {
    icon: CalendarClock,
    title: "Paiement en plusieurs fois",
    description:
      "Pour les projets importants, étalez le règlement : un acompte au lancement, le solde à la livraison.",
  },
  {
    icon: Landmark,
    title: "Virement & espèces",
    description:
      "Virement bancaire ou paiement sur place à Abidjan également acceptés, avec facture en bonne et due forme.",
  },
  {
    icon: ShieldCheck,
    title: "Transactions sécurisées",
    description:
      "Encaissements chiffrés via nos partenaires agréés. Vos données de paiement ne transitent jamais en clair.",
  },
];

/** Bloc « paiement » — Mobile Money mis en avant + facilités de règlement. */
export function PaymentNote() {
  return (
    <Container>
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-navy/[0.08] bg-surface-primary"
      >
        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
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
                Moyen de paiement n°1
              </span>
              <h3 className="mt-5 font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                Payez en Mobile Money, comme au quotidien
              </h3>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
                Orange Money, MTN MoMo et Wave sont intégrés nativement. Réglez
                votre projet ou votre abonnement de maintenance depuis votre
                téléphone, en quelques secondes.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {wallets.map((w) => (
                  <span
                    key={w.name}
                    className="inline-flex items-center gap-2.5 rounded-xl bg-white/95 px-4 py-2.5 shadow-sm"
                  >
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg font-display text-[11px] font-extrabold"
                      style={{
                        backgroundColor: w.color,
                        color: w.text ?? "#ffffff",
                      }}
                    >
                      {w.short.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="font-display text-sm font-bold text-navy">
                      {w.name}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Volet clair — facilités de règlement */}
          <div className="p-8 sm:p-10 lg:p-12">
            <ul className="space-y-6">
              {perks.map((perk) => (
                <li key={perk.title} className="flex gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue-vif/10 text-brand-blue-royal">
                    <perk.icon size={20} strokeWidth={2} />
                  </span>
                  <div>
                    <h4 className="font-display text-base font-bold text-navy">
                      {perk.title}
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                      {perk.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </Container>
  );
}
