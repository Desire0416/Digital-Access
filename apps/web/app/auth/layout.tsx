import * as React from "react";

/**
 * Layout de l'espace d'authentification.
 * Le header/footer racine restent en place ; ce conteneur assure un fond neutre
 * et laisse chaque page composer son propre split-screen via <AuthShell>.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bg-surface-secondary">{children}</div>;
}
