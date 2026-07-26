"use client";

import { usePathname, useRouter } from "next/navigation";
import { MobileAppBar } from "@da/ui";
import { userNav } from "@/lib/site";

/* Barre d'application contextuelle de l'espace connecté (mobile) : titre de la
   page courante (dérivé de userNav) + retour sur les pages de détail. Se place
   sous l'en-tête (sticky), masquée en desktop. Remplace les onglets défilables
   de EspaceNav sur mobile — la navigation vit désormais dans la barre d'onglets
   basse + le « Menu ». */
export function EspaceMobileBar() {
  const pathname = usePathname() ?? "/espace";
  const router = useRouter();

  // Entrée la plus spécifique correspondant au chemin (href le plus long).
  const match = [...userNav]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));

  const title = match?.label ?? "Mon espace";
  const isDetail = match ? pathname !== match.href : pathname !== "/espace";

  return (
    <MobileAppBar
      title={title}
      onBack={isDetail ? () => router.back() : undefined}
      className="top-20 lg:hidden"
    />
  );
}
