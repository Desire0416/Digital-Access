"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/* Envoie une vue de page à /api/track à chaque navigation (compteur de visites).
   Léger : un POST déclenché côté client, dédupliqué sur le chemin, silencieux
   en cas d'échec. Monté une fois dans le layout racine. */
export function VisitTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === last.current) return;
    last.current = pathname;
    const payload = JSON.stringify({ path: pathname, referrer: document.referrer || "" });
    try {
      const blob = new Blob([payload], { type: "application/json" });
      if (!navigator.sendBeacon || !navigator.sendBeacon("/api/track", blob)) {
        void fetch("/api/track", { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true });
      }
    } catch {
      /* no-op : le suivi ne doit jamais gêner l'utilisateur */
    }
  }, [pathname]);

  return null;
}
