import { sendEmail } from "./src/send";
import {
  verificationEmail,
  welcomeEmail,
  resetPasswordEmail,
  leadNotificationEmail,
  leadConfirmationEmail,
  paymentSubmittedEmail,
  paymentApprovedEmail,
  paymentRejectedEmail,
  certificateEmail,
  invoiceEmail,
} from "./src/templates";

export { sendEmail } from "./src/send";
export type { SendResult } from "./src/send";

/** Domaine canonique : une URL de déploiement Vercel n'a rien à faire dans un email. */
const canonical = (value: string | undefined, fallback: string) => {
  const v = value?.trim().replace(/\/+$/, "");
  return v && !v.includes("vercel.app") ? v : fallback;
};
const ACADEMY_URL = () => canonical(process.env.NEXT_PUBLIC_ACADEMY_URL, "https://academy.digitalaccess.ci");
const WEB_URL = () => canonical(process.env.NEXT_PUBLIC_WEB_URL, "https://digitalaccess.ci");

export function sendVerificationEmail(to: string, data: { name: string; url: string }) {
  const { subject, html } = verificationEmail(data);
  return sendEmail({ to, subject, html });
}

export function sendWelcomeEmail(to: string, data: { name: string }) {
  const { subject, html } = welcomeEmail({ ...data, catalogueUrl: ACADEMY_URL() });
  return sendEmail({ to, subject, html });
}

export function sendResetPasswordEmail(to: string, data: { name: string; url: string }) {
  const { subject, html } = resetPasswordEmail(data);
  return sendEmail({ to, subject, html });
}

export function sendPaymentSubmittedEmail(
  to: string,
  data: Parameters<typeof paymentSubmittedEmail>[0],
) {
  const { subject, html } = paymentSubmittedEmail(data);
  return sendEmail({ to, subject, html });
}

export function sendPaymentApprovedEmail(
  to: string,
  data: Parameters<typeof paymentApprovedEmail>[0],
) {
  const { subject, html } = paymentApprovedEmail(data);
  return sendEmail({ to, subject, html });
}

export function sendPaymentRejectedEmail(
  to: string,
  data: Parameters<typeof paymentRejectedEmail>[0],
) {
  const { subject, html } = paymentRejectedEmail(data);
  return sendEmail({ to, subject, html });
}

export function sendCertificateEmail(
  to: string,
  data: Parameters<typeof certificateEmail>[0],
) {
  const { subject, html } = certificateEmail(data);
  return sendEmail({ to, subject, html });
}

export function sendInvoiceEmail(
  to: string,
  data: { name: string; number: string; totalLabel: string; dueDateLabel?: string; invoiceId: string },
) {
  const { invoiceId, ...rest } = data;
  const { subject, html } = invoiceEmail({ ...rest, invoiceUrl: `${WEB_URL()}/factures/${invoiceId}` });
  return sendEmail({ to, subject, html });
}

export function sendLeadEmails(opts: {
  adminTo: string;
  lead: Parameters<typeof leadNotificationEmail>[0];
}) {
  const notif = leadNotificationEmail(opts.lead);
  const confirm = leadConfirmationEmail({ name: opts.lead.name, reference: opts.lead.reference });
  return Promise.all([
    sendEmail({ to: opts.adminTo, subject: notif.subject, html: notif.html }),
    sendEmail({ to: opts.lead.email, subject: confirm.subject, html: confirm.html, replyTo: opts.lead.email }),
  ]);
}
