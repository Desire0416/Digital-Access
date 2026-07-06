"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  GraduationCap,
  TrendingUp,
  Award,
  BadgeCheck,
  MessageSquare,
  AtSign,
  Flame,
  CheckCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@da/ui";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notification-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Cloche de notifications — pour la barre d'en-tête Academy.
   Fetch autonome (/api/notifications), panneau ancré, dégradé signature DA.
   ══════════════════════════════════════════════════════════════════════════ */

type Tone = "violet" | "cyan" | "green" | "blue" | "amber" | "slate";

type NotifDTO = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string; // ISO
};

const TYPE_META: Record<
  string,
  { label: string; Icon: LucideIcon; tone: Tone }
> = {
  COURSE_ENROLLED: { label: "Inscription", Icon: GraduationCap, tone: "blue" },
  PROGRESS_MILESTONE: { label: "Progression", Icon: TrendingUp, tone: "cyan" },
  CERTIFICATE_ISSUED: { label: "Certificat", Icon: Award, tone: "violet" },
  PAYMENT_CONFIRMED: { label: "Paiement", Icon: BadgeCheck, tone: "green" },
  FORUM_REPLY: { label: "Forum", Icon: MessageSquare, tone: "blue" },
  CHAT_MENTION: { label: "Mention", Icon: AtSign, tone: "cyan" },
  STREAK_REMINDER: { label: "Série", Icon: Flame, tone: "amber" },
  SYSTEM: { label: "Système", Icon: Bell, tone: "slate" },
};

const TONE_CLASSES: Record<Tone, string> = {
  violet: "text-brand-violet bg-brand-violet/10",
  cyan: "text-[#0891a6] bg-brand-cyan/15",
  green: "text-success bg-success/10",
  blue: "text-brand-blue-royal bg-brand-blue-royal/10",
  amber: "text-[#B45309] bg-warning/15",
  slate: "text-text-secondary bg-navy/[0.06]",
};

function metaFor(type: string) {
  return TYPE_META[type] ?? TYPE_META.SYSTEM;
}

/** Date relative courte en français, ex. « à l'instant », « il y a 3 h ». */
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 45) return "à l'instant";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `il y a ${weeks} sem`;
  const months = Math.round(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.round(days / 365);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotifDTO[]>([]);
  const [unread, setUnread] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const refetch = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications?: NotifDTO[];
        unread?: number;
      };
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
      setUnread(typeof data.unread === "number" ? data.unread : 0);
    } catch {
      // Réseau instable (3G/4G) — on garde l'état précédent silencieusement.
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial + rafraîchissement périodique (45 s).
  React.useEffect(() => {
    void refetch();
    const id = window.setInterval(() => void refetch(), 45_000);
    return () => window.clearInterval(id);
  }, [refetch]);

  // Re-fetch à chaque ouverture pour un compte à jour.
  React.useEffect(() => {
    if (open) void refetch();
  }, [open, refetch]);

  // Fermeture au clic extérieur + touche Échap.
  React.useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleMarkAll() {
    // Optimiste : on éteint la pastille immédiatement.
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    const res = await markAllNotificationsRead();
    if (!res.ok) await refetch();
    else await refetch();
  }

  async function handleItemClick(n: NotifDTO) {
    if (!n.read) {
      setItems((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
      );
      setUnread((c) => Math.max(0, c - 1));
      await markNotificationRead(n.id);
    }
    if (n.link) {
      setOpen(false);
      router.push(n.link);
    }
  }

  const badge = unread > 9 ? "9+" : String(unread);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        className={cn(
          "relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-navy transition-colors",
          open ? "bg-navy/5" : "hover:bg-navy/5",
        )}
      >
        <Bell size={21} />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="notif-badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 480, damping: 24 }}
              className="absolute -right-0.5 -top-0.5 inline-flex min-w-[1.15rem] items-center justify-center rounded-full bg-gradient-da px-1 text-[0.6875rem] font-bold leading-none text-white shadow-sm ring-2 ring-surface-primary"
              style={{ height: "1.15rem" }}
            >
              {badge}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="notif-panel"
            role="dialog"
            aria-label="Panneau des notifications"
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "top right", width: "min(360px, calc(100vw - 2rem))" }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary shadow-2xl"
          >
            {/* En-tête */}
            <div className="flex items-center justify-between gap-2 border-b border-navy/[0.06] px-4 py-3">
              <p className="text-sm font-semibold text-navy">Notifications</p>
              {items.some((n) => !n.read) && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-brand-blue-royal transition-colors hover:bg-brand-blue-royal/5"
                >
                  <CheckCheck size={13} />
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* Liste */}
            <div className="max-h-[420px] overflow-y-auto overscroll-contain">
              {loading && items.length === 0 ? (
                <ul className="divide-y divide-navy/[0.05]">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="flex gap-3 px-4 py-3">
                      <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-navy/[0.06]" />
                      <div className="flex-1 space-y-2 py-0.5">
                        <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-navy/[0.06]" />
                        <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-navy/[0.05]" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-navy/[0.05] text-text-muted">
                    <Bell size={20} />
                  </span>
                  <p className="text-sm font-medium text-navy">Aucune notification</p>
                  <p className="text-xs text-text-secondary">
                    Vos activités apparaîtront ici.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-navy/[0.05]">
                  {items.map((n) => {
                    const { label, Icon, tone } = metaFor(n.type);
                    const Wrapper: React.ElementType = n.link ? "button" : "div";
                    return (
                      <li key={n.id}>
                        <motion.div
                          whileHover={{ backgroundColor: "rgba(26,26,46,0.03)" }}
                          transition={{ duration: 0.12 }}
                        >
                          <Wrapper
                            {...(n.link
                              ? {
                                  type: "button",
                                  onClick: () => void handleItemClick(n),
                                }
                              : { onClick: () => void handleItemClick(n) })}
                            className={cn(
                              "flex w-full gap-3 px-4 py-3 text-left transition-colors",
                              n.link && "cursor-pointer",
                              !n.read && "bg-brand-blue-vif/[0.045]",
                            )}
                          >
                            <span
                              className={cn(
                                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                                TONE_CLASSES[tone],
                              )}
                            >
                              <Icon size={17} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="min-w-0 flex-1 truncate text-sm font-medium text-navy">
                                  {n.title}
                                </p>
                                {!n.read && (
                                  <span
                                    aria-hidden
                                    className="h-2 w-2 shrink-0 rounded-full bg-gradient-da"
                                  />
                                )}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-text-secondary">
                                {n.message}
                              </p>
                              <p className="mt-1 text-[0.6875rem] font-medium uppercase tracking-wide text-text-muted">
                                {label} · {timeAgo(n.createdAt)}
                              </p>
                            </div>
                          </Wrapper>
                        </motion.div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Pied */}
            <div className="border-t border-navy/[0.06] bg-surface-secondary/60 px-4 py-2.5">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block rounded-md py-1 text-center text-xs font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
              >
                Voir toutes les notifications
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
