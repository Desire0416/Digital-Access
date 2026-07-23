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
  // Hauteur EXACTE d'un viewport + clip : le corps ne peut jamais dépasser une
  // page, donc aucun espace blanc résiduel sous la coque immersive. Base robuste
  // `h-screen` (100vh, supportée partout) ; on n'utilise `100dvh` (barre mobile
  // dynamique) QUE si le navigateur le prend en charge — sinon le contenu se
  // replierait à sa hauteur naturelle et laisserait du blanc. Défilement DANS le
  // PlayerShell.
  return (
    <div className="h-screen supports-[height:100dvh]:h-dvh overflow-hidden bg-surface-dark text-white">
      {children}
    </div>
  );
}
