import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

export interface SendResult {
  ok: boolean;
  id?: string;
  error?: string;
  skipped?: boolean;
}

/**
 * Envoi d'email résilient via Resend. Ne lève jamais d'exception : en cas
 * d'échec (clé absente, domaine non vérifié…), journalise et renvoie ok:false
 * pour ne pas casser le flux applicatif (inscription, devis…).
 */
export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<SendResult> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY absente — email non envoyé : « ${opts.subject} »`);
    return { ok: false, skipped: true };
  }
  const from = process.env.EMAIL_FROM || "Access Academy <onboarding@resend.dev>";
  try {
    const res = await resend.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo || process.env.EMAIL_REPLY_TO,
    });
    if (res.error) {
      console.error(`[email] Resend a refusé « ${opts.subject} » :`, res.error.message);
      return { ok: false, error: res.error.message };
    }
    return { ok: true, id: res.data?.id };
  } catch (err) {
    console.error(`[email] Échec d'envoi « ${opts.subject} » :`, err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
