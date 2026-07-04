"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import { Badge, Monogram, cn, formatDate } from "@da/ui";
import type { BlogPostPreview } from "@da/db";
import { BlogCard } from "@/components/BlogCard";

const covers = [
  "from-brand-violet to-brand-blue-royal",
  "from-brand-blue-royal to-brand-cyan",
  "from-accent to-brand-blue-vif",
  "from-brand-blue-vif to-brand-cyan",
];

/**
 * Grille du blog avec filtres de catégories animés.
 * Le premier article (vedette) reste hors-filtre : il est affiché au-dessus
 * en grande carte horizontale par la page. Ici, on gère le reste + le filtrage.
 */
export function BlogList({ posts }: { posts: BlogPostPreview[] }) {
  const categories = React.useMemo(() => {
    const set = new Set(posts.map((p) => p.category));
    return ["Tous", ...Array.from(set)];
  }, [posts]);

  const [active, setActive] = React.useState("Tous");

  const filtered = React.useMemo(
    () => (active === "Tous" ? posts : posts.filter((p) => p.category === active)),
    [active, posts],
  );

  return (
    <div>
      {/* Filtres catégories */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {categories.map((cat) => {
          const isActive = cat === active;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActive(cat)}
              className={cn(
                "relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200",
                isActive
                  ? "text-white"
                  : "text-text-secondary hover:text-brand-blue-royal",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="blog-filter-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-da shadow-brand"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              {!isActive && (
                <span className="absolute inset-0 -z-10 rounded-full border border-navy/[0.08] bg-surface-primary" />
              )}
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grille filtrée */}
      <motion.div layout className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((post, i) => (
            <motion.div
              key={post.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            >
              <BlogCard post={post} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtered.length === 0 && (
        <p className="mt-16 text-center text-text-secondary">
          Aucun article dans cette catégorie pour l'instant.
        </p>
      )}
    </div>
  );
}

/**
 * Article vedette : grande carte horizontale immersive.
 * Couverture en dégradé à gauche, contenu à droite.
 */
export function FeaturedPost({ post, index = 0 }: { post: BlogPostPreview; index?: number }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -4 }}
        className="grid overflow-hidden rounded-3xl border border-navy/[0.07] bg-surface-primary transition-shadow hover:shadow-xl lg:grid-cols-2"
      >
        {/* Couverture dégradé */}
        <div
          className={cn(
            "relative min-h-[260px] overflow-hidden bg-gradient-to-br lg:min-h-[380px]",
            covers[index % covers.length],
          )}
        >
          <div aria-hidden className="absolute inset-0 bg-grid opacity-20" />
          <Monogram
            variant="white"
            size={240}
            className="pointer-events-none absolute -bottom-12 -right-8 opacity-[0.14] transition-transform duration-500 group-hover:scale-110"
          />
          <Monogram
            variant="white"
            size={130}
            className="pointer-events-none absolute -left-6 -top-6 opacity-[0.08]"
          />
          <div className="absolute left-6 top-6 flex flex-wrap gap-2">
            <Badge className="bg-white/95 text-navy shadow-sm backdrop-blur">
              À la une
            </Badge>
            <Badge className="bg-white/25 text-white backdrop-blur">
              {post.category}
            </Badge>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
          <div className="flex items-center gap-3 text-xs font-medium text-text-muted">
            <span>{formatDate(post.publishedAt)}</span>
            <span className="h-1 w-1 rounded-full bg-text-muted/50" />
            <span className="inline-flex items-center gap-1">
              <Clock size={13} /> {post.readMinutes} min de lecture
            </span>
          </div>
          <h2 className="mt-4 font-display text-2xl font-extrabold leading-tight text-navy transition-colors group-hover:text-brand-blue-royal sm:text-3xl">
            {post.title}
          </h2>
          <p className="mt-4 leading-relaxed text-text-secondary">{post.excerpt}</p>
          <div className="mt-7 flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-da text-sm font-bold text-white shadow-brand">
              {post.author.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div className="text-sm">
              <p className="font-semibold text-navy">{post.author.name}</p>
              {post.author.role && (
                <p className="text-text-muted">{post.author.role}</p>
              )}
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-royal">
              Lire
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
