import type { Metadata } from "next";

/* ══════════════════════════════════════════════════════════════════════════
   Lecteur de formation (cahier §17) — layout minimal SANS chrome public
   (ni header ni footer marketing). L'expérience est immersive et occupe tout
   l'écran ; le PlayerShell gère lui-même ses trois zones. On désindexe la zone
   d'apprentissage des moteurs de recherche.
   ══════════════════════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Apprentissage · Access Academy",
  robots: { index: false, follow: false },
};

export default function ApprendreLayout({ children }: { children: React.ReactNode }) {
  // Hauteur EXACTE d'un viewport (dynamique, gère la barre mobile) + clip : le
  // corps ne peut jamais dépasser une page, donc aucun espace blanc résiduel
  // sous la coque immersive. Le défilement se fait DANS le PlayerShell.
  return <div className="h-dvh overflow-hidden bg-surface-dark text-white">{children}</div>;
}
