"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Star,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@da/ui";
import {
  toggleTestimonialFeatured,
  deleteTestimonial,
} from "@/lib/admin-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Carte témoignage du back-office — auteur, note, extrait, badge « À la une ».
   Actions : Modifier (lien vers l'édition), basculer « à la une » (toggle),
   Supprimer (confirmation inline en deux temps). Actions serveur → {ok,error}.
   ══════════════════════════════════════════════════════════════════════════ */

export type TestimonialCardData = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  content: string;
  avatar: string | null;
  rating: number;
  featured: boolean;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function TestimonialCard({ item }: { item: TestimonialCardData }) {
  const router = useRouter();
  const [pendingFeature, startFeature] = React.useTransition();
  const [pendingDelete, startDelete] = React.useTransition();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const subtitle = [item.role, item.company].filter(Boolean).join(" · ");
  const busy = pendingFeature || pendingDelete;

  const toggleFeatured = () => {
    setError(null);
    startFeature(async () => {
      const res = await toggleTestimonialFeatured({ id: item.id, featured: !item.featured });
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const remove = () => {
    setError(null);
    startDelete(async () => {
      const res = await deleteTestimonial({ id: item.id });
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
        setConfirmDelete(false);
      }
    });
  };

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-violet/25 hover:shadow-xl">
      <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-da transition-transform duration-300 group-hover:scale-x-100" />

      {/* En-tête : auteur + badge à la une */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {item.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.avatar}
              alt={item.name}
              className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-da font-display text-sm font-extrabold text-white">
              {initials(item.name)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-base font-bold leading-snug text-navy">
              {item.name}
            </p>
            {subtitle && (
              <p className="truncate text-xs text-text-secondary">{subtitle}</p>
            )}
          </div>
        </div>

        {item.featured && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning/15 px-2 py-1 text-[11px] font-semibold text-[#B45309]">
            <Star className="h-3 w-3 fill-current" />
            À la une
          </span>
        )}
      </div>

      {/* Note */}
      <div className="mt-3 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < item.rating ? "fill-warning text-warning" : "text-navy/15",
            )}
          />
        ))}
      </div>

      {/* Extrait */}
      <blockquote className="mt-3 line-clamp-4 text-sm leading-relaxed text-text-secondary">
        “{item.content}”
      </blockquote>

      {/* Actions */}
      <div className="mt-auto pt-5">
        <AnimatePresence mode="wait" initial={false}>
          {confirmDelete ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <p className="flex items-center gap-1.5 text-sm font-semibold text-navy">
                <AlertTriangle className="h-4 w-4 shrink-0 text-error" />
                Supprimer ce témoignage&nbsp;?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={remove}
                  disabled={pendingDelete}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-error px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {pendingDelete ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Supprimer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={pendingDelete}
                  className="rounded-lg border border-navy/[0.12] px-3 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/[0.04] disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap items-center gap-2"
            >
              <Link
                href={`/admin/temoignages/${item.id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-navy/[0.1] bg-surface-primary px-3 py-2 text-sm font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal"
              >
                <Pencil className="h-4 w-4" />
                Modifier
              </Link>

              <button
                type="button"
                onClick={toggleFeatured}
                disabled={busy}
                aria-pressed={item.featured}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50",
                  item.featured
                    ? "border-warning/30 bg-warning/10 text-[#B45309] hover:bg-warning/15"
                    : "border-navy/[0.1] bg-surface-primary text-text-secondary hover:border-brand-violet/30 hover:text-brand-violet",
                )}
              >
                {pendingFeature ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Star className={cn("h-4 w-4", item.featured && "fill-current")} />
                )}
                {item.featured ? "Retirer de la une" : "Mettre à la une"}
              </button>

              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                aria-label="Supprimer le témoignage"
                className="ml-auto inline-flex items-center justify-center rounded-lg border border-error/25 bg-surface-primary p-2 text-error transition-colors hover:bg-error/[0.06] disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2.5 flex items-start gap-1.5 text-xs font-medium text-error"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
