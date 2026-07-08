import { auth } from "./index";
import { cookies } from "next/headers";
import { prisma } from "@da/db/client";

/** Cookie d'impersonation : userId (« se connecter en tant que ») ou `role:<ROLE>` (« voir en tant que »). */
export const IMPERSONATION_COOKIE = "da_impersonate";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles: string[];
  emailVerified: Date | string | null;
  /** Présent uniquement quand un admin consulte « en tant que » quelqu'un d'autre. */
  impersonatedBy?: { id: string; name: string } | null;
}

function mapSession(u: Record<string, unknown>): SessionUser {
  return {
    id: String(u.id ?? ""),
    name: (u.name as string) ?? null,
    email: (u.email as string) ?? null,
    image: (u.image as string) ?? null,
    roles: (u.roles as string[]) ?? [],
    emailVerified: (u.emailVerified as Date | string | null) ?? null,
  };
}

/** Vrai utilisateur de la session Auth.js (JWT), sans impersonation. */
export async function realUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return mapSession(session.user as Record<string, unknown>);
}

/**
 * Utilisateur EFFECTIF. Si un administrateur a activé « se connecter en tant que »
 * (ou « voir en tant que rôle »), renvoie l'utilisateur/rôle ciblé. Le cookie
 * n'est honoré que si le VRAI utilisateur est admin — sinon il est ignoré.
 */
export async function currentUser(): Promise<SessionUser | null> {
  const real = await realUser();
  if (!real) return null;

  const isAdmin = real.roles.includes("ADMIN") || real.roles.includes("SUPER_ADMIN");
  if (!isAdmin) return real;

  let token: string | undefined;
  try {
    token = (await cookies()).get(IMPERSONATION_COOKIE)?.value;
  } catch {
    return real;
  }
  if (!token) return real;

  const by = { id: real.id, name: real.name ?? "Administrateur" };

  // « Voir en tant que rôle » : même identité, rôles restreints. On n'honore QUE
  // des rôles non privilégiés — un cookie « role:ADMIN/SUPER_ADMIN/… » (même forgé
  // par un admin) ne doit jamais élever les privilèges effectifs.
  if (token.startsWith("role:")) {
    const role = token.slice(5);
    const PREVIEWABLE = ["LEARNER", "INSTRUCTOR", "REVIEWER", "MENTOR", "CLIENT", "COMPANY"];
    if (!role || !PREVIEWABLE.includes(role)) return real;
    return { ...real, roles: [role], impersonatedBy: by };
  }

  // « Se connecter en tant que » un utilisateur précis.
  try {
    const target = await prisma.user.findUnique({
      where: { id: token },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        roles: true,
        emailVerified: true,
      },
    });
    if (target) {
      return {
        id: target.id,
        name: target.name,
        email: target.email,
        image: target.avatar,
        roles: target.roles,
        emailVerified: target.emailVerified,
        impersonatedBy: by,
      };
    }
  } catch {
    /* base indisponible — on revient à l'utilisateur réel */
  }
  return real;
}

/** True si l'utilisateur possède au moins un des rôles requis. */
export function hasRole(user: SessionUser | null, ...roles: string[]): boolean {
  if (!user) return false;
  return roles.some((r) => user.roles.includes(r));
}
