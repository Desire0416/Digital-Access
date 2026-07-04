import { auth } from "./index";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles: string[];
  emailVerified: Date | string | null;
}

/** Utilisateur de la session courante (ou null) — typé proprement. */
export async function currentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  const u = session.user as Record<string, unknown>;
  return {
    id: String(u.id ?? ""),
    name: (u.name as string) ?? null,
    email: (u.email as string) ?? null,
    image: (u.image as string) ?? null,
    roles: (u.roles as string[]) ?? [],
    emailVerified: (u.emailVerified as Date | string | null) ?? null,
  };
}

/** True si l'utilisateur possède au moins un des rôles requis. */
export function hasRole(user: SessionUser | null, ...roles: string[]): boolean {
  if (!user) return false;
  return roles.some((r) => user.roles.includes(r));
}
