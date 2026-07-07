"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Badge, Monogram } from "@da/ui";
import type { PortfolioItem } from "@da/db";

const covers = [
  "from-brand-violet to-brand-blue-royal",
  "from-brand-blue-royal to-brand-cyan",
  "from-accent to-brand-blue-vif",
  "from-brand-blue-vif to-brand-cyan",
  "from-primary to-brand-violet",
];

export function PortfolioCard({
  item,
  index = 0,
}: {
  item: PortfolioItem;
  index?: number;
}) {
  return (
    <Link href={`/portfolio/${item.slug}`} className="group block">
      <motion.article
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
        className="overflow-hidden rounded-xl border border-navy/[0.07] bg-surface-primary"
      >
        <div
          className={`relative aspect-[16/10] overflow-hidden ${
            item.coverImage
              ? "bg-navy"
              : `bg-gradient-to-br ${covers[index % covers.length]}`
          }`}
        >
          {item.coverImage ? (
            <>
              <Image
                src={item.coverImage}
                alt={`Aperçu du site ${item.client}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover object-top transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
              />
              {/* Voile dégradé pour la lisibilité du texte en bas */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/25 to-navy/5" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-grid opacity-20" />
              <Monogram
                variant="white"
                size={120}
                className="absolute -bottom-6 -right-4 opacity-15 transition-transform duration-500 group-hover:scale-110"
              />
            </>
          )}
          <div className="absolute left-4 top-4">
            <Badge className="bg-white/90 text-navy backdrop-blur">
              {item.category}
            </Badge>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-xs font-medium uppercase tracking-wide text-white/70">
              {item.client} · {item.year}
            </p>
            <h3 className="mt-1 font-display text-lg font-bold leading-tight text-white">
              {item.title}
            </h3>
          </div>
          <span className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100">
            <ArrowUpRight size={18} />
          </span>
        </div>

        <div className="p-5">
          <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary">
            {item.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {item.technologies.slice(0, 3).map((tech) => (
              <span
                key={tech}
                className="rounded-md bg-navy/[0.05] px-2 py-1 text-xs font-medium text-text-secondary"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
