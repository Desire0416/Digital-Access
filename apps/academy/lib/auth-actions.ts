"use server";

import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@da/academy-db/client";
import { sendVerificationEmail, sendWelcomeEmail, sendResetPasswordEmail } from "@da/email";
import { siteConfig } from "./site";

/* ══════════════════════════════════════════════════════════════════════════
   Authentification — inscription §15.2, vérification §15.3.
   Pages attendues côté UI :
     /inscription            → formulaire (appelle registerUser)
     /verification?token=…   → appelle verifyEmailToken
     /reinitialisation?token=… → appelle resetPassword
   Un compte non vérifié peut naviguer mais pas acheter (bannière côté UI).
   ══════════════════════════════════════════════════════════════════════════ */

export type AuthResult = { ok: true; message?: string } | { ok: false; error: string };

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 h
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 h
const RESEND_COOLDOWN_MS = 2 * 60 * 1000; // 1 envoi / 2 min

const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule.")
  .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre.");

const registerSchema = z.object({
  firstName: z.string().trim().min(2, "Prénom trop court.").max(60),
  lastName: z.string().trim().min(2, "Nom trop court.").max(60),
  email: z.string().trim().toLowerCase().email("Adresse email invalide."),
  password: passwordSchema,
  country: z.string().trim().min(2, "Veuillez indiquer votre pays.").max(60),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  objective: z.string().trim().max(200).optional().or(z.literal("")),
  experienceLevel: z.string().trim().max(60).optional().or(z.literal("")),
});

export type RegisterInput = z.input<typeof registerSchema>;

async function issueVerificationToken(userId: string): Promise<string> {
  const token = randomUUID();
  await prisma.verificationToken.create({
    data: { token, type: "EMAIL_VERIFICATION", userId, expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS) },
  });
  return token;
}

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const data = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: data.email }, select: { id: true, emailVerified: true } });
  if (existing) {
    return { ok: false, error: "Un compte existe déjà avec cette adresse email. Connectez-vous ou réinitialisez votre mot de passe." };
  }

  const hash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      password: hash,
      country: data.country,
      phone: data.phone || null,
      objective: data.objective || null,
      experienceLevel: data.experienceLevel || null,
      roles: ["LEARNER"],
      isActive: false,
      emailVerified: null,
    },
    select: { id: true, name: true, email: true },
  });

  const token = await issueVerificationToken(user.id);
  try {
    await sendVerificationEmail(user.email, {
      name: user.name,
      url: `${siteConfig.url}/verification?token=${token}`,
    });
  } catch {
    // L'échec d'envoi ne bloque pas la création : « Renvoyer l'email » reste possible.
  }

  return { ok: true, message: "Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse." };
}

export async function verifyEmailToken(token: string): Promise<AuthResult> {
  const parsed = z.string().uuid().safeParse(token);
  if (!parsed.success) return { ok: false, error: "Lien de vérification invalide." };

  const record = await prisma.verificationToken.findUnique({
    where: { token: parsed.data },
    select: { id: true, type: true, userId: true, expiresAt: true, usedAt: true, user: { select: { name: true, email: true, emailVerified: true } } },
  });
  if (!record || record.type !== "EMAIL_VERIFICATION") return { ok: false, error: "Lien de vérification invalide." };
  if (record.usedAt) return { ok: false, error: "Ce lien a déjà été utilisé. Vous pouvez vous connecter." };
  if (record.expiresAt < new Date()) return { ok: false, error: "Ce lien a expiré. Demandez un nouvel email de vérification." };

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date(), isActive: true } }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Invalide les autres tokens de vérification encore en attente.
    prisma.verificationToken.deleteMany({
      where: { userId: record.userId, type: "EMAIL_VERIFICATION", usedAt: null, id: { not: record.id } },
    }),
  ]);

  if (!record.user.emailVerified) {
    try {
      await sendWelcomeEmail(record.user.email, { name: record.user.name });
    } catch {
      /* non bloquant */
    }
  }

  return { ok: true, message: "Adresse confirmée ! Votre compte est activé." };
}

export async function resendVerification(email: string): Promise<AuthResult> {
  const parsed = z.string().trim().toLowerCase().email().safeParse(email);
  // Réponse identique quoi qu'il arrive : pas d'énumération de comptes.
  const neutral: AuthResult = { ok: true, message: "Si un compte non vérifié existe pour cette adresse, un email vient d'être envoyé." };
  if (!parsed.success) return neutral;

  const user = await prisma.user.findUnique({
    where: { email: parsed.data },
    select: { id: true, name: true, email: true, emailVerified: true },
  });
  if (!user || user.emailVerified) return neutral;

  // Rate-limit : 1 envoi / 2 min par utilisateur.
  const last = await prisma.verificationToken.findFirst({
    where: { userId: user.id, type: "EMAIL_VERIFICATION" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    return { ok: false, error: "Un email vient déjà d'être envoyé. Patientez 2 minutes avant de réessayer." };
  }

  const token = await issueVerificationToken(user.id);
  try {
    await sendVerificationEmail(user.email, { name: user.name, url: `${siteConfig.url}/verification?token=${token}` });
  } catch {
    return { ok: false, error: "L'email n'a pas pu être envoyé. Réessayez dans quelques instants." };
  }
  return neutral;
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const parsed = z.string().trim().toLowerCase().email().safeParse(email);
  const neutral: AuthResult = { ok: true, message: "Si un compte existe pour cette adresse, un email de réinitialisation vient d'être envoyé." };
  if (!parsed.success) return neutral;

  const user = await prisma.user.findUnique({
    where: { email: parsed.data },
    select: { id: true, name: true, email: true, password: true },
  });
  if (!user || !user.password) return neutral; // compte OAuth seul : pas de mot de passe à réinitialiser

  // Rate-limit doux : 1 envoi / 2 min.
  const last = await prisma.verificationToken.findFirst({
    where: { userId: user.id, type: "PASSWORD_RESET" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) return neutral;

  const token = randomUUID();
  await prisma.verificationToken.create({
    data: { token, type: "PASSWORD_RESET", userId: user.id, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
  });
  try {
    await sendResetPasswordEmail(user.email, { name: user.name, url: `${siteConfig.url}/reinitialisation?token=${token}` });
  } catch {
    /* réponse neutre quand même */
  }
  return neutral;
}

export async function resetPassword(token: string, newPassword: string): Promise<AuthResult> {
  const tokenParsed = z.string().uuid().safeParse(token);
  if (!tokenParsed.success) return { ok: false, error: "Lien de réinitialisation invalide." };
  const passwordParsed = passwordSchema.safeParse(newPassword);
  if (!passwordParsed.success) return { ok: false, error: passwordParsed.error.issues[0]?.message ?? "Mot de passe invalide." };

  const record = await prisma.verificationToken.findUnique({
    where: { token: tokenParsed.data },
    select: { id: true, type: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!record || record.type !== "PASSWORD_RESET") return { ok: false, error: "Lien de réinitialisation invalide." };
  if (record.usedAt) return { ok: false, error: "Ce lien a déjà été utilisé. Demandez une nouvelle réinitialisation." };
  if (record.expiresAt < new Date()) return { ok: false, error: "Ce lien a expiré. Demandez une nouvelle réinitialisation." };

  const hash = await bcrypt.hash(passwordParsed.data, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: hash } }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.verificationToken.deleteMany({
      where: { userId: record.userId, type: "PASSWORD_RESET", usedAt: null, id: { not: record.id } },
    }),
  ]);

  return { ok: true, message: "Mot de passe mis à jour. Vous pouvez vous connecter." };
}
