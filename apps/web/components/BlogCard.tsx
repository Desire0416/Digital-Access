"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import { Badge, Monogram, formatDate } from "@da/ui";
import type { BlogPostPreview } from "@da/db";

const covers = [
  "from-brand-violet to-brand-blue-royal",
  "from-brand-blue-royal to-brand-cyan",
  "from-accent to-brand-blue-vif",
  "from-brand-blue-vif to-brand-cyan",
];

export function BlogCard({
  post,
  index = 0,
}: {
  post: BlogPostPreview;
  index?: number;
}) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="flex h-full flex-col overflow-hidden rounded-xl border border-navy/[0.07] bg-surface-primary"
      >
        <div
          className={`relative aspect-[16/9] overflow-hidden bg-gradient-to-br ${covers[index % covers.length]}`}
        >
          <div className="absolute inset-0 bg-grid opacity-20" />
          <Monogram variant="white" size={80} className="absolute -bottom-3 -right-1 opacity-15" />
          <Badge className="absolute left-4 top-4 bg-white/90 text-navy backdrop-blur">
            {post.category}
          </Badge>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center gap-3 text-xs text-text-muted">
            <span>{formatDate(post.publishedAt)}</span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {post.readMinutes} min
            </span>
          </div>
          <h3 className="mt-2 line-clamp-2 font-display text-lg font-bold leading-snug text-navy transition-colors group-hover:text-brand-blue-royal">
            {post.title}
          </h3>
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-text-secondary">
            {post.excerpt}
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-royal">
            Lire l'article
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </motion.article>
    </Link>
  );
}
