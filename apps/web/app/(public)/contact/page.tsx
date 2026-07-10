import type { ReactNode } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, MessageCircle, ArrowRight } from "lucide-react";
import {
  Section,
  Container,
  GradientText,
  IconBadge,
  Reveal,
  Monogram,
  buttonClasses,
  cn,
} from "@da/ui";
import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "./ContactForm";

export const metadata = buildMetadata({
  title: "Contact — Parlons de votre projet à Abidjan",
  description:
    "Contactez Digital Access : email, téléphone, WhatsApp et formulaire. Basés à Cocody, Abidjan, nous vous répondons sous 24h pour donner vie à votre site web ou votre plateforme e-learning.",
  path: "/contact",
  keywords: ["contact agence web Abidjan", "devis site web Côte d'Ivoire", "WhatsApp Digital Access"],
});

const { contact, socials, academyUrl } = siteConfig;
const whatsappHref = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
  "Bonjour Digital Access, je souhaite discuter de mon projet.",
)}`;

const hours: { day: string; slot: string }[] = [
  { day: "Lundi — Vendredi", slot: "08h30 — 18h00" },
  { day: "Samedi", slot: "09h00 — 13h00" },
  { day: "Dimanche & jours fériés", slot: "Fermé" },
];

const socialLinks: { label: string; href: string; icon: ReactNode }[] = [
  {
    label: "Facebook",
    href: socials.facebook,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden>
        <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.79-3.91 1.1 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.9h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: socials.instagram,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden>
        <path d="M12 2c2.72 0 3.06.01 4.12.06 1.07.05 1.8.22 2.43.47.66.25 1.22.6 1.77 1.15.55.55.9 1.11 1.15 1.77.25.63.42 1.36.47 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.07-.22 1.8-.47 2.43a4.9 4.9 0 0 1-1.15 1.77c-.55.55-1.11.9-1.77 1.15-.63.25-1.36.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.07-.05-1.8-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.25-.63-.42-1.36-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.07.22-1.8.47-2.43.25-.66.6-1.22 1.15-1.77.55-.55 1.11-.9 1.77-1.15.63-.25 1.36-.42 2.43-.47C8.94 2.01 9.28 2 12 2Zm0 1.8c-2.67 0-2.99.01-4.04.06-.98.04-1.5.21-1.86.35-.47.18-.8.4-1.15.75-.35.35-.57.68-.75 1.15-.14.36-.31.88-.35 1.86-.05 1.05-.06 1.37-.06 4.04s.01 2.99.06 4.04c.04.98.21 1.5.35 1.86.18.47.4.8.75 1.15.35.35.68.57 1.15.75.36.14.88.31 1.86.35 1.05.05 1.37.06 4.04.06s2.99-.01 4.04-.06c.98-.04 1.5-.21 1.86-.35.47-.18.8-.4 1.15-.75.35-.35.57-.68.75-1.15.14-.36.31-.88.35-1.86.05-1.05.06-1.37.06-4.04s-.01-2.99-.06-4.04c-.04-.98-.21-1.5-.35-1.86a3.1 3.1 0 0 0-.75-1.15 3.1 3.1 0 0 0-1.15-.75c-.36-.14-.88-.31-1.86-.35-1.05-.05-1.37-.06-4.04-.06Zm0 3.06a5.14 5.14 0 1 1 0 10.28 5.14 5.14 0 0 1 0-10.28Zm0 8.48a3.34 3.34 0 1 0 0-6.68 3.34 3.34 0 0 0 0 6.68Zm6.54-8.69a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: socials.linkedin,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden>
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
      </svg>
    ),
  },
  {
    label: "X",
    href: socials.x,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
        <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.97 6.82H1.66l7.73-8.84L1.24 2.25H8.07l4.72 6.24 5.45-6.24Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z" />
      </svg>
    ),
  },
];

const contactCards: {
  icon: ReactNode;
  label: string;
  value: string;
  href: string;
  external?: boolean;
  note: string;
}[] = [
  {
    icon: <Mail size={20} />,
    label: "Email",
    value: contact.email,
    href: `mailto:${contact.email}`,
    note: "Réponse sous 24h ouvrées",
  },
  {
    icon: <Phone size={20} />,
    label: "Téléphone",
    value: `${contact.phone} · ${contact.phoneSecondary}`,
    href: `tel:${contact.phone.replace(/\s/g, "")}`,
    note: "Du lundi au vendredi",
  },
  {
    icon: <MessageCircle size={20} />,
    label: "WhatsApp",
    value: contact.phone,
    href: whatsappHref,
    external: true,
    note: "Le plus rapide pour un devis",
  },
  {
    icon: <MapPin size={20} />,
    label: "Adresse",
    value: contact.address,
    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`,
    external: true,
    note: "Sur rendez-vous",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Discutons de <GradientText>votre projet</GradientText>
          </>
        }
        description="Une idée, une question, un devis à préparer ? Notre équipe basée à Abidjan vous répond rapidement — par le canal qui vous arrange."
      />

      <Section spacing="lg">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            {/* Colonne gauche — coordonnées */}
            <div className="space-y-8">
              <Reveal>
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue-royal">
                    Nos coordonnées
                  </span>
                  <h2 className="font-display text-2xl font-extrabold text-navy sm:text-3xl">
                    Plusieurs façons de nous joindre
                  </h2>
                </div>
              </Reveal>

              <div className="grid gap-4 sm:grid-cols-2">
                {contactCards.map((card, i) => (
                  <Reveal key={card.label} delay={i * 0.06}>
                    <Link
                      href={card.href}
                      target={card.external ? "_blank" : undefined}
                      rel={card.external ? "noopener noreferrer" : undefined}
                      className="group flex h-full flex-col gap-3 rounded-xl border border-navy/[0.07] bg-surface-primary p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-blue-vif/30 hover:shadow-lg"
                    >
                      <IconBadge tone="soft" size="sm">
                        {card.icon}
                      </IconBadge>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                          {card.label}
                        </p>
                        <p className="mt-0.5 break-words font-medium text-navy transition-colors group-hover:text-brand-blue-royal">
                          {card.value}
                        </p>
                        <p className="mt-1 text-xs text-text-secondary">{card.note}</p>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>

              {/* Horaires */}
              <Reveal delay={0.1}>
                <div className="rounded-xl border border-navy/[0.07] bg-surface-secondary p-6">
                  <div className="flex items-center gap-3">
                    <IconBadge tone="gradient" size="sm">
                      <Clock size={18} />
                    </IconBadge>
                    <h3 className="font-display text-lg font-bold text-navy">
                      Horaires d'ouverture
                    </h3>
                  </div>
                  <ul className="mt-5 space-y-3">
                    {hours.map((h) => (
                      <li
                        key={h.day}
                        className="flex items-center justify-between gap-4 border-b border-navy/[0.06] pb-3 last:border-0 last:pb-0"
                      >
                        <span className="text-sm text-text-secondary">{h.day}</span>
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            h.slot === "Fermé" ? "text-error/80" : "text-navy",
                          )}
                        >
                          {h.slot}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              {/* Réseaux sociaux */}
              <Reveal delay={0.14}>
                <div>
                  <p className="text-sm font-medium text-navy">Suivez-nous</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {socialLinks.map((s) => (
                      <Link
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.label}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-navy/[0.08] bg-surface-primary text-navy transition-all duration-300 hover:-translate-y-0.5 hover:border-transparent hover:bg-gradient-da hover:text-white hover:shadow-brand"
                      >
                        {s.icon}
                      </Link>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Encart WhatsApp */}
              <Reveal delay={0.18}>
                <div className="relative overflow-hidden rounded-2xl bg-[#075E54] p-6 text-white shadow-brand">
                  <div aria-hidden className="absolute inset-0 bg-grid opacity-10" />
                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden>
                          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35ZM12.05 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.38 9.38 0 0 1-1.44-5.02c0-5.19 4.23-9.42 9.44-9.42a9.4 9.4 0 0 1 6.67 2.77 9.35 9.35 0 0 1 2.76 6.66c0 5.2-4.24 9.42-9.42 9.42Zm8.02-17.44A11.26 11.26 0 0 0 12.04.75C5.8.75.72 5.82.72 12.06c0 1.98.52 3.92 1.5 5.63L.63 23.5l5.94-1.56a11.28 11.28 0 0 0 5.47 1.39h.01c6.24 0 11.32-5.07 11.32-11.31 0-3.02-1.18-5.87-3.3-8.01Z" />
                        </svg>
                      </span>
                      <div>
                        <p className="font-display text-lg font-bold">Discutons sur WhatsApp</p>
                        <p className="mt-0.5 text-sm text-white/80">
                          Une question rapide ? Écrivez-nous directement, réponse quasi immédiate en journée.
                        </p>
                      </div>
                    </div>
                    <Link
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-[#0b3d36] transition-transform hover:scale-[1.03] active:scale-95"
                    >
                      Ouvrir WhatsApp
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Colonne droite — formulaire */}
            <Reveal delay={0.08} y={24}>
              <div className="lg:sticky lg:top-28">
                <ContactForm />
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {/* Carte localisation stylée (pas d'iframe) */}
      <Section tone="muted" spacing="lg">
        <Container>
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-navy/[0.06]">
              {/* Fond dégradé + grille — évoque une carte */}
              <div aria-hidden className="absolute inset-0 bg-gradient-da opacity-95" />
              <div aria-hidden className="absolute inset-0 bg-grid opacity-20" />
              <Monogram
                variant="white"
                size={280}
                className="pointer-events-none absolute -right-16 -top-16 opacity-10"
              />
              <Monogram
                variant="white"
                size={200}
                className="pointer-events-none absolute -bottom-14 left-10 opacity-10"
              />

              {/* Épingle animée */}
              <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block">
                <span className="relative flex h-16 w-16 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-white/40 animate-pulse-ring" />
                  <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-blue-royal shadow-lg">
                    <MapPin size={24} />
                  </span>
                </span>
              </div>

              <div className="relative flex flex-col gap-6 p-8 sm:p-12 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-md text-white">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
                    <MapPin size={14} />
                    Notre localisation
                  </span>
                  <h2 className="mt-5 font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                    Venez nous rencontrer à Abidjan
                  </h2>
                  <p className="mt-3 text-white/85">{contact.address}</p>
                  <p className="mt-1 text-sm text-white/70">
                    Rendez-vous en présentiel ou en visio, selon votre préférence.
                  </p>
                </div>

                <Link
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    contact.address,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses({ variant: "white", size: "md" })}
                >
                  Ouvrir dans Maps
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </Reveal>

          {/* Passerelle Academy / autre canal */}
          <Reveal delay={0.1}>
            <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 text-center sm:flex-row sm:text-left">
              <div>
                <h3 className="font-display text-lg font-bold text-navy">
                  Vous cherchez plutôt à vous former ?
                </h3>
                <p className="mt-1 text-sm text-text-secondary">
                  Découvrez Access Academy, notre plateforme e-learning dédiée aux compétences numériques.
                </p>
              </div>
              <Link
                href={academyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses({ variant: "outline", size: "md" })}
              >
                Visiter Academy
                <ArrowRight size={17} />
              </Link>
            </div>
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
