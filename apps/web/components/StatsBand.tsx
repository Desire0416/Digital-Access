"use client";

import { Container, AnimatedCounter, StaggerGroup, StaggerItem } from "@da/ui";
import type { Stat } from "@da/db";

export function StatsBand({ stats }: { stats: Stat[] }) {
  return (
    <section className="relative overflow-hidden bg-surface-dark py-16">
      <div aria-hidden className="absolute inset-0 bg-gradient-da opacity-10" />
      <div aria-hidden className="absolute inset-0 bg-grid opacity-30" />
      <Container className="relative">
        <StaggerGroup className="mx-auto flex max-w-5xl flex-wrap items-start justify-center gap-x-10 gap-y-10 sm:gap-x-14 lg:gap-x-16">
          {stats.map((stat) => (
            <StaggerItem key={stat.id} className="w-[40%] text-center sm:w-[26%] lg:w-auto lg:min-w-[8.5rem]">
              <p className="font-display text-4xl font-extrabold text-white sm:text-5xl">
                <span className="text-gradient-da">
                  <AnimatedCounter
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </span>
              </p>
              <p className="mt-2 text-sm font-medium text-white/60">
                {stat.label}
              </p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
