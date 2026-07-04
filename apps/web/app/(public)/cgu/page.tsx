import type { Metadata } from "next";
import Link from "next/link";
import { Section, Container, GradientText } from "@da/ui";
import { PageHero } from "@/components/PageHero";
import { siteConfig } from "@/lib/site";
import { LegalArticle, LegalTOC, type LegalSectionData } from "./LegalDoc";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Digital Access",
  description:
    "Conditions Générales d'Utilisation du site digitalaccess.ci : objet, accès au service, propriété intellectuelle, responsabilités, données personnelles et droit applicable en Côte d'Ivoire.",
};

const LAST_UPDATE = "4 juillet 2026";

const sections: LegalSectionData[] = [
  { id: "objet", title: "Objet" },
  { id: "acces", title: "Accès au site et aux services" },
  { id: "compte", title: "Compte utilisateur" },
  { id: "propriete", title: "Propriété intellectuelle" },
  { id: "obligations", title: "Obligations de l'utilisateur" },
  { id: "responsabilite", title: "Responsabilité" },
  { id: "donnees", title: "Données personnelles" },
  { id: "modification", title: "Modification des CGU" },
  { id: "droit", title: "Droit applicable & litiges" },
];

export default function CguPage() {
  return (
    <>
      <PageHero
        eyebrow="Conditions d'utilisation"
        title={
          <>
            Conditions Générales <GradientText>d'Utilisation</GradientText>
          </>
        }
        description="Les présentes conditions encadrent l'accès au site digitalaccess.ci et l'utilisation de ses services. Merci de les lire attentivement."
      />

      <Section spacing="lg">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
            <LegalTOC sections={sections} />

            <div>
              <p className="mb-12 inline-flex items-center gap-2 rounded-full border border-navy/[0.08] bg-surface-secondary px-4 py-1.5 text-xs font-medium text-text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-gradient-da" />
                En vigueur depuis le {LAST_UPDATE}
              </p>

              <div className="space-y-14">
                <LegalArticle index={1} id="objet" title="Objet">
                  <p>
                    Les présentes Conditions Générales d'Utilisation (ci-après
                    les «&nbsp;CGU&nbsp;») ont pour objet de définir les
                    modalités et conditions dans lesquelles Digital Access met à
                    disposition le site{" "}
                    <span className="font-semibold text-navy">
                      digitalaccess.ci
                    </span>{" "}
                    (ci-après le «&nbsp;Site&nbsp;») et les conditions
                    d'utilisation du Site par l'utilisateur (ci-après
                    l'«&nbsp;Utilisateur&nbsp;»).
                  </p>
                  <p>
                    Tout accès et/ou utilisation du Site suppose l'acceptation
                    sans réserve et le respect de l'ensemble des présentes CGU.
                    L'Utilisateur qui n'accepte pas ces conditions est invité à
                    ne pas utiliser le Site.
                  </p>
                </LegalArticle>

                <LegalArticle
                  index={2}
                  id="acces"
                  title="Accès au site et aux services"
                >
                  <p>
                    Le Site est accessible gratuitement à tout Utilisateur
                    disposant d'un accès à internet. Tous les coûts afférents à
                    l'accès (matériel, logiciels, connexion) sont à la charge de
                    l'Utilisateur.
                  </p>
                  <p>
                    Digital Access met en œuvre les moyens raisonnables pour
                    assurer un accès de qualité au Site, sans être tenu à une
                    obligation de résultat. L'accès peut être suspendu,
                    interrompu ou limité, notamment pour des raisons de
                    maintenance, de mise à jour ou en cas de force majeure, sans
                    que cela n'ouvre droit à une quelconque indemnité.
                  </p>
                  <p>
                    Certains services (demande de devis, espace client, accès à{" "}
                    <a
                      href={siteConfig.academyUrl}
                      className="text-brand-blue-royal hover:underline"
                    >
                      Access Academy
                    </a>
                    ) peuvent nécessiter la création d'un compte et sont soumis
                    à des conditions particulières.
                  </p>
                </LegalArticle>

                <LegalArticle index={3} id="compte" title="Compte utilisateur">
                  <p>
                    La création d'un compte requiert une adresse e-mail valide
                    et un mot de passe. L'e-mail doit être confirmé via le lien
                    envoyé lors de l'inscription pour accéder à l'ensemble des
                    fonctionnalités.
                  </p>
                  <p>
                    L'Utilisateur est seul responsable de la confidentialité de
                    ses identifiants et de toute activité effectuée depuis son
                    compte. Il s'engage à informer sans délai Digital Access de
                    toute utilisation non autorisée.
                  </p>
                  <p>
                    Digital Access se réserve le droit de suspendre ou de
                    supprimer tout compte en cas de manquement aux présentes CGU
                    ou d'utilisation frauduleuse.
                  </p>
                </LegalArticle>

                <LegalArticle
                  index={4}
                  id="propriete"
                  title="Propriété intellectuelle"
                >
                  <p>
                    L'ensemble des contenus présents sur le Site (textes,
                    graphismes, logo, dégradé signature, illustrations,
                    animations, code source, structure) est protégé par le droit
                    de la propriété intellectuelle et demeure la propriété
                    exclusive de Digital Access.
                  </p>
                  <p>
                    Toute reproduction, distribution, modification, adaptation ou
                    publication, même partielle, de ces éléments est interdite
                    sans l'accord écrit préalable de Digital Access, sous peine
                    de poursuites.
                  </p>
                </LegalArticle>

                <LegalArticle
                  index={5}
                  id="obligations"
                  title="Obligations de l'utilisateur"
                >
                  <p>L'Utilisateur s'engage à&nbsp;:</p>
                  <ul className="ml-1 list-disc space-y-2 pl-5 marker:text-brand-blue-vif">
                    <li>
                      utiliser le Site conformément à sa destination et dans le
                      respect des lois et règlements en vigueur&nbsp;;
                    </li>
                    <li>
                      fournir des informations exactes lors de ses demandes
                      (devis, contact, inscription)&nbsp;;
                    </li>
                    <li>
                      ne pas porter atteinte au bon fonctionnement du Site ni
                      tenter d'accéder à des espaces non autorisés&nbsp;;
                    </li>
                    <li>
                      ne pas diffuser de contenu illicite, diffamatoire, ou
                      contraire à l'ordre public via les formulaires ou espaces
                      d'échange.
                    </li>
                  </ul>
                </LegalArticle>

                <LegalArticle index={6} id="responsabilite" title="Responsabilité">
                  <p>
                    Digital Access ne saurait être tenu responsable des dommages
                    directs ou indirects résultant de l'utilisation du Site,
                    notamment de la perte de données, d'une interruption de
                    service ou de la présence de virus.
                  </p>
                  <p>
                    Les informations diffusées sur le Site sont fournies à titre
                    indicatif. Digital Access ne garantit pas leur exhaustivité
                    ni leur parfaite exactitude et se réserve le droit de les
                    modifier à tout moment.
                  </p>
                </LegalArticle>

                <LegalArticle index={7} id="donnees" title="Données personnelles">
                  <p>
                    Les données personnelles collectées dans le cadre de
                    l'utilisation du Site sont traitées conformément à notre{" "}
                    <Link
                      href="/confidentialite"
                      className="font-semibold text-brand-blue-royal hover:underline"
                    >
                      politique de confidentialité
                    </Link>
                    , qui fait partie intégrante des présentes CGU.
                  </p>
                </LegalArticle>

                <LegalArticle
                  index={8}
                  id="modification"
                  title="Modification des CGU"
                >
                  <p>
                    Digital Access se réserve le droit de modifier les présentes
                    CGU à tout moment afin de les adapter à l'évolution du Site,
                    des services ou de la réglementation. Les CGU applicables
                    sont celles en vigueur à la date de connexion de
                    l'Utilisateur.
                  </p>
                  <p>
                    Il est recommandé de consulter régulièrement cette page. La
                    date de dernière mise à jour figure en tête du document.
                  </p>
                </LegalArticle>

                <LegalArticle
                  index={9}
                  id="droit"
                  title="Droit applicable & litiges"
                >
                  <p>
                    Les présentes CGU sont régies par le droit ivoirien. En cas
                    de différend relatif à leur interprétation ou à leur
                    exécution, les parties s'efforceront de trouver une solution
                    amiable.
                  </p>
                  <p>
                    À défaut d'accord amiable, tout litige sera soumis aux
                    juridictions compétentes d'Abidjan, Côte d'Ivoire. Pour toute
                    question, contactez-nous à{" "}
                    <a
                      href={`mailto:${siteConfig.contact.email}`}
                      className="text-brand-blue-royal hover:underline"
                    >
                      {siteConfig.contact.email}
                    </a>
                    .
                  </p>
                </LegalArticle>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
