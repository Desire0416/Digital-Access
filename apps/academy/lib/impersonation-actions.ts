"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma, type Role } from "@da/academy-db/client";
import { realUser } from "./guards";
import { signActAs, ACT_AS_COOKIE, ACT_AS_MAX_AGE } from "./impersonation";

/* ══════════════════════════════════════════════════════════════════════════
   Actions « agir en tant que » (cahier §12). TOUJOURS évaluées à partir du
   VRAI utilisateur de session (realUser) — jamais de l'utilisateur agissant —
   et revérifiées SUPER_ADMIN en base. Le cookie signé ne fait que désigner la
   cible ; il n'accorde aucun droit (voir currentUser()). Chaque action est
   journalisée (AuditLog).
   ══════════════════════════════════════════════════════════════════════════ */

type Result = { ok: true } | { ok: false; error: string };

const ALL_ROLES: Role[] = [
  "LEARNER", "INSTRUCTOR", "GRADER", "MENTOR", "SCHOOL_MANAGER",
  "PATH_MANAGER", "ORG_MANAGER", "ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN",
];

async function requireRealSuperAdmin(): Promise<{ id: string; name: string } | null> {
  const real = await realUser();
  if (!real) return null;
  const db = await prisma.user.findUnique({
    where: { id: real.id },
    select: { roles: true, deletedAt: true, name: true },
  });
  if (!db || db.deletedAt || !db.roles.includes("SUPER_ADMIN")) return null;
  return { id: real.id, name: db.name };
}

async function audit(actorId: string, action: string, entityId: string, meta?: object) {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, entity: "User", entityId, meta: meta ? JSON.parse(JSON.stringify(meta)) : undefined },
    });
  } catch {
    /* le journal ne bloque jamais l'action */
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: ACT_AS_MAX_AGE,
};

/** Agir en tant qu'un utilisateur précis (voir exactement ce qu'il voit). */
export async function startImpersonation(userId: string): Promise<Result> {
  const sa = await requireRealSuperAdmin();
  if (!sa) return { ok: false, error: "Réservé aux super administrateurs." };
  if (userId === sa.id) return { ok: false, error: "Vous ne pouvez pas vous incarner vous-même." };
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, deletedAt: true } });
  if (!target || target.deletedAt) return { ok: false, error: "Utilisateur introuvable." };

  (await cookies()).set(ACT_AS_COOKIE, signActAs({ k: "user", by: sa.id, sub: target.id }), cookieOptions);
  await audit(sa.id, "user.impersonate.start", target.id, { targetName: target.name });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Prévisualiser l'interface d'un rôle (sans incarner un utilisateur précis). */
export async function viewAsRole(role: Role): Promise<Result> {
  const sa = await requireRealSuperAdmin();
  if (!sa) return { ok: false, error: "Réservé aux super administrateurs." };
  if (!ALL_ROLES.includes(role)) return { ok: false, error: "Rôle invalide." };

  (await cookies()).set(ACT_AS_COOKIE, signActAs({ k: "role", by: sa.id, role }), cookieOptions);
  await audit(sa.id, "user.viewas.start", sa.id, { role });
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Revenir à son compte super administrateur (efface le cookie). */
export async function stopActingAs(): Promise<Result> {
  const real = await realUser();
  (await cookies()).delete(ACT_AS_COOKIE);
  if (real) await audit(real.id, "user.actas.stop", real.id);
  revalidatePath("/", "layout");
  return { ok: true };
}
