import Link from "next/link";
import { Section, Container, GradientText } from "@da/ui";
import { PageHero } from "@/components/PageHero";
import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import {
  LegalSection,
  LegalTOC,
  LegalInfoGrid,
  type LegalSectionData,
} from "./LegalDoc";

export const metadata = buildMetadata({
  title: "Mentions légales — Digital Access",
  description:
    "Mentions légales de Digital Access : identité de l'éditeur, direction de la publication, hébergement et informations légales du site digitalaccess.ci.",
  path: "/mentions-legales",
});

const LAST_UPDATE = "4 juillet 2026";

const sections: LegalSectionData[] = [
  { id: "editeur", title: "Éditeur du site", body: null },
  { id: "publication", title: "Direction de la publication", body: null },
  { id: "hebergement", title: "Hébergement", body: null },
  { id: "propriete", title: "Propriété intellectuelle", body: null },
  { id: "responsabilite", title: "Limitation de responsabilité", body: null },
  { id: "liens", title: "Liens hypertextes", body: null },
  { id: "donnees", title: "Données personnelles & cookies", body: null },
  { id: "droit", title: "Droit applicable", body: null },
  { id: "contact", title: "Contact", body: null },
];

export default function MentionsLegalesPage() {
  return (
    <>
      <PageHero
        eyebrow="Informations légales"
        title={
          <>
            Mentions <GradientText>légales</GradientText>
          </>
        }
        description="Les informations légales relatives à l'éditeur du site digitalaccess.ci et aux conditions de sa mise à disposition."
      />

      <Section spacing="lg">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
            <LegalTOC sections={sections} />

            <div>
              <p className="mb-12 inline-flex items-center gap-2 rounded-full border border-navy/[0.08] bg-surface-secondary px-4 py-1.5 text-xs font-medium text-text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-da" />
                Dernière mise à jour&nbsp;: {LAST_UPDATE}
              </p>

              <div className="space-y-14">
                <LegalSection index={1} id="editeur" title="Éditeur du site">
                  <p>
                    Le site{" "}
                    <span className="font-semibold text-navy">
                      digitalaccess.ci
                    </span>{" "}
                    est édité par <strong>Digital Access</strong>, agence
                    spécialisée dans la conception de sites web, d'applications
                    et de plateformes e-learning.
                  </p>
                  <LegalInfoGrid
                    className="not-prose"
                    items={[
                      { label: "Dénomination", value: siteConfig.name },
                      {
                        label: "Forme",
                        value: "Entreprise de services numériques",
                      },
                      {
                        label: "Siège social",
                        value: siteConfig.contact.address,
                      },
                      {
                        label: "Adresse e-mail",
                        value: (
                          <a
                            href={`mailto:${siteConfig.contact.email}`}
                            className="text-brand-blue-royal hover:underline"
                          >
                            {siteConfig.contact.email}
                          </a>
                        ),
                      },
                      { label: "Téléphone", value: siteConfig.contact.phone },
                      {
                        label: "Site web",
                        value: (
                          <a
                            href={siteConfig.url}
                            className="text-brand-blue-royal hover:underline"
                          >
                            digitalaccess.ci
                          </a>
                        ),
                      },
                    ]}
                  />
                </LegalSection>

                <LegalSection
                  index={2}
                  id="publication"
                  title="Direction de la publication"
                >
                  <p>
                    Le directeur de la publication du site est{" "}
                    <strong>Desiré K.</strong>, en sa qualité de responsable de
                    Digital Access. Il veille au respect de la présente
                    déclaration légale et à la conformité des contenus publiés.
                  </p>
                  <p>
                    Pour toute question relative au contenu éditorial du site,
                    vous pouvez écrire à{" "}
                    <a
                      href={`mailto:${siteConfig.contact.email}`}
                      className="text-brand-blue-royal hover:underline"
                    >
                      {siteConfig.contact.email}
                    </a>
                    .
                  </p>
                </LegalSection>

                <LegalSection index={3} id="hebergement" title="Hébergement">
                  <p>
                    Le site est hébergé et déployé sur l'infrastructure de{" "}
                    <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133, Walnut,
                    CA 91789, États-Unis —{" "}
                    <a
                      href="https://vercel.com"
                      className="text-brand-blue-royal hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      vercel.com
                    </a>
                    .
                  </p>
                  <p>
                    Les données applicatives sont stockées via{" "}
                    <strong>Neon Inc.</strong> (base de données PostgreSQL
                    serverless) —{" "}
                    <a
                      href="https://neon.tech"
                      className="text-brand-blue-royal hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      neon.tech
                    </a>
                    . Les hébergeurs mettent en œuvre des mesures techniques
                    conformes à l'état de l'art pour garantir la disponibilité
                    et la sécurité du service.
                  </p>
                </LegalSection>

                <LegalSection
                  index={4}
                  id="propriete"
                  title="Propriété intellectuelle"
                >
                  <p>
                    L'ensemble des éléments composant le site (structure,
                    textes, illustrations, logotype, dégradé signature, code
                    source, éléments graphiques et animations) est la propriété
                    exclusive de Digital Access ou fait l'objet d'une
                    autorisation d'usage.
                  </p>
                  <p>
                    Toute reproduction, représentation, modification ou
                    exploitation, totale ou partielle, sans l'autorisation
                    écrite préalable de Digital Access est strictement
                    interdite et constitue une contrefaçon sanctionnée par les
                    lois en vigueur en Côte d'Ivoire et par les conventions
                    internationales.
                  </p>
                  <p>
                    La marque «&nbsp;Digital Access&nbsp;» et le nom
                    «&nbsp;Access Academy&nbsp;» ainsi que leurs identités
                    visuelles ne peuvent être utilisés sans accord préalable.
                  </p>
                </LegalSection>

                <LegalSection
                  index={5}
                  id="responsabilite"
                  title="Limitation de responsabilité"
                >
                  <p>
                    Digital Access s'efforce d'assurer l'exactitude et la mise à
                    jour des informations diffusées sur le site. Toutefois,
                    l'éditeur ne saurait garantir l'exhaustivité ou l'absence
                    d'erreur des contenus mis à disposition à titre informatif.
                  </p>
                  <p>
                    L'utilisateur reconnaît utiliser ces informations sous sa
                    seule responsabilité. Digital Access ne pourra être tenu
                    responsable des dommages directs ou indirects résultant de
                    l'accès au site, de son utilisation ou d'une interruption du
                    service.
                  </p>
                </LegalSection>

                <LegalSection index={6} id="liens" title="Liens hypertextes">
                  <p>
                    Le site peut contenir des liens vers des sites tiers,
                    notamment vers{" "}
                    <a
                      href={siteConfig.academyUrl}
                      className="text-brand-blue-royal hover:underline"
                    >
                      Access Academy
                    </a>
                    . Digital Access n'exerce aucun contrôle sur ces ressources
                    externes et décline toute responsabilité quant à leur
                    contenu ou à leur politique de confidentialité.
                  </p>
                  <p>
                    La mise en place d'un lien vers digitalaccess.ci est libre
                    dès lors qu'elle ne porte pas atteinte à l'image de
                    l'éditeur. Digital Access se réserve le droit de demander la
                    suppression de tout lien jugé inapproprié.
                  </p>
                </LegalSection>

                <LegalSection
                  index={7}
                  id="donnees"
                  title="Données personnelles & cookies"
                >
                  <p>
                    Le traitement des données personnelles collectées via le
                    site (formulaires de contact, demandes de devis, création de
                    compte) est détaillé dans notre{" "}
                    <Link
                      href="/confidentialite"
                      className="font-semibold text-brand-blue-royal hover:underline"
                    >
                      politique de confidentialité
                    </Link>
                    .
                  </p>
                  <p>
                    Conformément à la réglementation applicable en Côte d'Ivoire
                    en matière de protection des données à caractère personnel,
                    vous disposez de droits d'accès, de rectification et de
                    suppression que vous pouvez exercer à tout moment.
                  </p>
                </LegalSection>

                <LegalSection index={8} id="droit" title="Droit applicable">
                  <p>
                    Les présentes mentions légales sont régies par le droit
                    ivoirien. Tout litige relatif à l'utilisation du site
                    relève, à défaut de résolution amiable, de la compétence des
                    juridictions d'Abidjan, Côte d'Ivoire.
                  </p>
                </LegalSection>

                <LegalSection index={9} id="contact" title="Contact">
                  <p>
                    Pour toute question relative aux présentes mentions légales,
                    vous pouvez nous contacter&nbsp;:
                  </p>
                  <ul className="ml-1 space-y-1">
                    <li>
                      Par e-mail&nbsp;:{" "}
                      <a
                        href={`mailto:${siteConfig.contact.email}`}
                        className="text-brand-blue-royal hover:underline"
                      >
                        {siteConfig.contact.email}
                      </a>
                    </li>
                    <li>Par téléphone&nbsp;: {siteConfig.contact.phone}</li>
                    <li>Par courrier&nbsp;: {siteConfig.contact.address}</li>
                  </ul>
                  <p>
                    Vous pouvez également utiliser notre{" "}
                    <Link
                      href="/contact"
                      className="font-semibold text-brand-blue-royal hover:underline"
                    >
                      formulaire de contact
                    </Link>
                    .
                  </p>
                </LegalSection>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
