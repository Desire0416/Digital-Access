"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Smartphone } from "lucide-react";
import { Container, Monogram, buttonClasses, cn } from "@da/ui";

/** CTA final Academy — bandeau plein dégradé signature, monogrammes en filigrane. */
export function CtaAcademy() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl bg-gradient-da px-8 py-14 text-center sm:px-16 sm:py-20"
        >
          <div aria-hidden className="absolute inset-0 bg-grid opacity-20" />
          <Monogram
            variant="white"
            size={220}
            className="absolute -bottom-16 -left-10 opacity-10"
          />
          <Monogram
            variant="white"
            size={160}
            className="absolute -right-8 -top-10 opacity-10"
          />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Prêt à lancer votre carrière dans le numérique&nbsp;?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
              Créez votre compte gratuitement, choisissez un cours et progressez
              à votre rythme — votre certificat vous attend.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth/register"
                className={buttonClasses({ variant: "white", size: "lg" })}
              >
                Créer un compte gratuit
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/courses"
                className={cn(
                  buttonClasses({ variant: "ghost", size: "lg" }),
                  "text-white hover:bg-white/10",
                )}
              >
                Explorer le catalogue
              </Link>
            </div>
            <p className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/70">
              <Smartphone size={15} />
              Paiement Mobile Money&nbsp;: Orange · MTN · Wave — 100&nbsp;% FCFA
            </p>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
