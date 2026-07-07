import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/og";

export const alt = "Access Academy — Apprenez les métiers du numérique";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Access Academy · E-learning",
    title: "Apprenez les métiers du numérique, à votre rythme",
    description:
      "Formations 100 % en ligne par des mentors ivoiriens — vidéos, quiz interactifs, certificats vérifiables et paiement Mobile Money.",
    footer: "academy.digitalaccess.ci",
  });
}
