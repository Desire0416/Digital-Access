"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@da/db/client";
import { signIn, AuthError } from "@da/auth";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendResetPasswordEmail,
} from "@da/email";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const ACADEMY_URL = process.env.NEXT_PUBLIC_ACADEMY_URL || "http://localhost:3001";

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

/* ─── Inscription apprenant ────────────────────────────────────────────────── */

const registerSchema = z.object({
  name: z.string().trim().min(2, "Votre nom doit contenir au moins 2 caractères.").max(80),
  email: z.string().trim().toLowerCase().email("Adresse email invalide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .regex(/[A-Z]/, "Ajoutez au moins une majuscule.")
    .regex(/[0-9]/, "Ajoutez au moins un chiffre."),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export async function registerUser(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Veuillez corriger les champs indiqués.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const { name, email, password } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return {
        ok: false,
        error: "Un compte existe déjà avec cet email.",
        fieldErrors: { email: "Cet email est déjà utilisé." },
      };
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, roles: ["LEARNER"] },
      select: { id: true, name: true, email: true },
    });

    const token = randomUUID();
    await prisma.verificationToken.create({
      data: {
        token,
        type: "EMAIL_VERIFICATION",
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const url = `${ACADEMY_URL}/auth/verify?token=${token}`;
    console.log("[academy/auth] Lien de vérification:", url);
    await sendVerificationEmail(user.email, { name: user.name, url });

    return { ok: true, message: "Compte créé. Un email de confirmation a été envoyé." };
  } catch (err) {
    console.error("[academy/auth] registerUser:", err);
    return { ok: false, error: "Une erreur est survenue. Réessayez dans un instant." };
  }
}

/* ─── Renvoi de l'email de vérification (cooldown 2 min) ────────────────────── */

const emailSchema = z.object({ email: z.string().trim().toLowerCase().email("Adresse email invalide.") });

export async function resendVerification(email: string): Promise<ActionResult> {
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success) return { ok: false, error: "Adresse email invalide." };

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, name: true, email: true, emailVerified: true },
    });
    if (!user) return { ok: true, message: "Si un compte existe, un email a été envoyé." };
    if (user.emailVerified) return { ok: false, error: "Ce compte est déjà confirmé." };

    const last = await prisma.verificationToken.findFirst({
      where: { userId: user.id, type: "EMAIL_VERIFICATION" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (last && Date.now() - last.createdAt.getTime() < 2 * 60 * 1000) {
      return { ok: false, error: "Veuillez patienter avant de renvoyer un email." };
    }

    await prisma.verificationToken.deleteMany({ where: { userId: user.id, type: "EMAIL_VERIFICATION" } });
    const token = randomUUID();
    await prisma.verificationToken.create({
      data: { token, type: "EMAIL_VERIFICATION", userId: user.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    });
    const url = `${ACADEMY_URL}/auth/verify?token=${token}`;
    console.log("[academy/auth] Lien de vérification (renvoi):", url);
    await sendVerificationEmail(user.email, { name: user.name, url });

    return { ok: true, message: "Un nouvel email de confirmation vient d'être envoyé." };
  } catch (err) {
    console.error("[academy/auth] resendVerification:", err);
    return { ok: false, error: "Une erreur est survenue. Réessayez." };
  }
}

/* ─── Vérification du token (activation) ────────────────────────────────────── */

export async function verifyEmailToken(
  token: string,
): Promise<"success" | "expired" | "invalid"> {
  if (!token || token.trim().length === 0) return "invalid";
  try {
    const vt = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, name: true, email: true, emailVerified: true } } },
    });
    if (!vt || vt.type !== "EMAIL_VERIFICATION") return "invalid";
    if (vt.usedAt) return vt.user.emailVerified ? "success" : "invalid";
    if (vt.expiresAt < new Date()) return "expired";

    await prisma.$transaction([
      prisma.user.update({ where: { id: vt.userId }, data: { emailVerified: new Date(), isActive: true } }),
      prisma.verificationToken.update({ where: { id: vt.id }, data: { usedAt: new Date() } }),
      prisma.verificationToken.deleteMany({
        where: { userId: vt.userId, type: "EMAIL_VERIFICATION", usedAt: null },
      }),
    ]);
    await sendWelcomeEmail(vt.user.email, { name: vt.user.name });
    return "success";
  } catch (err) {
    console.error("[academy/auth] verifyEmailToken:", err);
    return "invalid";
  }
}

/* ─── Connexion ─────────────────────────────────────────────────────────────── */

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse email invalide."),
  password: z.string().min(1, "Veuillez saisir votre mot de passe."),
  remember: z.boolean().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export async function loginUser(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Identifiants invalides.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Email ou mot de passe incorrect." };
    }
    console.error("[academy/auth] loginUser:", err);
    return { ok: false, error: "Une erreur est survenue. Réessayez." };
  }
}

/* ─── Mot de passe oublié ───────────────────────────────────────────────────── */

export async function requestPasswordReset(email: string): Promise<ActionResult> {
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success) return { ok: false, error: "Adresse email invalide." };
  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, name: true, email: true },
    });
    if (user) {
      await prisma.verificationToken.deleteMany({ where: { userId: user.id, type: "PASSWORD_RESET" } });
      const token = randomUUID();
      await prisma.verificationToken.create({
        data: { token, type: "PASSWORD_RESET", userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      });
      const url = `${ACADEMY_URL}/auth/reset-password?token=${token}`;
      console.log("[academy/auth] Lien de réinitialisation:", url);
      await sendResetPasswordEmail(user.email, { name: user.name, url });
    }
    return { ok: true, message: "Si un compte existe, un email de réinitialisation a été envoyé." };
  } catch (err) {
    console.error("[academy/auth] requestPasswordReset:", err);
    return { ok: false, error: "Une erreur est survenue. Réessayez." };
  }
}

const resetSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .regex(/[A-Z]/, "Ajoutez au moins une majuscule.")
    .regex(/[0-9]/, "Ajoutez au moins un chiffre."),
});

export async function resetPassword(input: { token: string; password: string }): Promise<ActionResult> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Mot de passe invalide.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  try {
    const vt = await prisma.verificationToken.findUnique({ where: { token: parsed.data.token } });
    if (!vt || vt.type !== "PASSWORD_RESET" || vt.usedAt || vt.expiresAt < new Date()) {
      return { ok: false, error: "Ce lien de réinitialisation est expiré ou invalide." };
    }
    const hashed = await bcrypt.hash(parsed.data.password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: vt.userId }, data: { password: hashed } }),
      prisma.verificationToken.update({ where: { id: vt.id }, data: { usedAt: new Date() } }),
    ]);
    return { ok: true, message: "Votre mot de passe a été réinitialisé." };
  } catch (err) {
    console.error("[academy/auth] resetPassword:", err);
    return { ok: false, error: "Une erreur est survenue. Réessayez." };
  }
}
