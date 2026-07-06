"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  MoreHorizontal,
  Pencil,
  Printer,
  Trash2,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Check,
} from "lucide-react";
import { cn } from "@da/ui";
import { INVOICE_STATUS, toneColor } from "@/components/admin/ui";
import { updateInvoiceStatus, deleteInvoice } from "@/lib/admin-actions";
import type { InvoiceStatus } from "@/lib/admin-queries";

/* ══════════════════════════════════════════════════════════════════════════
   Menu d'actions par ligne de facture — rendu en PORTAIL (jamais clippé par le
   tableau en overflow) : Éditer, Voir / Imprimer PDF, Changer le statut,
   Supprimer (confirmation inline). Les actions serveur renvoient {ok,error}.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUSES: InvoiceStatus[] = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];

export function InvoiceRowActions({
  id,
  number,
  status,
  align = "end",
}: {
  id: string;
  number: string;
  status: InvoiceStatus;
  /** Alignement horizontal du menu par rapport au déclencheur. */
  align?: "start" | "end";
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const [flip, setFlip] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [view, setView] = React.useState<"root" | "status" | "confirm">("root");
  const [error, setError] = React.useState<string | null>(null);
  const [busyStatus, setBusyStatus] = React.useState<InvoiceStatus | null>(null);

  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  const reposition = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect(r);
    const spaceBelow = window.innerHeight - r.bottom;
    setFlip(spaceBelow < 280 && r.top > spaceBelow);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    reposition();
    const onScroll = () => reposition();
    const onResize = () => reposition();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      )
        return;
      close();
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reposition]);

  function close() {
    setOpen(false);
    // Réinitialise l'état interne après la fermeture (évite un flash au ré-ouvrir).
    setTimeout(() => {
      setView("root");
      setError(null);
    }, 160);
  }

  const changeStatus = (next: InvoiceStatus) => {
    if (next === status) {
      close();
      return;
    }
    setError(null);
    setBusyStatus(next);
    startTransition(async () => {
      const res = await updateInvoiceStatus({ id, status: next });
      setBusyStatus(null);
      if (res.ok) {
        close();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const remove = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteInvoice({ id });
      if (res.ok) {
        close();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const itemClasses =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-navy transition-colors hover:bg-navy/[0.04]";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Actions de la facture"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-navy/[0.1] bg-surface-primary text-text-secondary transition-colors hover:border-navy/20 hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/30",
          open && "border-brand-blue-vif/40 text-brand-blue-royal",
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && rect && (
              <motion.div
                ref={menuRef}
                role="menu"
                initial={{ opacity: 0, y: flip ? 6 : -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: flip ? 6 : -6, scale: 0.98 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "fixed",
                  ...(align === "end"
                    ? { left: Math.max(8, rect.right - 224) }
                    : { left: rect.left }),
                  width: 224,
                  zIndex: 200,
                  ...(flip
                    ? { bottom: window.innerHeight - rect.top + 6 }
                    : { top: rect.bottom + 6 }),
                }}
                className="overflow-hidden rounded-xl border border-navy/[0.09] bg-surface-primary p-1 shadow-2xl"
              >
                {view === "root" && (
                  <div>
                    <Link
                      href={`/admin/factures/${id}`}
                      className={itemClasses}
                      role="menuitem"
                      onClick={() => close()}
                    >
                      <Printer className="h-4 w-4 text-text-muted" />
                      Voir / Imprimer PDF
                    </Link>
                    <Link
                      href={`/admin/factures/${id}/edit`}
                      className={itemClasses}
                      role="menuitem"
                      onClick={() => close()}
                    >
                      <Pencil className="h-4 w-4 text-text-muted" />
                      Éditer
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setView("status")}
                      className={itemClasses}
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full border-2"
                        style={{ borderColor: toneColor(INVOICE_STATUS[status]!.tone) }}
                      />
                      Changer le statut
                    </button>
                    <div className="my-1 h-px bg-navy/[0.06]" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setView("confirm")}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-error transition-colors hover:bg-error/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </button>
                  </div>
                )}

                {view === "status" && (
                  <div>
                    <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                      Statut
                    </p>
                    {STATUSES.map((s) => {
                      const active = s === status;
                      const meta = INVOICE_STATUS[s]!;
                      return (
                        <button
                          key={s}
                          type="button"
                          role="menuitemradio"
                          aria-checked={active}
                          disabled={pending}
                          onClick={() => changeStatus(s)}
                          className={cn(
                            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            active
                              ? "bg-brand-blue-vif/10 font-semibold text-brand-blue-royal"
                              : "text-navy hover:bg-navy/[0.04]",
                            pending && "opacity-60",
                          )}
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: toneColor(meta.tone) }}
                          />
                          <span className="min-w-0 flex-1 truncate">{meta.label}</span>
                          {busyStatus === s ? (
                            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-blue-royal" />
                          ) : active ? (
                            <Check className="h-3.5 w-3.5 shrink-0 text-brand-blue-royal" />
                          ) : null}
                        </button>
                      );
                    })}
                    <div className="my-1 h-px bg-navy/[0.06]" />
                    <button
                      type="button"
                      onClick={() => setView("root")}
                      className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-text-secondary transition-colors hover:bg-navy/[0.04]"
                    >
                      ← Retour
                    </button>
                  </div>
                )}

                {view === "confirm" && (
                  <div className="p-2">
                    <p className="flex items-start gap-2 text-sm font-semibold text-navy">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                      Supprimer {number} ?
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">Action irréversible.</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={remove}
                        disabled={pending}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-error px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {pending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Supprimer
                      </button>
                      <button
                        type="button"
                        onClick={() => setView("root")}
                        disabled={pending}
                        className="rounded-lg border border-navy/[0.12] px-3 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/[0.04] disabled:opacity-50"
                      >
                        Non
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="mt-1 flex items-start gap-1.5 px-3 py-2 text-xs font-medium text-error">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {error}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
