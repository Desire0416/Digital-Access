"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  CreditCard,
  Award,
  FolderKanban,
  ClipboardCheck,
  BookOpen,
  Route,
  CheckCheck,
} from "lucide-react";
import { cn } from "@da/ui";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/notify-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Cloche de notifications (cahier §26) — UI cliente. Le backend fournit les
   items en PROP depuis le layout serveur : aucun fetch client au montage.
   Le pattern dropdown (ouverture/fermeture clic-extérieur+Échap, anims
   AnimatePresence) copie celui du UserMenu de SiteHeader.tsx.
   ══════════════════════════════════════════════════════════════════════════ */

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  readAt: string | Date | null;
  createdAt: string | Date;
}

export interface NotificationBellProps {
  initialItems: NotificationItem[];
  initialUnread: number;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  SYSTEM: Bell,
  PAYMENT: CreditCard,
  CERTIFICATE: Award,
  PROJECT: FolderKanban,
  ASSESSMENT: ClipboardCheck,
  ENROLLMENT: BookOpen,
  PATH: Route,
};

/* Heure relative en français, sans dépendance externe. */
function relativeTime(value: string | Date): string {
  const then = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - then.getTime();
  const sec = Math.max(0, Math.floor(diff / 1000));
  if (sec < 60) return "à l'instant";
  const min = Math.floor(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `il y a ${hrs} h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `il y a ${days} j`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `il y a ${weeks} sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(days / 365);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
}

export function NotificationBell({ initialItems, initialUnread }: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<NotificationItem[]>(initialItems);
  const [readDelta, setReadDelta] = React.useState(0);
  const [allRead, setAllRead] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Le badge reflète le VRAI total de non-lus (initialUnread), pas seulement la
  // fenêtre chargée (8 items) : on décompte les lectures optimistes de la
  // session, puis on se réaligne sur le serveur dès qu'il re-fournit les props
  // (router.refresh() / navigation) — évite le double-décompte.
  React.useEffect(() => {
    setItems(initialItems);
    setReadDelta(0);
    setAllRead(false);
  }, [initialItems, initialUnread]);

  const displayCount = allRead ? 0 : Math.max(0, initialUnread - readDelta);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleItemClick(item: NotificationItem) {
    if (!item.readAt) {
      // Optimiste : marque lu localement immédiatement.
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date() } : n)),
      );
      setReadDelta((d) => d + 1);
      await markNotificationRead(item.id);
      router.refresh();
    }
    setOpen(false);
    if (item.link) router.push(item.link);
  }

  async function handleMarkAll() {
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date() })));
    setAllRead(true);
    await markAllNotificationsRead();
    router.refresh();
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={
          displayCount > 0 ? `Notifications, ${displayCount} non lues` : "Notifications"
        }
        className="relative grid h-10 w-10 place-items-center rounded-full text-text-secondary transition-colors hover:bg-navy/[0.05] hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif"
      >
        <Bell size={18} />
        {displayCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-gradient-da px-1 text-[10px] font-bold leading-none text-white shadow-sm"
            aria-hidden
          >
            {displayCount > 9 ? "9+" : displayCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-[22rem] origin-top-right overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-navy/[0.06] bg-surface-secondary/60 px-4 py-3">
              <div>
                <p className="font-display text-sm font-bold text-navy">Notifications</p>
                <span className="mt-0.5 block h-0.5 w-8 rounded-full bg-gradient-da" aria-hidden />
              </div>
              {displayCount > 0 && (
                <button
                  type="button"
                  onClick={() => void handleMarkAll()}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-brand-blue-royal transition-colors hover:bg-brand-blue-vif/[0.08]"
                >
                  <CheckCheck size={13} aria-hidden />
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className="max-h-[22rem] overflow-y-auto p-1.5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-navy/[0.04]">
                    <Bell size={20} className="text-text-muted" aria-hidden />
                  </span>
                  <p className="text-sm font-medium text-text-secondary">Aucune notification</p>
                </div>
              ) : (
                items.map((item) => {
                  const Icon = TYPE_ICONS[item.type] ?? Bell;
                  const unread = !item.readAt;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      onClick={() => void handleItemClick(item)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        unread
                          ? "bg-brand-blue-vif/[0.05] hover:bg-brand-blue-vif/[0.09]"
                          : "hover:bg-navy/[0.04]",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                          unread ? "bg-gradient-da text-white" : "bg-navy/[0.05] text-text-muted",
                        )}
                        aria-hidden
                      >
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate font-display text-[0.82rem] font-semibold text-navy">
                            {item.title}
                          </span>
                          {unread && (
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-da"
                              aria-hidden
                            />
                          )}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-text-secondary">
                          {item.message}
                        </span>
                        <span className="mt-1 block text-[11px] font-medium text-text-muted">
                          {relativeTime(item.createdAt)}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-navy/[0.06] p-1.5">
              <Link
                href="/espace"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-center text-sm font-medium text-brand-blue-royal transition-colors hover:bg-brand-blue-vif/[0.07]"
              >
                Voir tout
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default NotificationBell;
