"use client";

import * as React from "react";

/* ══════════════════════════════════════════════════════════════════════════
   Enregistre UNE visite par session de navigateur (compteur public du site).
   Le drapeau sessionStorage évite de recompter les rechargements et les
   navigations internes ; si le stockage est indisponible, on compte une fois
   par montage. Appel « fire-and-forget » — n'affecte jamais l'affichage.
   ══════════════════════════════════════════════════════════════════════════ */

export function VisitTracker() {
  React.useEffect(() => {
    let shouldCount = true;
    try {
      if (window.sessionStorage.getItem("da:visitCounted")) shouldCount = false;
      else window.sessionStorage.setItem("da:visitCounted", "1");
    } catch {
      /* stockage indisponible → on compte cette session */
    }
    if (!shouldCount) return;
    fetch("/api/visit", { method: "POST", keepalive: true }).catch(() => {
      /* comptage silencieux */
    });
  }, []);

  return null;
}
