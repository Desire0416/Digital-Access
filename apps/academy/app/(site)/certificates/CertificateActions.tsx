"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Check, Link2, Share2 } from "lucide-react";
import { cn } from "@da/ui";

/**
 * Actions de partage d'un certificat (client).
 * - Copier le lien public /verify/{code} dans le presse-papier (feedback « Copié ! »).
 * - Partager sur LinkedIn (nouvel onglet).
 * Ouverture au clic sur « Partager », refermeture au clic extérieur / Échap.
 */
export function CertificateActions({ code }: { code: string }) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const copiedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  /* URL publique de vérification — construite côté client à partir de l'origine. */
  const verifyUrl = React.useCallback(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/verify/${code}`;
  }, [code]);

  /* Fermeture au clic extérieur + touche Échap. */
  React.useEffect(() => {
    if (!open) return;
    function onPointer(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  React.useEffect(() => {
    return () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    };
  }, []);

  async function handleCopy() {
    const url = verifyUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* Repli : sélection via un champ temporaire si clipboard indisponible. */
      const el = document.createElement("textarea");
      el.value = url;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand("copy");
      } catch {
        /* silencieux */
      }
      document.body.removeChild(el);
    }
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  }

  function handleLinkedIn() {
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      verifyUrl(),
    )}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors sm:w-auto sm:px-4",
          open
            ? "border-brand-violet/40 bg-brand-violet/[0.06] text-brand-violet"
            : "border-navy/12 text-navy hover:border-brand-violet/40 hover:text-brand-violet",
        )}
      >
        <Share2 size={16} aria-hidden />
        Partager
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 z-20 mt-2 w-60 origin-top-right overflow-hidden rounded-xl border border-navy/10 bg-surface-primary p-1.5 shadow-xl"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleCopy}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-navy transition-colors hover:bg-navy/[0.04]"
            >
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
                  copied
                    ? "bg-success/10 text-success"
                    : "bg-brand-violet/10 text-brand-violet",
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span
                      key="ok"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Check size={16} aria-hidden />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="link"
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Link2 size={16} aria-hidden />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className="min-w-0">
                <span className="block leading-tight">
                  {copied ? "Copié !" : "Copier le lien"}
                </span>
                <span className="block text-xs font-normal text-text-muted">
                  Lien de vérification public
                </span>
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleLinkedIn}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-navy transition-colors hover:bg-navy/[0.04]"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-blue-royal/10 text-brand-blue-royal">
                <Briefcase size={16} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block leading-tight">Partager sur LinkedIn</span>
                <span className="block text-xs font-normal text-text-muted">
                  Valorisez votre réussite
                </span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
