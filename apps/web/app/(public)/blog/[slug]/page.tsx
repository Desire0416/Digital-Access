import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Section,
  Container,
  SectionHeading,
  GradientText,
  Badge,
  Divider,
  Reveal,
  StaggerGroup,
  StaggerItem,
  Monogram,
} from "@da/ui";
import { blogPosts } from "@da/db";
import { siteConfig } from "@/lib/site";
import { JsonLd } from "@/components/JsonLd";
import { CTABanner } from "@/components/CTABanner";
import { BlogCard } from "@/components/BlogCard";
import { ArticleHero } from "./ArticleHero";
import { ShareButtons } from "./ShareButtons";
import { buildArticleBody, contentToParagraphs } from "./articleBody";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: "Article introuvable",
      description: "Cet article n'existe pas ou a été déplacé.",
    };
  }

  return {
    title: `${post.title} — Blog Digital Access`,
    description: post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = blogPosts.findIndex((p) => p.slug === slug);
  const post = index >= 0 ? blogPosts[index] : undefined;

  if (!post) {
    notFound();
  }

  // Corps de l'article : contenu réel si présent, sinon généré depuis l'extrait.
  const realParagraphs = contentToParagraphs(post.content);
  const blocks = realParagraphs
    ? [{ heading: "", paragraphs: realParagraphs }]
    : buildArticleBody(post);

  // Articles similaires : même catégorie en priorité, complétés si besoin.
  const sameCategory = blogPosts.filter(
    (p) => p.slug !== post.slug && p.category === post.category,
  );
  const others = blogPosts.filter(
    (p) => p.slug !== post.slug && p.category !== post.category,
  );
  const related = [...sameCategory, ...others].slice(0, 3);

  const articleUrl = `${siteConfig.url}/blog/${post.slug}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { "@type": "Person", name: post.author.name },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: `${siteConfig.url}/icon.svg` },
    },
    keywords: post.tags.join(", "),
    articleSection: post.category,
    inLanguage: "fr-CI",
    url: articleUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
  };

  return (
    <>
      <JsonLd data={articleSchema} />
      <ArticleHero post={post} index={index} />

      {/* Corps de l'article + partage */}
      <Section spacing="md">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16">
            {/* Colonne article */}
            <article className="min-w-0">
              {/* Chapô */}
              <Reveal>
                <p className="border-l-2 border-brand-blue-vif/40 pl-5 font-display text-lg font-medium leading-relaxed text-navy/80">
                  {post.excerpt}
                </p>
              </Reveal>

              {/* Sections */}
              <div className="mt-10 space-y-10">
                {blocks.map((block, bi) => (
                  <Reveal key={bi} delay={0.05}>
                    <div>
                      {block.heading && (
                        <>
                          <h2 className="font-display text-2xl font-bold text-navy">
                            {block.heading}
                          </h2>
                          <Divider className="mt-4" />
                        </>
                      )}
                      <div className="mt-5 space-y-5">
                        {block.paragraphs.map((para, pi) => (
                          <p
                            key={pi}
                            className="text-[1.05rem] leading-[1.75] text-text-secondary"
                          >
                            {para}
                          </p>
                        ))}
                      </div>

                      {/* Citation signature au milieu de l'article */}
                      {bi === 1 && !realParagraphs && (
                        <div className="relative mt-8 overflow-hidden rounded-2xl bg-gradient-da px-7 py-8 sm:px-10">
                          <div
                            aria-hidden
                            className="absolute inset-0 bg-grid opacity-15"
                          />
                          <Monogram
                            variant="white"
                            size={140}
                            className="pointer-events-none absolute -bottom-8 -right-4 opacity-15"
                          />
                          <p className="relative font-display text-xl font-bold leading-snug text-white sm:text-2xl">
                            « Le meilleur outil numérique est celui que vos clients
                            utilisent sans y penser. »
                          </p>
                          <p className="relative mt-3 text-sm font-medium text-white/80">
                            — L'équipe Digital Access
                          </p>
                        </div>
                      )}
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <Reveal className="mt-12">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-secondary">
                    Mots-clés
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="soft">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </Reveal>
              )}

              {/* Partage (mobile / bas d'article) */}
              <div className="mt-10 border-t border-navy/[0.07] pt-8 lg:hidden">
                <ShareButtons slug={post.slug} title={post.title} />
              </div>

              {/* Bloc auteur */}
              <Reveal className="mt-10">
                <div className="flex items-center gap-4 rounded-2xl border border-navy/[0.07] bg-surface-secondary p-6">
                  <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-da text-lg font-bold text-white shadow-brand">
                    {post.author.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue-royal">
                      {post.author.role ?? "Auteur"}
                    </p>
                    <p className="font-display text-lg font-bold text-navy">
                      {post.author.name}
                    </p>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      Passionnés par le numérique accessible et utile pour les
                      entreprises ivoiriennes.
                    </p>
                  </div>
                </div>
              </Reveal>
            </article>

            {/* Colonne latérale : partage sticky (desktop) */}
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <ShareButtons slug={post.slug} title={post.title} />
                <div className="mt-8 rounded-2xl border border-navy/[0.07] bg-surface-secondary p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-blue-royal">
                    À retenir
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-relaxed text-text-secondary">
                    <li className="flex gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-da" />
                      Priorité au mobile et à la vitesse.
                    </li>
                    <li className="flex gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-da" />
                      Le Mobile Money lève le frein à l'achat.
                    </li>
                    <li className="flex gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-da" />
                      Commencer simple, améliorer en continu.
                    </li>
                  </ul>
                  <Link
                    href="/devis"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-gradient-da px-4 py-2.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5"
                  >
                    Demander un devis
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      {/* Articles similaires */}
      {related.length > 0 && (
        <Section tone="muted">
          <Container>
            <SectionHeading
              align="left"
              eyebrow="À lire aussi"
              title={
                <>
                  Articles <GradientText>similaires</GradientText>
                </>
              }
              subtitle="Poursuivez votre lecture avec ces publications sélectionnées pour vous."
              className="max-w-xl"
            />
            <StaggerGroup className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((rel, i) => (
                <StaggerItem key={rel.id}>
                  <BlogCard post={rel} index={i} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </Container>
        </Section>
      )}

      <CTABanner
        title="Envie d'aller plus loin ?"
        description="Mettons vos idées en mouvement. Recevez un devis gratuit et sans engagement sous 48h."
        secondary={{ label: "Lire d'autres articles", href: "/blog" }}
      />
    </>
  );
}
