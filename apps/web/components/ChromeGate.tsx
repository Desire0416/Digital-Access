"use client";

import { usePathname } from "next/navigation";

/**
 * Masque le chrome vitrine (header, footer, FAB WhatsApp) sur le back-office
 * `/admin/*`, qui possède sa propre coque (AdminShell). Enveloppe des Server
 * Components passés en `children` depuis le layout racine.
 */
export function ChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
