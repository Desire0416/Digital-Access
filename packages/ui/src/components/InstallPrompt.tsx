"use client";

import * as React from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { cn } from "../lib/cn";
import { Monogram } from "./Monogram";
import { Sheet } from "./Sheet";
import { useInstallPrompt } from "../hooks/usePwa";

/* ══════════════════════════════════════════════════════════════════════════
   InstallPrompt — invite d'installation brandée DA (@da/ui). Sans service
   worker : capture `beforeinstallprompt` (Android/Chromium) pour un bouton
   « Installer » natif, et propose sur iOS Safari les instructions manuelles
   (« Partager → Sur l'écran d'accueil »). Rejet mémorisé (réapparition après
   REMIND_AFTER_DAYS). Masquée si déjà installée. Le placement (au-dessus de la
   barre d'onglets) est géré par `className`.
   ══════════════════════════════════════════════════════════════════════════ */

const REMIND_AFTER_DAYS = 14;

export interface InstallPromptProps {
  appName: string;
  /** Accroche courte affichée sous le titre. */
  tagline?: string;
  className?: string;
}

export function InstallPrompt({ appName, tagline, className }: InstallPromptProps) {
  const { canInstall, isIOS, isStandalone, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = React.useState(true); // fermé tant que non hydraté
  const [iosOpen, setIosOpen] = React.useState(false);
  const storageKey = `da-install-dismissed:${appName}`;

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setDismissed(false);
        return;
      }
      const ts = Number(raw);
      const stale = Number.isFinite(ts) && Date.now() - ts > REMIND_AFTER_DAYS * 86_400_000;
      setDismissed(!stale);
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(storageKey, String(Date.now()));
    } catch {
      /* stockage indisponible */
    }
  }

  async function onInstall() {
    const outcome = await promptInstall();
    if (outcome === "accepted") dismiss();
  }

  // Rien à proposer : installée, rejetée, ou plateforme sans chemin d'installation.
  if (isStandalone || dismissed || (!canInstall && !isIOS)) return null;

  return (
    <>
      <div
        role="dialog"
        aria-label={`Installer ${appName}`}
        className={cn(
          "fixed inset-x-3 z-[95] flex items-center gap-3 rounded-2xl border border-navy/[0.08] bg-surface-primary p-3 shadow-brand-lg",
          "bottom-[calc(4.25rem+env(safe-area-inset-bottom))]",
          className,
        )}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-da" aria-hidden>
          <Monogram variant="white" size={24} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold text-navy">Installer {appName}</p>
          <p className="truncate text-xs text-text-secondary">
            {tagline ?? "Accès plein écran, comme une vraie application."}
          </p>
        </div>
        {canInstall ? (
          <button
            type="button"
            onClick={onInstall}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-da px-3.5 py-2 text-xs font-bold text-white shadow-brand transition-transform active:scale-95"
          >
            <Download size={15} aria-hidden />
            Installer
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIosOpen(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-da px-3.5 py-2 text-xs font-bold text-white shadow-brand transition-transform active:scale-95"
          >
            <Share size={15} aria-hidden />
            Comment ?
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Ignorer"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-navy"
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      {/* Instructions iOS (aucun événement natif sur Safari iOS) */}
      <Sheet open={iosOpen} onClose={() => setIosOpen(false)} side="bottom" label={`Installer ${appName} sur iPhone`}>
        <div className="px-5 pb-6 pt-3">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-da" aria-hidden>
              <Monogram variant="white" size={24} />
            </span>
            <div>
              <p className="font-display text-base font-bold text-navy">Ajouter à l'écran d'accueil</p>
              <p className="text-xs text-text-secondary">Depuis Safari, en deux étapes.</p>
            </div>
          </div>
          <ol className="space-y-3">
            <li className="flex items-start gap-3 rounded-xl border border-navy/[0.06] bg-surface-secondary/50 p-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy/[0.06] text-navy" aria-hidden>
                <Share size={17} />
              </span>
              <p className="text-sm text-navy">
                Touchez l'icône <strong>Partager</strong> dans la barre de Safari.
              </p>
            </li>
            <li className="flex items-start gap-3 rounded-xl border border-navy/[0.06] bg-surface-secondary/50 p-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy/[0.06] text-navy" aria-hidden>
                <Plus size={17} />
              </span>
              <p className="text-sm text-navy">
                Choisissez <strong>« Sur l'écran d'accueil »</strong>, puis <strong>Ajouter</strong>.
              </p>
            </li>
          </ol>
          <button
            type="button"
            onClick={() => {
              setIosOpen(false);
              dismiss();
            }}
            className="mt-4 w-full rounded-xl bg-gradient-da py-3 text-sm font-bold text-white shadow-brand transition-transform active:scale-[0.98]"
          >
            J'ai compris
          </button>
        </div>
      </Sheet>
    </>
  );
}
