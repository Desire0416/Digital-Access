"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma, type Role } from "@da/academy-db/client";
import { signIn, AuthError } from "@/lib/auth";

/* ══════════════════════════════════════════════════════════════════════════
   Connexion (§15) — Server Actions locales.
   loginAction : credentials via signIn (@/lib/auth), gestion AuthError
   (identifiants invalides / compte désactivé). Redirection par rôle :
   admin → /admin, sinon callbackUrl || /espace.
   googleLoginAction : signIn Google (bouton conditionnel côté page).
   ══════════════════════════════════════════════════════════════════════════ */

export type LoginState = { error?: string };

const ADMIN_ROLES: Role[] = ["ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"];

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse email invalide."),
  password: z.string().min(1, "Veuillez saisir votre mot de passe."),
});

/** Empêche les redirections ouvertes : uniquement des chemins internes. */
function safeCallback(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const { email, password } = parsed.data;
  const callbackUrl = safeCallback(formData.get("callbackUrl") as string | null);

  // Message précis « compte désactivé » uniquement si le mot de passe est correct
  // (évite l'énumération de comptes).
  const user = await prisma.user.findUnique({
    where: { email },
    select: { password: true, emailVerified: true, isActive: true, roles: true },
  });
  if (user?.password && user.emailVerified && !user.isActive) {
    const ok = await bcrypt.compare(password, user.password);
    if (ok) {
      return { error: "Votre compte a été désactivé. Contactez le support pour le réactiver." };
    }
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Identifiants invalides. Vérifiez votre email et votre mot de passe." };
    }
    throw error;
  }

  // Aiguillage par rôle — redirect() hors du try (il lève NEXT_REDIRECT).
  const roles = user?.roles ?? [];
  const target = roles.some((r) => ADMIN_ROLES.includes(r)) ? "/admin" : callbackUrl ?? "/espace";
  redirect(target);
}

export async function googleLoginAction(formData: FormData): Promise<void> {
  const callbackUrl = safeCallback(formData.get("callbackUrl") as string | null) ?? "/espace";
  await signIn("google", { redirectTo: callbackUrl });
}
