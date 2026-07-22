"use client";

import * as React from "react";
import { useSession, signOut } from "next-auth/react";

/* ══════════════════════════════════════════════════════════════════════════
   Déconnexion automatique après inactivité (sécurité §sessions).
   Un utilisateur authentifié laissé inactif 30 minutes est déconnecté et
   renvoyé vers la page de connexion. L'horodatage de dernière activité est
   partagé via localStorage → synchronisé entre onglets et conservé au
   rechargement (une inactivité déjà entamée n'est pas remise à zéro).
   Ne s'arme que lorsque la session est réellement authentifiée.
   ══════════════════════════════════════════════════════════════════════════ */

const IDLE_MS = 30 * 60 * 1000; // 30 minutes d'inactivité
const CHECK_MS = 30 * 1000; // vérification toutes les 30 s
const KEY = "da:lastActivity";

export function InactivityLogout() {
  const { status } = useSession();

  React.useEffect(() => {
    if (status !== "authenticated") return;
    if (typeof window === "undefined") return;

    const readStored = (): number => {
      try {
        const s = Number(window.localStorage.getItem(KEY));
        return Number.isFinite(s) && s > 0 ? s : 0;
      } catch {
        return 0;
      }
    };
    const write = (t: number) => {
      try {
        window.localStorage.setItem(KEY, String(t));
      } catch {
        /* stockage indisponible — le minuteur mémoire prend le relais */
      }
    };

    // Amorçage : reprend une éventuelle inactivité en cours (autre onglet /
    // rechargement) plutôt que de la réinitialiser.
    let last = readStored() || Date.now();
    write(last);

    let throttled = false;
    const mark = () => {
      if (throttled) return;
      throttled = true;
      window.setTimeout(() => (throttled = false), 1000);
      last = Date.now();
      write(last);
    };

    const check = () => {
      const reference = Math.max(last, readStored());
      if (Date.now() - reference >= IDLE_MS) {
        try {
          window.localStorage.removeItem(KEY);
        } catch {
          /* sans conséquence */
        }
        void signOut({ callbackUrl: "/auth/login?expired=1" });
      }
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"] as const;
    activityEvents.forEach((e) => window.addEventListener(e, mark, { passive: true }));

    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Synchronisation inter-onglets : l'activité d'un onglet repousse l'échéance
    // de tous les autres.
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        const s = Number(e.newValue);
        if (Number.isFinite(s)) last = Math.max(last, s);
      }
    };
    window.addEventListener("storage", onStorage);

    const interval = window.setInterval(check, CHECK_MS);
    check(); // vérifie immédiatement (cas d'un rechargement après inactivité)

    return () => {
      activityEvents.forEach((e) => window.removeEventListener(e, mark));
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(interval);
    };
  }, [status]);

  return null;
}
