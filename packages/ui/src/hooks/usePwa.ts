"use client";

import { useCallback, useEffect, useState } from "react";

/* ══════════════════════════════════════════════════════════════════════════
   Hooks PWA partagés (@da/ui) — détection du mode installé (standalone) et
   capture de l'invite d'installation. Aucune dépendance à Next : window only.
   ══════════════════════════════════════════════════════════════════════════ */

/** true quand l'app tourne en mode installé (écran d'accueil), Android + iOS. */
export function useIsStandalone(): boolean {
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    // `navigator.standalone` : propriété non standard propre à iOS Safari.
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const check = () => setStandalone(mq.matches || nav.standalone === true);
    check();
    mq.addEventListener("change", check);
    return () => mq.removeEventListener("change", check);
  }, []);

  return standalone;
}

/** Événement `beforeinstallprompt` (Chromium) — typé, non fourni par lib.dom. */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

export interface InstallPromptState {
  /** L'invite native est disponible (Android/Chromium) → on peut proposer un bouton. */
  canInstall: boolean;
  /** iOS Safari : pas d'événement natif → instructions manuelles nécessaires. */
  isIOS: boolean;
  /** Déjà installée. */
  isStandalone: boolean;
  /** Déclenche l'invite native (no-op si indisponible). */
  promptInstall: () => Promise<InstallOutcome>;
}

export function useInstallPrompt(): InstallPromptState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const isStandalone = useIsStandalone();

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // empêche la mini-infobar Chrome, on gère l'UI nous-mêmes
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari (hors Chrome/Firefox iOS) — seul chemin = « Partager → écran d'accueil ».
    const ua = window.navigator.userAgent;
    const iOS = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    setIsIOS(iOS);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!deferred) return "unavailable";
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    return outcome;
  }, [deferred]);

  return { canInstall: deferred !== null, isIOS, isStandalone, promptInstall };
}
