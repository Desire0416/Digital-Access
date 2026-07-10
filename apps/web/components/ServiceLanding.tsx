import * as React from "react";
import Link from "next/link";
import { ArrowRight, Phone, ChevronDown } from "lucide-react";
import {
  Section,
  Container,
  SectionHeading,
  StaggerGroup,
  StaggerItem,
  Reveal,
  GradientText,
  IconBadge,
  buttonClasses,
  formatFCFA,
} from "@da/ui";
import { Icon } from "@/components/Icon";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { CTABanner } from "@/components/CTABanner";
import { PageHero } from "@/components/PageHero";
import { siteConfig } from "@/lib/site";
import { serviceSchema, faqPageSchema } from "@/lib/structured-data";
import type { ServiceLandingPage } from "@/lib/service-pages";

/** Met en dégradé signature le fragment `accent` du titre (repli : titre brut). */
function renderTitle(title: string, accent?: string): React.ReactNode {
  if (!accent || !title.includes(accent)) return title;
  const [before, after] = title.split(accent);
  return (
    <>
      {before}
      <GradientText>{accent}</GradientText>
      {after}
    </>
  );
}

/**
 * Template de page de destination service (SEO local). Rend un hero brandé,
 * les prestations, les arguments locaux « Pourquoi Digital Access », une FAQ en
 * accordéon et injecte les données structurées Service + FAQPage.
 * Server Component (l'accordéon utilise <details> natif, sans JS client).
 */
export function ServiceLanding({ page }: { page: ServiceLandingPage }) {
  const path = `/services/${page.slug}`;
  const telHref = `tel:${siteConfig.contact.phone.replace(/\s+/g, "")}`;

  return (
    <>
      <JsonLd
        data={serviceSchema({
          name: page.title,
          description: page.metaDescription,
          path,
          serviceType: page.serviceType,
          priceFrom: page.priceFrom,
        })}
      />
      <JsonLd data={faqPageSchema(page.faq)} />

      <PageHero
        eyebrow={page.eyebrow}
        title={renderTitle(page.title, page.titleAccent)}
        description={page.intro}
      >
        <Link href="/devis" className={buttonClasses({ variant: "primary", size: "lg" })}>
          Demander un devis
          <ArrowRight size={18} />
        </Link>
        <a href={telHref} className={buttonClasses({ variant: "outline", size: "lg" })}>
          <Phone size={18} />
          Nous appeler
        </a>
      </PageHero>

      {/* Ce que nous livrons */}
      <Section tone="muted">
        <Container>
          <Breadcrumbs
            className="mb-10"
            items={[
              { name: "Accueil", path: "/" },
              { name: "Services", path: "/services" },
              { name: page.title, path },
            ]}
          />

          <SectionHeading
            eyebrow="Prestations"
            title={
              <>
                Ce que nous <GradientText>livrons</GradientText>
              </>
            }
            subtitle={page.deliverablesSubtitle}
          />

          {page.priceFrom != null && (
            <Reveal className="mt-8 flex justify-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-brand-blue-vif/20 bg-surface-primary px-6 py-3 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-text-muted">
                  À partir de
                </span>
                <span className="font-display text-xl font-extrabold text-navy">
                  {formatFCFA(page.priceFrom)}
                  {page.priceSuffix ?? ""}
                </span>
              </div>
            </Reveal>
          )}

          <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {page.deliverables.map((d) => (
              <StaggerItem
                key={d.title}
                className="rounded-xl border border-navy/[0.07] bg-surface-primary p-6 transition-shadow hover:shadow-lg"
              >
                <IconBadge tone="soft">
                  <Icon name={d.icon} size={22} />
                </IconBadge>
                <h3 className="mt-4 font-display text-lg font-bold text-navy">{d.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{d.text}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* Pourquoi Digital Access */}
      <Section tone="dark">
        <Container>
          <SectionHeading
            invert
            eyebrow="Pourquoi nous"
            title={
              <>
                Pourquoi <GradientText>Digital Access</GradientText>
              </>
            }
            subtitle={page.reasonsSubtitle}
          />
          <StaggerGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {page.reasons.map((r) => (
              <StaggerItem
                key={r.title}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:bg-white/[0.06]"
              >
                <IconBadge tone="gradient">
                  <Icon name={r.icon} size={22} />
                </IconBadge>
                <h3 className="mt-4 font-display text-lg font-bold text-white">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{r.text}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* FAQ — accordéon natif + JSON-LD (injecté en tête via faqPageSchema) */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="FAQ"
            title={
              <>
                Questions <GradientText>fréquentes</GradientText>
              </>
            }
            subtitle="Les réponses aux questions que l'on nous pose le plus souvent sur cette prestation."
          />
          <div className="mx-auto mt-12 max-w-3xl space-y-3">
            {page.faq.map((f) => (
              <details
                key={f.question}
                className="group rounded-xl border border-navy/[0.08] bg-surface-primary p-5 transition-shadow open:shadow-lg"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-bold text-navy [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <ChevronDown
                    className="h-5 w-5 shrink-0 text-brand-blue-royal transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">{f.answer}</p>
              </details>
            ))}
          </div>
        </Container>
      </Section>

      <CTABanner
        title={page.ctaTitle}
        description={page.ctaDescription}
        secondary={{ label: "Voir tous nos services", href: "/services" }}
      />
    </>
  );
}
