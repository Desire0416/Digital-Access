"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@da/ui";

const faq = [
  {
    question: "Puis-je apprendre sur mobile ?",
    answer:
      "Oui, et c'est même pensé pour ça. Toute la plateforme — vidéos, leçons, quiz et suivi de progression — est optimisée pour smartphone et pour les connexions 3G/4G. Vous pouvez commencer un chapitre dans le woro-woro et le terminer à la maison : votre progression vous suit partout.",
  },
  {
    question: "Les certificats sont-ils vérifiables ?",
    answer:
      "Chaque certificat Access Academy porte un code unique et un QR code. Un recruteur ou un employeur peut le scanner et vérifier son authenticité en ligne en quelques secondes — nom de l'apprenant, cours suivi et date d'obtention. Aucun certificat ne peut être falsifié.",
  },
  {
    question: "Comment payer un cours ?",
    answer:
      "Le paiement Mobile Money (Orange Money, MTN MoMo, Wave) en FCFA est en cours d'intégration et arrive très bientôt. En attendant, contactez-nous sur WhatsApp pour un accès anticipé aux cours payants : nous activons votre accès manuellement, sans carte bancaire.",
  },
  {
    question: "Y a-t-il des cours gratuits ?",
    answer:
      "Oui ! Certains cours du catalogue sont 100 % gratuits, quiz et certificat inclus — il suffit de créer un compte. C'est la meilleure façon de découvrir la plateforme avant d'investir dans un cours payant. Utilisez le filtre « Gratuit » du catalogue pour les retrouver.",
  },
];

/** Mini FAQ tarifaire — accordéon animé, une seule question ouverte à la fois. */
export function PricingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-navy/[0.08] overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary">
      {faq.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-surface-secondary/60 sm:px-6"
            >
              <span className="font-display text-base font-semibold text-navy sm:text-lg">
                {item.question}
              </span>
              <span
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                  isOpen
                    ? "bg-gradient-da text-white"
                    : "bg-brand-blue-vif/10 text-brand-blue-royal",
                )}
              >
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-flex"
                >
                  <ChevronDown size={17} strokeWidth={2.5} />
                </motion.span>
              </span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-6 text-sm leading-relaxed text-text-secondary sm:px-6 sm:text-base">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
