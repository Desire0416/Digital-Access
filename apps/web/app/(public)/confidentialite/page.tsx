import Link from "next/link";
import { Section, Container, GradientText } from "@da/ui";
import { PageHero } from "@/components/PageHero";
import { siteConfig } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import {
  LegalSection,
  LegalTOC,
  DataCards,
  RightsCards,
  type LegalSectionData,
} from "./LegalDoc";

export const metadata = buildMetadata({
  title: "Politique de confidentialité — Digital Access",
  description:
    "Politique de confidentialité de Digital Access : données collectées, finalités, base légale, durée de conservation, cookies et exercice de vos droits sur vos données personnelles.",
  path: "/confidentialite",
});

const LAST_UPDATE = "4 juillet 2026";

const sections: LegalSectionData[] = [
  { id: "engagement", title: "Notre engagement" },
  { id: "responsable", title: "Responsable du traitement" },
  { id: "donnees", title: "Données collectées" },
  { id: "finalites", title: "Finalités & base légale" },
  { id: "conservation", title: "Durée de conservation" },
  { id: "partage", title: "Partage des données" },
  { id: "securite", title: "Sécurité" },
  { id: "droits", title: "Vos droits" },
  { id: "cookies", title: "Cookies" },
  { id: "contact", title: "Contact & DPO" },
];

const collectedData = [
  {
    icon: "file-text",
    title: "Données d'identité",
    description:
      "Nom, prénom, adresse e-mail et numéro de téléphone lorsque vous nous contactez ou créez un compte.",
  },
  {
    icon: "target",
    title: "Données de projet",
    description:
      "Type de projet, budget, délais et messages transmis via le wizard de devis ou le formulaire de contact.",
  },
  {
    icon: "smartphone",
    title: "Données de connexion",
    description:
      "Adresse IP, type d'appareil et de navigateur, collectés à des fins de sécurité et de mesure d'audience.",
  },
  {
    icon: "shield-check",
    title: "Données de compte",
    description:
      "Identifiants chiffrés, préférences et historique d'activité pour les utilisateurs disposant d'un espace client.",
  },
];

const rights = [
  {
    title: "Droit d'accès",
    description:
      "Obtenir la confirmation que vos données sont traitées et en recevoir une copie.",
  },
  {
    title: "Droit de rectification",
    description:
      "Faire corriger des données inexactes ou compléter des données incomplètes.",
  },
  {
    title: "Droit à l'effacement",
    description:
      "Demander la suppression de vos données lorsque leur conservation n'est plus justifiée.",
  },
  {
    title: "Droit d'opposition",
    description:
      "Vous opposer au traitement de vos données à des fins de prospection.",
  },
  {
    title: "Droit à la limitation",
    description:
      "Demander le gel temporaire de l'utilisation de certaines de vos données.",
  },
  {
    title: "Droit à la portabilité",
    description:
      "Récupérer vos données dans un format structuré et lisible par machine.",
  },
];

