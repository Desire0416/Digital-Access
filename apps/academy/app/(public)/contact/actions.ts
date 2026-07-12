"use server";

import { z } from "zod";
import { sendEmail } from "@da/email";
import { siteConfig } from "@/lib/site";

/* ══════════════════════════════════════════════════════════════════════════
   Action de contact public — validation Zod stricte, envoi d'un email vers
   contact@digitalaccess.ci (avec Reply-To = expéditeur). Ne lève jamais.
   ══════════════════════════════════════════════════════════════════════════ */

const ContactSchema = z.object({
  name: z.string().trim().min(2, "Veuillez indiquer votre nom.").max(120),
  email: z.string().trim().toLowerCase().email("Adresse email invalide."),
  subject: z.string().trim().min(3, "Veuillez préciser un objet.").max(160),
  message: z.string().trim().min(10, "Votre message est un peu court.").max(4000),
  // Anti-spam : champ caché qui doit rester vide.
  company: z.string().max(0).optional().default(""),
});

export type ContactResult = { ok: true; message: string } | { ok: false; error: string };

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

export async function submitContact(_prev: ContactResult | null, formData: FormData): Promise<ContactResult> {
  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
    company: formData.get("company") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { name, email, subject, message, company } = parsed.data;
  // Piège à robots rempli → on répond OK sans rien envoyer.
  if (company) return { ok: true, message: "Merci, votre message a bien été envoyé." };

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;color:#1a1a2e;line-height:1.6">
      <h2 style="font-family:'Plus Jakarta Sans',Arial,sans-serif">Nouveau message — Access Academy</h2>
      <p><strong>Nom :</strong> ${esc(name)}</p>
      <p><strong>Email :</strong> ${esc(email)}</p>
      <p><strong>Objet :</strong> ${esc(subject)}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
      <p style="white-space:pre-wrap">${esc(message)}</p>
    </div>`;

  const res = await sendEmail({
    to: siteConfig.contactEmail,
    subject: `[Contact Academy] ${subject}`,
    html,
    replyTo: email,
  });

  if (!res.ok && !res.skipped) {
    return { ok: false, error: "L'envoi a échoué. Réessayez ou écrivez-nous directement par email." };
  }

  return { ok: true, message: "Merci ! Votre message a bien été envoyé, nous vous répondrons rapidement." };
}
