"use client";

import { SessionProvider } from "next-auth/react";

/** Fournit le contexte de session Auth.js côté client (les pages restent statiques). */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
