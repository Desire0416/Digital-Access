import * as React from "react";
import { AuthAside } from "./AuthAside";

/**
 * Ossature split-screen de l'espace d'authentification Academy.
 * Gauche : panneau de marque dégradé (masqué en mobile).
 * Droite : contenu (formulaire ou message), centré verticalement.
 */
export function AuthShell({
  aside,
  children,
}: {
  aside: React.ComponentProps<typeof AuthAside>;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-4.5rem)] lg:grid-cols-[1.05fr_1fr] xl:grid-cols-[1.15fr_1fr]">
      <AuthAside {...aside} />
      <main className="relative flex items-center justify-center px-5 py-14 sm:px-8 lg:px-12">
        {/* Voile décoratif discret côté formulaire */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden lg:hidden"
        >
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-cyan/10 blur-[90px]" />
          <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-brand-violet/10 blur-[90px]" />
        </div>
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
