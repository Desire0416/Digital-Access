"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BellOff,
  CheckCheck,
  Compass,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { cn, formatDate, buttonClasses } from "@da/ui";
import type { NotificationItem } from "@/lib/notification-queries";
import {
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/notification-actions";
import { notifMeta } from "./notification-meta";

/* ══════════════════════════════════════════════════════════════════════════
   Liste des notifications — interactivité côté client.
   - clic sur un item : marque lu (optimiste) puis navigue si link.
   - suppression : action serveur + router.refresh() ; erreur inline.
   - « Tout marquer lu » : action serveur + refresh.
   ══════════════════════════════════════════════════════════════════════════ */

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function NotificationsClient({ items }: { items: NotificationItem[] }) {
  const router = useRouter();
  const [pendingAll, setPendingAll] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const hasUnread = items.some((n) => !n.read);

  async function handleOpen(n: NotificationItem) {
    if (!n.read) {
      // marquage « fire-and-forget » : on ne bloque pas la navigation
      void markNotificationRead(n.id);
    }
    if (n.link) {
      router.push(n.link);
    } else if (!n.read) {
      router.refresh();
    }
  }

  async function handleMarkAll() {
    setError(null);
    setPendingAll(true);
    const res = await markAllNotificationsRead();
    setPendingAll(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    setError(null);
    setDeletingId(id);
    const res = await deleteNotification(id);
    if (!res.ok) {
      setDeletingId(null);
      setError(res.error);
      return;
    }
    // le refresh retirera l'item ; on garde deletingId pour l'anim de sortie
    router.refresh();
    setDeletingId(null);
  }

  /* ── État vide brandé ──────────────────────────────────────────────────── */
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-navy/15 bg-surface-primary px-6 py-14 text-center sm:px-10"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -top-20 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-gradient-da opacity-10 blur-3xl"
        />
        <div className="relative">
          <span
            aria-hidden
            className="absolute inset-0 scale-150 rounded-full bg-gradient-da opacity-15 blur-2xl"
          />
          <span className="relative grid h-16 w-16 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
            <BellOff size={30} aria-hidden />
          </span>
        </div>
        <h3 className="mt-6 font-display text-xl font-bold text-navy">
          Aucune notification pour le moment
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-text-secondary">
          Inscrivez-vous à un cours et progressez : vos jalons, certificats et
          réponses du forum s&apos;afficheront ici.
        </p>
        <a
          href="/courses"
          className={buttonClasses({
            variant: "primary",
            size: "md",
            className: "mt-6",
          })}
        >
          <Compass size={17} aria-hidden />
          Explorer le catalogue
        </a>
      </motion.div>
    );
  }

  return (
    <div>
      {/* Barre d'action + erreur */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <AnimatePresence mode="wait" initial={false}>
          {error ? (
            <motion.p
              key="err"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-error"
            >
              <AlertCircle size={15} aria-hidden />
              {error}
            </motion.p>
          ) : (
            <span key="ph" />
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={handleMarkAll}
          disabled={!hasUnread || pendingAll}
          whileHover={hasUnread ? { y: -1 } : undefined}
          whileTap={hasUnread ? { scale: 0.97 } : undefined}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={cn(
            "ml-auto inline-flex h-9 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition-colors",
            hasUnread
              ? "border-brand-violet/25 text-brand-violet hover:border-brand-violet/50 hover:bg-brand-violet/[0.05]"
              : "cursor-not-allowed border-navy/10 text-text-muted",
          )}
        >
          {pendingAll ? (
            <Loader2 size={15} className="animate-spin" aria-hidden />
          ) : (
            <CheckCheck size={15} aria-hidden />
          )}
          Tout marquer lu
        </motion.button>
      </div>

      {/* Liste */}
      <motion.ul
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="space-y-2.5"
      >
        <AnimatePresence initial={false}>
          {items.map((n) => {
            const meta = notifMeta(n.type);
            const Icon = meta.Icon;
            const isDeleting = deletingId === n.id;
            const clickable = Boolean(n.link);

            return (
              <motion.li
                key={n.id}
                layout
                variants={itemVariants}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-surface-primary transition-colors",
                  n.read
                    ? "border-navy/[0.08]"
                    : "border-brand-violet/20 bg-brand-violet/[0.015]",
                )}
              >
                {/* liseré dégradé pour les non-lus */}
                {!n.read && (
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-1 bg-gradient-da"
                  />
                )}

                <div className="flex items-start gap-3 p-4 pl-5 sm:gap-4 sm:p-5 sm:pl-6">
                  {/* Icône tonale */}
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                      meta.tone,
                    )}
                  >
                    <Icon size={18} aria-hidden />
                  </span>

                  {/* Contenu — bouton si cliquable, sinon div */}
                  <button
                    type="button"
                    onClick={() => handleOpen(n)}
                    className={cn(
                      "min-w-0 flex-1 text-left",
                      clickable && "cursor-pointer",
                    )}
                    aria-label={
                      clickable
                        ? `${n.title} — ouvrir`
                        : n.title
                    }
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-text-muted">
                        {meta.label}
                      </span>
                      {!n.read && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand-violet/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-brand-violet">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-violet" />
                          Nouveau
                        </span>
                      )}
                    </div>
                    <h3
                      className={cn(
                        "mt-1 truncate font-display text-[0.95rem] font-bold tracking-tight text-navy",
                        clickable &&
                          "transition-colors group-hover:text-brand-violet",
                      )}
                    >
                      {n.title}
                    </h3>
                    <p className="mt-0.5 text-sm leading-relaxed text-text-secondary line-clamp-2">
                      {n.message}
                    </p>
                    <time className="mt-2 block text-xs font-medium text-text-muted">
                      {formatDate(n.createdAt)}
                    </time>
                  </button>

                  {/* Supprimer */}
                  <motion.button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    disabled={isDeleting}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    aria-label="Supprimer cette notification"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/40"
                  >
                    {isDeleting ? (
                      <Loader2 size={16} className="animate-spin" aria-hidden />
                    ) : (
                      <Trash2 size={16} aria-hidden />
                    )}
                  </motion.button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
