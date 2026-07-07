import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/og";

export const alt = "Digital Access — Agence web & e-learning en Côte d'Ivoire";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Agence digitale · Côte d'Ivoire",
    title: "Sites web, e-commerce & plateformes e-learning sur-mesure",
    description:
      "Digital Access conçoit des expériences numériques élégantes, pensées pour le marché ivoirien — paiement Mobile Money et accompagnement local.",
    footer: "digitalaccess.ci",
  });
}
