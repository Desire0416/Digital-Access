"use client";

import { ShieldCheck, Smartphone, MessagesSquare, Clock } from "lucide-react";
import { Container, StaggerGroup, StaggerItem } from "@da/ui";

const advantages = [
  {
    icon: ShieldCheck,
    title: "Certificats vérifiables",
    description:
      "Un certificat officiel avec QR code, authentifiable en ligne par tout recruteur.",
  },
  {
    icon: Smartphone,
    title: "Paiement Mobile Money",
    description:
      "Réglez vos cours en toute simplicité via Orange Money, MTN Money ou Wave.",
  },
  {
    icon: MessagesSquare,
    title: "Forum & entraide",
    description:
      "Posez vos questions, échangez avec la communauté et les instructeurs sur chaque cours.",
  },
  {
    icon: Clock,
    title: "À votre rythme",
    description:
      "Accès illimité et à vie à vos cours. Apprenez quand vous voulez, où vous voulez.",
  },
];

/** Bandeau d'avantages Academy sur fond sombre brandé. */
export function AdvantagesBand() {
  return (
    <section className="relative overflow-hidden bg-surface-dark py-20 sm:py-24">
      <div aria-hidden className="absolute inset-0 bg-gradient-da opacity-[0.08]" />
      <div aria-hidden className="absolute inset-0 bg-grid opacity-25" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-accent/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-brand-cyan/20 blur-3xl"
      />

      <Container className="relative">
        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {advantages.map(({ icon: AdvIcon, title, description }) => (
            <StaggerItem
              key={title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:border-white/20 hover:bg-white/[0.08]"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-brand-cyan">
                <AdvIcon size={22} />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {description}
              </p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
