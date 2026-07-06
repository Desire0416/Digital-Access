"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

/** Fournit le contexte de session Auth.js côté client, hydraté depuis le serveur. */
export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
