"use server";

import { z } from "zod";
import { prisma } from "@da/db/client";
import { sendLeadEmails } from "@da/email";
import { devisProjectTypes } from "@/lib/content";

const PROJECT_TYPES = [
  "SITE_VITRINE",
  "SITE_INSTITUTIONNEL",
  "ELEARNING",
  "REFONTE",
  "MAINTENANCE",
  "OTHER",
] as const;
type ProjectType = (typeof PROJECT_TYPES)[number];

const leadSchema = z.object({
  projectType: z.string().min(1, "Veuillez sélectionner un type de projet."),
  projectTitle: z.string().max(160).optional().default(""),
  message: z
    .string()
    .min(10, "Décrivez votre projet en quelques mots (10 caractères minimum).")
    .max(4000),
  existingUrl: z.string().max(300).optional().default(""),
  budget: z.string().max(120).optional().default(""),
  timeline: z.string().max(120).optional().default(""),
  name: z.string().min(2, "Votre nom est requis.").max(120),
  email: z.string().email("Adresse email invalide."),
  phone: z.string().max(40).optional().default(""),
  company: z.string().max(160).optional().default(""),
});

export type LeadInput = z.input<typeof leadSchema>;
export type CreateLeadResult =
  | { ok: true; id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const typeLabel = (value: string) =>
  devisProjectTypes.find((t) => t.value === value)?.label ?? value;

export async function createLead(data: LeadInput): Promise<CreateLeadResult> {
  const parsed = leadSchema.safeParse(data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Certaines informations sont invalides.", fieldErrors };
  }

  const d = parsed.data;
  const projectType: ProjectType = (PROJECT_TYPES as readonly string[]).includes(d.projectType)
    ? (d.projectType as ProjectType)
    : "OTHER";

  try {
    const lead = await prisma.lead.create({
      data: {
        name: d.name,
        email: d.email.toLowerCase(),
        phone: d.phone || null,
        company: d.company || null,
        projectType,
        budget: d.budget || null,
        timeline: d.timeline || null,
        message: d.message,
        source: "devis",
        notes: [
          d.projectTitle ? `Titre : ${d.projectTitle}` : "",
          d.existingUrl ? `Site existant : ${d.existingUrl}` : "",
        ]
          .filter(Boolean)
          .join(" · ") || null,
        status: "NEW",
      },
      select: { id: true },
    });

    const reference = `DA-${lead.id.slice(-6).toUpperCase()}`;

    // Notifications email (best-effort — n'échoue jamais le flux).
    await sendLeadEmails({
      adminTo: process.env.ADMIN_NOTIFY_EMAIL || "contact@digitalaccess.ci",
      lead: {
        name: d.name,
        email: d.email,
        phone: d.phone,
        company: d.company,
        projectType: typeLabel(d.projectType),
        budget: d.budget,
        timeline: d.timeline,
        message: d.projectTitle ? `${d.projectTitle}\n\n${d.message}` : d.message,
        reference,
      },
    }).catch((e) => console.error("[createLead] emails:", e));

    return { ok: true, id: reference };
  } catch (err) {
    console.error("[createLead]:", err);
    return { ok: false, error: "Une erreur est survenue. Réessayez dans un instant." };
  }
}
