"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Container, buttonClasses, cn, Monogram } from "@da/ui";

export function CTABanner({
  title = "Prêt à donner vie à votre projet ?",
  description = "Parlons de vos objectifs. Un devis gratuit et sans engagement vous est remis sous 48h.",
  primary = { label: "Demander un devis", href: "/devis" },
  secondary,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
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
              {title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/85">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={primary.href}
                className={buttonClasses({ variant: "white", size: "lg" })}
              >
                {primary.label}
                <ArrowRight size={18} />
              </Link>
              {secondary && (
                <Link
                  href={secondary.href}
                  className={cn(
                    buttonClasses({ variant: "ghost", size: "lg" }),
                    "text-white hover:bg-white/10",
                  )}
                >
                  {secondary.label}
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
