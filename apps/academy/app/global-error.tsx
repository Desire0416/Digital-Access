"use client";

import * as React from "react";

/* ══════════════════════════════════════════════════════════════════════════
   Frontière d'erreur GLOBALE (remplace le layout racine en cas d'erreur non
   rattrapée). Doit rendre ses propres <html>/<body>. Sans styles externes ici
   (le layout racine ne s'applique pas) → styles inline pour rester brandé DA.
   Fournir ce fichier évite aussi que `next build` génère une page d'erreur
   pages-router (qui importe <Html> et casse le prerender statique).
   ══════════════════════════════════════════════════════════════════════════ */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.25rem",
          padding: "2rem",
          textAlign: "center",
          background: "#ffffff",
          color: "#1A1A2E",
          fontFamily:
            "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div
          aria-hidden
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "linear-gradient(135deg, #5B3FA8, #2B5CC6 45%, #1E8FE1 72%, #00BCD4)",
            boxShadow: "0 18px 40px -18px rgba(43,58,140,0.5)",
          }}
        />
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0 }}>
          Une erreur inattendue s&apos;est produite
        </h1>
        <p style={{ maxWidth: 460, margin: 0, color: "#6B7280", lineHeight: 1.6 }}>
          Nos équipes ont été prévenues. Vous pouvez réessayer maintenant — si le problème persiste,
          revenez dans quelques minutes.
        </p>
        {error.digest && (
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#9CA3AF", fontFamily: "monospace" }}>
            Référence : {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              cursor: "pointer",
              border: "none",
              borderRadius: 8,
              padding: "0.7rem 1.4rem",
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(135deg, #5B3FA8, #00BCD4)",
            }}
          >
            Réessayer
          </button>
          <a
            href="/"
            style={{
              borderRadius: 8,
              padding: "0.7rem 1.4rem",
              fontWeight: 600,
              color: "#2B3A8C",
              textDecoration: "none",
              border: "1px solid rgba(43,58,140,0.2)",
            }}
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </body>
    </html>
  );
}
