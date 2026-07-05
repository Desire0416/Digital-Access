"use client";

import { SessionProvider } from "next-auth/react";

/** Contexte de session Auth.js côté client. */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
