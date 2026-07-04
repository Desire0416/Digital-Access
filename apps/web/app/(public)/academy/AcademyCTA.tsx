"use client";

import { motion } from "framer-motion";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Container, buttonClasses, cn, Monogram } from "@da/ui";
import { siteConfig } from "@/lib/site";

/** CTA final vers academy.digitalaccess.ci (liens externes). */
export function AcademyCTA() {
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
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
              <GraduationCap size={15} />
              Access Academy
            </span>
            <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Prêt à faire décoller vos compétences ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
              Rejoignez plus de 1 200 apprenants sur academy.digitalaccess.ci et
              transformez votre avenir professionnel dès aujourd'hui.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={siteConfig.academyUrl}
                className={buttonClasses({ variant: "white", size: "lg" })}
              >
                Accéder à Academy
                <ArrowRight size={18} />
              </a>
              <a
                href={`${siteConfig.academyUrl}/auth/register`}
                className={cn(
                  buttonClasses({ variant: "ghost", size: "lg" }),
                  "text-white hover:bg-white/10",
                )}
              >
                Créer un compte gratuit
              </a>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
