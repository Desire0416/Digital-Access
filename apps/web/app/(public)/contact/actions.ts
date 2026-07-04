"use server";

import { z } from "zod";
import { prisma } from "@da/db/client";
import { sendLeadEmails } from "@da/email";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Votre nom est requis.").max(80, "Le nom est trop long."),
  email: z.string().trim().min(1, "Votre email est requis.").email("Adresse email invalide."),
  phone: z.string().trim().max(30, "Le numéro est trop long.").optional().or(z.literal("")),
  subject: z.string().trim().max(120, "L'objet est trop long.").optional().or(z.literal("")),
  message: z
    .string()
    .trim()
    .min(10, "Votre message doit contenir au moins 10 caractères.")
    .max(2000, "Votre message est trop long (2000 caractères max)."),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactResult =
  | { ok: true }
  | { ok: false; errors: Partial<Record<keyof ContactInput, string>>; message?: string };

export async function sendContactMessage(data: ContactInput): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(data);
  if (!parsed.success) {
    const errors: Partial<Record<keyof ContactInput, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ContactInput | undefined;
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors, message: "Merci de corriger les champs signalés." };
  }

  const { name, email, phone, subject, message } = parsed.data;

  try {
    // Persistance en tant que lead (source "contact") pour le CRM.
    const lead = await prisma.lead.create({
      data: {
        name,
        email: email.toLowerCase(),
        phone: phone || null,
        projectType: "OTHER",
        message,
        source: "contact",
        notes: subject ? `Objet : ${subject}` : null,
        status: "NEW",
      },
      select: { id: true },
    });

    const reference = `DA-${lead.id.slice(-6).toUpperCase()}`;
    await sendLeadEmails({
      adminTo: process.env.ADMIN_NOTIFY_EMAIL || "contact@digitalaccess.ci",
      lead: {
        name,
        email,
        phone,
        projectType: subject || "Message de contact",
        message,
        reference,
        title: "Nouveau message de contact",
      },
    }).catch((e) => console.error("[contact] emails:", e));

    return { ok: true };
  } catch (err) {
    console.error("[contact]:", err);
    return { ok: false, errors: {}, message: "Une erreur est survenue. Réessayez." };
  }
}
