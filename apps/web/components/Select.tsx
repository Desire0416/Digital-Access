"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Select brandé rendu en PORTAIL — le menu s'affiche au-dessus de tout,
   jamais clippé par un conteneur en overflow. Repositionné au scroll/resize,
   bascule vers le haut s'il manque de place. Ferme au clic extérieur / Échap.
   ══════════════════════════════════════════════════════════════════════════ */

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  dotColor?: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Sélectionner…",
  className,
  buttonClassName,
  disabled,
  ariaLabel,
}: {
  value: string | null;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const [flip, setFlip] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => setMounted(true), []);

  const selected = options.find((o) => o.value === value) ?? null;

  const reposition = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect(r);
    const spaceBelow = window.innerHeight - r.bottom;
    setFlip(spaceBelow < 240 && r.top > spaceBelow);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    reposition();
    const onScroll = () => reposition();
    const onResize = () => reposition();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
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
  }, [open, reposition]);

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-navy/[0.1] bg-surface-primary px-3.5 py-2.5 text-left text-sm font-medium text-navy transition-colors hover:border-navy/20 focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/30 disabled:cursor-not-allowed disabled:opacity-50",
          buttonClassName,
        )}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {selected?.dotColor && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: selected.dotColor }}
            />
          )}
          {selected?.icon}
          <span className={cn("truncate", !selected && "text-text-muted")}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={cn("shrink-0 text-text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && rect && (
              <motion.div
                ref={menuRef}
                role="listbox"
                initial={{ opacity: 0, y: flip ? 6 : -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: flip ? 6 : -6, scale: 0.98 }}
                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  position: "fixed",
                  left: rect.left,
                  width: Math.max(rect.width, 180),
                  zIndex: 200,
                  ...(flip
                    ? { bottom: window.innerHeight - rect.top + 6 }
                    : { top: rect.bottom + 6 }),
                }}
                className="max-h-64 overflow-y-auto overflow-x-hidden rounded-xl border border-navy/[0.09] bg-surface-primary p-1 shadow-2xl"
              >
                {options.map((o) => {
                  const active = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={o.disabled}
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        active
                          ? "bg-brand-blue-vif/10 font-semibold text-brand-blue-royal"
                          : "text-navy hover:bg-navy/[0.04]",
                        o.disabled && "cursor-not-allowed opacity-40",
                      )}
                    >
                      {o.dotColor && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ background: o.dotColor }}
                        />
                      )}
                      {o.icon}
                      <span className="min-w-0 flex-1 truncate">{o.label}</span>
                      {active && <Check size={15} className="shrink-0 text-brand-blue-royal" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
