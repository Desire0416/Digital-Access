"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";
import { Badge, Container, Monogram, cn, formatDate } from "@da/ui";
import type { BlogPostPreview } from "@da/db";

const covers = [
  "from-brand-violet to-brand-blue-royal",
  "from-brand-blue-royal to-brand-cyan",
  "from-accent to-brand-blue-vif",
  "from-brand-blue-vif to-brand-cyan",
];

/** En-tête immersif de l'article : retour, couverture dégradé, titre & méta. */
export function ArticleHero({
  post,
  index = 0,
}: {
  post: BlogPostPreview;
  index?: number;
}) {
  const initials = post.author.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <section className="relative isolate overflow-hidden pb-2 pt-24 sm:pt-28">
      <Container>
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal"
          >
            <ArrowLeft
              size={16}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Tous les articles
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br px-7 py-12 sm:px-12 sm:py-16",
            covers[index % covers.length],
          )}
        >
          <div aria-hidden className="absolute inset-0 bg-grid opacity-20" />
          <Monogram
            variant="white"
            size={280}
            className="pointer-events-none absolute -bottom-16 -right-10 opacity-[0.12]"
          />
          <Monogram
            variant="white"
            size={160}
            className="pointer-events-none absolute -left-8 -top-10 opacity-[0.08]"
          />

          <div className="relative max-w-3xl">
            <Badge className="bg-white/95 text-navy shadow-sm backdrop-blur">
              {post.category}
            </Badge>
            <h1 className="mt-5 font-display text-3xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
              {post.title}
            </h1>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-white/85">
              <span className="inline-flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white backdrop-blur">
                  {initials}
                </span>
                {post.author.name}
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} className="text-white/70" />
                {formatDate(post.publishedAt)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock size={16} className="text-white/70" />
                {post.readMinutes} min de lecture
              </span>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
