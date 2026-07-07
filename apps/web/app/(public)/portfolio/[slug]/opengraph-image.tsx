import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/og";
import { getPublicPortfolioItem } from "@/lib/public-portfolio";

export const alt = "Réalisation — Digital Access";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getPublicPortfolioItem(slug);

  if (!item) {
    return renderOgImage({
      eyebrow: "Réalisation",
      title: "Nos réalisations",
      footer: "digitalaccess.ci · Réalisations",
    });
  }

  return renderOgImage({
    eyebrow: item.category,
    title: item.title,
    description: item.description,
    footer: "digitalaccess.ci · Réalisation",
    badge: String(item.year),
  });
}
