"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2 } from "lucide-react";
import { CourseCard, CareerPathCard, type CourseCardData, type CareerPathCardData } from "@/components/cards";
import { toggleFavorite } from "@/lib/learn-actions";

/* Grille de favoris (§16.8) — retrait optimiste via toggleFavorite. */

export interface FavoriteEntry {
  id: string;
  kind: "course" | "path";
  courseId?: string;
  careerPathId?: string;
  course?: CourseCardData;
  path?: CareerPathCardData;
}

export function FavoritesGrid({ initial }: { initial: FavoriteEntry[] }) {
  const [items, setItems] = React.useState(initial);
  const [pending, setPending] = React.useState<string | null>(null);

  async function remove(entry: FavoriteEntry) {
    setPending(entry.id);
    const res = await toggleFavorite(
      entry.kind === "course" ? { courseId: entry.courseId } : { careerPathId: entry.careerPathId },
    );
    setPending(null);
    if (res.ok && !res.favorited) {
      setItems((prev) => prev.filter((i) => i.id !== entry.id));
    }
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {items.map((entry) => (
          <motion.div
            key={entry.id}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.25 }}
            className="relative"
          >
            {/* Bouton retrait — au-dessus de l'overlay cliquable de la carte */}
            <button
              type="button"
              onClick={() => void remove(entry)}
              disabled={pending === entry.id}
              aria-label="Retirer des favoris"
              className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-error shadow-md backdrop-blur-sm transition-transform hover:scale-110 active:scale-90 disabled:opacity-60"
            >
              {pending === entry.id ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Heart size={16} className="fill-error" />
              )}
            </button>

            {entry.kind === "course" && entry.course ? (
              <CourseCard course={entry.course} />
            ) : entry.path ? (
              <CareerPathCard path={entry.path} />
            ) : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
