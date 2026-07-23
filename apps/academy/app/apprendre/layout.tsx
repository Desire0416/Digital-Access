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
  // Coque immersive épinglée au viewport via `fixed inset-0` : indépendant des
  // unités de hauteur (vh/dvh) et de la chaîne des parents, donc AUCUN espace
  // blanc résiduel possible, sur tous les navigateurs. Le défilement se fait DANS
  // le PlayerShell (le corps de page, lui, ne défile pas).
  return (
    <div className="fixed inset-0 overflow-hidden bg-surface-dark text-white">{children}</div>
  );
}
