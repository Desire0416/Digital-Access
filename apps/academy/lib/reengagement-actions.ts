"use server";

import { z } from "zod";
import { prisma } from "@da/academy-db/client";
import { sendEmail } from "@da/email";
import { requireAdminFresh } from "./guards";
import { createNotification } from "./notify";
import { getReengagementContext } from "./reengagement-queries";
import { generateReengagementEmail, ReengagementError } from "./reengagement/ai";
import { buildReengagementEmail } from "./reengagement/email";
import { formatFCFA } from "./site";

/* ══════════════════════════════════════════════════════════════════════════
   Relance des inscrits inactifs — ACTIONS (admin). L'IA rédige un brouillon
   marketing ; l'admin le RELIT, l'ajuste, choisit les formations et ENVOIE.
   Rien n'est jamais envoyé automatiquement.
   ══════════════════════════════════════════════════════════════════════════ */

export interface DraftCourse {
  slug: string;
  title: string;
  subtitle: string | null;
  priceLabel: string;
  pitch: string;
}

export interface GenerateResult {
  ok: boolean;
  error?: string;
  subject?: string;
  preheader?: string;
  message?: string; // texte éditable (salutation + intro + corps)
  ctaLabel?: string;
  courses?: DraftCourse[];
  userEmail?: string;
  emailVerified?: boolean;
}

/** Génère un brouillon de relance personnalisé par l'IA (aucun envoi). */
export async function generateReengagementDraft(userId: string): Promise<GenerateResult> {
  const admin = await requireAdminFresh();
  if (!admin) return { ok: false, error: "Accès réservé aux administrateurs." };

  const ctx = await getReengagementContext(userId);
  if (!ctx) return { ok: false, error: "Utilisateur introuvable." };

  try {
    const draft = await generateReengagementEmail(ctx.user, ctx.candidates);
    const bySlug = new Map(ctx.candidates.map((c) => [c.slug, c]));
    const courses: DraftCourse[] = draft.recommendations
      .map((r) => {
        const c = bySlug.get(r.slug);
        if (!c) return null;
        return { slug: c.slug, title: c.title, subtitle: c.subtitle ?? null, priceLabel: c.priceLabel, pitch: r.pitch };
      })
      .filter(Boolean) as DraftCourse[];

    const message = [draft.greeting, draft.intro, ...draft.body, draft.signoff].filter(Boolean).join("\n\n");

    return {
      ok: true,
      subject: draft.subject,
      preheader: draft.preheader,
      message,
      ctaLabel: draft.ctaLabel,
      courses,
      userEmail: ctx.user.email,
      emailVerified: !!ctx.user.emailVerified,
    };
  } catch (e) {
    const err = e instanceof ReengagementError ? e.message : "La génération du message a échoué.";
    return { ok: false, error: err };
  }
}

const sendSchema = z.object({
  userId: z.string().min(1),
  subject: z.string().trim().min(3, "Objet trop court.").max(160),
  message: z.string().trim().min(10, "Message trop court.").max(6000),
  ctaLabel: z.string().trim().max(60).optional(),
  courseSlugs: z.array(z.string()).max(3).default([]),
  channel: z.enum(["EMAIL", "IN_APP", "BOTH"]).default("BOTH"),
});

export interface SendActionResult {
  ok: boolean;
  error?: string;
  message?: string;
  emailSent?: boolean;
  emailSkipped?: boolean;
}

/** Envoie la relance (email marketing et/ou notification in-app) + journalise. */
export async function sendReengagement(input: z.infer<typeof sendSchema>): Promise<SendActionResult> {
  const admin = await requireAdminFresh();
  if (!admin) return { ok: false, error: "Accès réservé aux administrateurs." };

  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const { userId, subject, message, ctaLabel, courseSlugs, channel } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, deletedAt: true },
  });
  if (!user || user.deletedAt) return { ok: false, error: "Utilisateur introuvable." };

  const courses = courseSlugs.length
    ? await prisma.course.findMany({
        where: { slug: { in: courseSlugs }, status: "PUBLISHED" },
        select: { slug: true, title: true, subtitle: true, price: true },
      })
    : [];
  const emailCourses = courses.map((c) => ({
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    priceLabel: c.price > 0 ? formatFCFA(c.price) : "Gratuit",
  }));

  let emailSent = false;
  let emailSkipped = false;
  if (channel === "EMAIL" || channel === "BOTH") {
    const html = buildReengagementEmail({ message, courses: emailCourses, ctaLabel: ctaLabel || "Découvrir le catalogue" });
    const res = await sendEmail({ to: user.email, subject, html });
    emailSent = res.ok;
    emailSkipped = !!res.skipped;
    if (!res.ok && !res.skipped) {
      return { ok: false, error: `L'envoi de l'email a échoué : ${res.error ?? "erreur inconnue"}.` };
    }
  }

  if (channel === "IN_APP" || channel === "BOTH") {
    const firstLine = message.split("\n").find((l) => l.trim()) ?? subject;
    await createNotification({
      userId: user.id,
      type: "REENGAGEMENT",
      title: subject,
      message: firstLine.slice(0, 240),
      link: courseSlugs[0] ? `/formations/${courseSlugs[0]}` : "/formations",
    });
  }

  await prisma.reengagementMessage.create({
    data: { userId: user.id, channel, subject, body: message, emailSent, sentById: admin.id },
  });

  const parts: string[] = [];
  if (channel !== "IN_APP") parts.push(emailSent ? "email envoyé" : emailSkipped ? "email non configuré (ignoré)" : "email non envoyé");
  if (channel !== "EMAIL") parts.push("notification in-app créée");
  return { ok: true, message: `Relance enregistrée — ${parts.join(", ")}.`, emailSent, emailSkipped };
}
