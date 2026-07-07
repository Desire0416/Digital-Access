import { blogPosts } from "@da/db";
import { renderOgImage, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og/og";

export const alt = "Article — Blog Digital Access";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return renderOgImage({
      eyebrow: "Blog",
      title: "Le blog Digital Access",
      footer: "digitalaccess.ci · Blog",
    });
  }

  return renderOgImage({
    eyebrow: post.category,
    title: post.title,
    description: post.excerpt,
    footer: "digitalaccess.ci · Blog",
    badge: `${post.readMinutes} min`,
  });
}