export default function ConfidentialitePage() {
  return (
    <>
      <PageHero
        eyebrow="Protection des données"
        title={
          <>
            Politique de <GradientText>confidentialité</GradientText>
          </>
        }
        description="Votre confiance est essentielle. Voici comment Digital Access collecte, utilise et protège vos données personnelles, en toute transparence."
      />

      <Section spacing="lg">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
            <LegalTOC sections={sections} />

            <div>
              <p className="mb-12 inline-flex items-center gap-2 rounded-full border border-navy/[0.08] bg-surface-secondary px-4 py-1.5 text-xs font-medium text-text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-da" />
                Dernière mise à jour&nbsp;: {LAST_UPDATE}
              </p>

              <div className="space-y-14">
                <LegalSection index={1} id="engagement" title="Notre engagement">
                  <p>
                    Digital Access accorde une importance primordiale à la
                    protection de la vie privée et des données personnelles de
                    ses utilisateurs. La présente politique décrit les
                    traitements mis en œuvre sur le site{" "}
                    <span className="font-semibold text-navy">
                      digitalaccess.ci
                    </span>{" "}
                    et vos droits associés.
                  </p>
                  <p>
                    Nous nous engageons à ne collecter que les données
                    strictement nécessaires et à ne jamais les vendre à des
                    tiers.
                  </p>
                </LegalSection>

                <LegalSection
                  index={2}
                  id="responsable"
                  title="Responsable du traitement"
                >
                  <p>
                    Le responsable du traitement des données est{" "}
                    <strong>{siteConfig.name}</strong>, dont le siège est situé
                    à {siteConfig.contact.address}. Pour toute question relative
                    à vos données, vous pouvez écrire à{" "}
                    <a
                      href={`mailto:${siteConfig.contact.email}`}
                      className="text-brand-blue-royal hover:underline"
                    >
                      {siteConfig.contact.email}
                    </a>
                    .
                  </p>
                </LegalSection>

                <LegalSection index={3} id="donnees" title="Données collectées">
                  <p>
                    Nous collectons uniquement les données que vous nous
                    transmettez volontairement ou qui sont nécessaires au bon
                    fonctionnement du service&nbsp;:
                  </p>
                  <DataCards items={collectedData} />
                </LegalSection>

                <LegalSection
                  index={4}
                  id="finalites"
                  title="Finalités & base légale"
                >
                  <p>
                    Vos données sont traitées pour des finalités déterminées et
                    légitimes&nbsp;:
                  </p>
                  <ul className="ml-1 list-disc space-y-2 pl-5 marker:text-brand-blue-vif">
                    <li>
                      <strong>Répondre à vos demandes</strong> (contact, devis)
                      — base&nbsp;: mesures précontractuelles.
                    </li>
                    <li>
                      <strong>Gérer votre compte et vos projets</strong> —
                      base&nbsp;: exécution du contrat.
                    </li>
                    <li>
                      <strong>Assurer la sécurité du site</strong> — base&nbsp;:
                      intérêt légitime.
                    </li>
                    <li>
                      <strong>
                        Vous adresser des informations utiles
                      </strong>{" "}
                      — base&nbsp;: votre consentement, révocable à tout moment.
                    </li>
                  </ul>
                </LegalSection>

                <LegalSection
                  index={5}
                  id="conservation"
                  title="Durée de conservation"
                >
                  <p>
                    Vos données sont conservées pour une durée n'excédant pas
                    celle nécessaire aux finalités poursuivies&nbsp;:
                  </p>
                  <ul className="ml-1 list-disc space-y-2 pl-5 marker:text-brand-blue-vif">
                    <li>
                      Demandes de contact et devis&nbsp;: 3 ans à compter du
                      dernier échange.
                    </li>
                    <li>
                      Données de compte client&nbsp;: pendant toute la durée de
                      la relation, puis suppression logique sous 30 jours.
                    </li>
                    <li>
                      Données comptables et contractuelles&nbsp;: 10 ans
                      conformément aux obligations légales.
                    </li>
                  </ul>
                </LegalSection>

                <LegalSection index={6} id="partage" title="Partage des données">
                  <p>
                    Vos données ne sont jamais cédées ni vendues. Elles peuvent
                    être communiquées à des sous-traitants techniques agissant
                    pour notre compte, dans le strict cadre du service&nbsp;:
                    hébergement (Vercel, Neon), envoi d'e-mails (Resend) et
                    prestataires de paiement Mobile Money (CinetPay / FedaPay).
                  </p>
                  <p>
                    Ces prestataires sont tenus contractuellement d'assurer un
                    niveau de protection adéquat de vos données.
                  </p>
                </LegalSection>

                <LegalSection index={7} id="securite" title="Sécurité">
                  <p>
                    Nous mettons en œuvre des mesures techniques et
                    organisationnelles adaptées&nbsp;: chiffrement des mots de
                    passe, connexions sécurisées (HTTPS), contrôle d'accès et
                    hébergement conforme à l'état de l'art. Malgré ces mesures,
                    aucune transmission sur internet n'est totalement inviolable.
                  </p>
                </LegalSection>

                <LegalSection index={8} id="droits" title="Vos droits">
                  <p>
                    Conformément à la réglementation applicable en matière de
                    protection des données, vous disposez des droits
                    suivants&nbsp;:
                  </p>
                  <RightsCards items={rights} />
                  <p>
                    Pour exercer ces droits, adressez votre demande à{" "}
                    <a
                      href={`mailto:${siteConfig.contact.email}`}
                      className="text-brand-blue-royal hover:underline"
                    >
                      {siteConfig.contact.email}
                    </a>
                    . Une réponse vous sera apportée dans un délai d'un mois.
                  </p>
                </LegalSection>

                <LegalSection index={9} id="cookies" title="Cookies">
                  <p>
                    Le site utilise des cookies strictement nécessaires à son
                    fonctionnement (session, sécurité) ainsi que, sous réserve de
                    votre consentement, des cookies de mesure d'audience visant à
                    améliorer votre expérience.
                  </p>
                  <p>
                    Vous pouvez à tout moment configurer votre navigateur pour
                    refuser les cookies non essentiels. Le refus de certains
                    cookies peut néanmoins altérer votre navigation.
                  </p>
                </LegalSection>

                <LegalSection index={10} id="contact" title="Contact & DPO">
                  <p>
                    Pour toute question relative à cette politique ou au
                    traitement de vos données, vous pouvez contacter notre
                    délégué à la protection des données (DPO)&nbsp;:
                  </p>
                  <ul className="ml-1 space-y-1">
                    <li>
                      E-mail&nbsp;:{" "}
                      <a
                        href={`mailto:${siteConfig.contact.email}`}
                        className="text-brand-blue-royal hover:underline"
                      >
                        {siteConfig.contact.email}
                      </a>
                    </li>
                    <li>Adresse&nbsp;: {siteConfig.contact.address}</li>
                  </ul>
                  <p>
                    Consultez également nos{" "}
                    <Link
                      href="/mentions-legales"
                      className="font-semibold text-brand-blue-royal hover:underline"
                    >
                      mentions légales
                    </Link>{" "}
                    et nos{" "}
                    <Link
                      href="/cgu"
                      className="font-semibold text-brand-blue-royal hover:underline"
                    >
                      conditions d'utilisation
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
