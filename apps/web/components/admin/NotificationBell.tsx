"use client";

import * as React from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { cn } from "@da/ui";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/crm-notification-actions";
import type { NotificationItem } from "@/lib/crm-types";

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(0, Math.round((now - then) / 1000));
  if (s < 60) return "à l'instant";
  const m = Math.round(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return `il y a ${d} j`;
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [, start] = React.useTransition();
  React.useEffect(() => setMounted(true), []);

  const onOpenItem = (n: NotificationItem) => {
    if (!n.read) start(async () => { await markNotificationRead({ id: n.id }); router.refresh(); });
  };
  const markAll = () => start(async () => { await markAllNotificationsRead(); router.refresh(); });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
        className="relative grid h-10 w-10 place-items-center rounded-lg text-navy transition-colors hover:bg-navy/[0.06]"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-gradient-da px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <button
                  type="button"
                  aria-label="Fermer"
                  tabIndex={-1}
                  onClick={() => setOpen(false)}
                  className="fixed inset-0 z-[190]"
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  className="fixed right-3 top-16 z-[200] flex max-h-[70dvh] w-[min(92vw,22rem)] flex-col overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary shadow-2xl sm:right-6"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-navy/[0.06] px-4 py-3">
                    <h3 className="font-display text-sm font-bold text-navy">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAll}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
                      >
                        <CheckCheck size={14} /> Tout marquer comme lu
                      </button>
                    )}
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-navy/[0.05] text-text-muted">
                          <Inbox size={20} />
                        </span>
                        <p className="text-sm font-medium text-text-secondary">Aucune notification</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-navy/[0.05]">
                        {notifications.map((n) => {
                          const body = (
                            <div className={cn("flex gap-3 px-4 py-3 transition-colors hover:bg-navy/[0.03]", !n.read && "bg-brand-blue-vif/[0.04]")}>
                              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-gradient-da")} />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-navy">{n.title}</p>
                                <p className="mt-0.5 text-sm text-text-secondary">{n.message}</p>
                                <p className="mt-1 text-xs text-text-muted">{timeAgo(n.createdAt)}</p>
                              </div>
                            </div>
                          );
                          return (
                            <li key={n.id}>
                              {n.link ? (
                                <Link href={n.link} onClick={() => { onOpenItem(n); setOpen(false); }} className="block">
                                  {body}
                                </Link>
                              ) : (
                                <button type="button" onClick={() => onOpenItem(n)} className="block w-full text-left">
                                  {body}
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
