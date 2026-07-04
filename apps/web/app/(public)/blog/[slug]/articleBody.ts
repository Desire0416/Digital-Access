import type { BlogPostPreview } from "@da/db";

export interface ArticleBlock {
  heading: string;
  paragraphs: string[];
}

/**
 * Génère un corps d'article réaliste et lisible en FR quand `post.content`
 * est vide (données de démo). Produit 4 sections avec sous-titres, chacune
 * amorcée par le contexte de l'article (titre, extrait, catégorie).
 */
export function buildArticleBody(post: BlogPostPreview): ArticleBlock[] {
  const topic = post.title.replace(/[:—].*$/, "").trim();
  const cat = post.category.toLowerCase();

  return [
    {
      heading: "Pourquoi ce sujet compte",
      paragraphs: [
        post.excerpt,
        `En Côte d'Ivoire, le numérique n'est plus une option réservée aux grandes entreprises. Qu'il s'agisse d'une boutique de quartier, d'un cabinet, d'une coopérative ou d'une institution, chacun peut désormais toucher plus de clients et travailler plus efficacement grâce aux bons outils. Encore faut-il partir sur des bases solides — c'est précisément l'objet de cet article.`,
        `Chez Digital Access, nous accompagnons chaque jour des porteurs de projets sur ces questions. Nous avons rassemblé ici l'essentiel de ce qu'il faut savoir, sans jargon inutile, pour vous aider à avancer avec confiance.`,
      ],
    },
    {
      heading: "Les points essentiels à retenir",
      paragraphs: [
        `Avant de vous lancer, prenez le temps de clarifier votre objectif. Cherchez-vous à gagner en visibilité, à vendre en ligne, à automatiser une partie de votre activité, ou simplement à rassurer vos prospects avec une présence professionnelle ? La réponse conditionne toutes les décisions suivantes, du choix des fonctionnalités au budget à prévoir.`,
        `Sur le thème « ${topic} », l'expérience mobile doit rester votre priorité absolue. La majorité de vos visiteurs navigueront depuis un smartphone, souvent en 3G ou 4G. Un site rapide, léger et parfaitement lisible sur petit écran fera toujours la différence face à une solution plus riche mais lente et confuse.`,
      ],
    },
    {
      heading: "Comment bien s'y prendre",
      paragraphs: [
        `Commencez petit, mais commencez bien. Il vaut mieux une page claire, rapide et à jour qu'un grand site négligé. Soignez vos textes, vos photos et surtout vos coordonnées : un numéro WhatsApp cliquable et un moyen de vous contacter en un clic valent parfois plus que dix pages de contenu.`,
        `Pensez aussi au paiement. Le Mobile Money (Orange Money, MTN, Wave) reste le mode de règlement dominant sur le marché ivoirien : intégrer ces solutions dès le départ, via des passerelles comme CinetPay ou FedaPay, lève un frein majeur à l'achat en ligne.`,
        `Enfin, ne négligez pas le suivi. Un site ou un outil numérique vit et évolue : mesurez ce qui fonctionne, ajustez régulièrement, et entourez-vous d'un partenaire capable d'assurer la maintenance dans la durée.`,
      ],
    },
    {
      heading: "Passer à l'action avec Digital Access",
      paragraphs: [
        `Que vous démarriez de zéro ou que vous souhaitiez faire évoluer un projet existant en ${cat}, notre équipe peut vous accompagner de la réflexion initiale jusqu'à la mise en ligne — et au-delà. Nous concevons des solutions sur-mesure, pensées pour votre marché et votre budget.`,
        `Vous avez une question précise ou un projet en tête ? Écrivez-nous : le premier échange et le devis sont gratuits et sans engagement. C'est souvent la meilleure façon de transformer une idée en résultats concrets.`,
      ],
    },
  ];
}

/**
 * Si `post.content` existe, le découpe en paragraphes exploitables.
 * Sinon, renvoie null pour laisser buildArticleBody prendre le relais.
 */
export function contentToParagraphs(content?: string): string[] | null {
  if (!content) return null;
  const parts = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : null;
}
