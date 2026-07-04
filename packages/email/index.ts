import { sendEmail } from "./src/send";
import {
  verificationEmail,
  welcomeEmail,
  resetPasswordEmail,
  leadNotificationEmail,
  leadConfirmationEmail,
} from "./src/templates";

export { sendEmail } from "./src/send";
export type { SendResult } from "./src/send";

const ACADEMY_URL = () => process.env.NEXT_PUBLIC_ACADEMY_URL || "https://academy.digitalaccess.ci";

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
