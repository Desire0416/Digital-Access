"use client";

import { Container, AnimatedCounter, StaggerGroup, StaggerItem } from "@da/ui";
import type { Stat } from "@da/db";

/* Bandeau de statistiques — tuiles « verre dépoli » sur fond sombre : chaque
   chiffre dans sa carte bordée, grille 2 colonnes sur mobile (la dernière tuile
   occupe toute la largeur), jusqu'à 5 colonnes en desktop. */
export function StatsBand({ stats }: { stats: Stat[] }) {
  return (
    <section className="relative overflow-hidden bg-surface-dark py-10 sm:py-16">
      <div aria-hidden className="absolute inset-0 bg-gradient-da opacity-10" />
      <div aria-hidden className="absolute inset-0 bg-grid opacity-30" />
      <Container className="relative">
        <StaggerGroup className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {stats.map((stat) => (
            <StaggerItem
              key={stat.id}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-center backdrop-blur-sm transition-colors hover:border-white/25 sm:p-5 [&:last-child]:col-span-2 sm:[&:last-child]:col-span-1"
            >
              <p className="font-display text-[1.75rem] font-extrabold leading-none sm:text-4xl">
                <span className="text-gradient-da">
                  <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </span>
              </p>
              <p className="mt-2 text-xs font-medium leading-tight text-white/60 sm:text-sm">
                {stat.label}
              </p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
