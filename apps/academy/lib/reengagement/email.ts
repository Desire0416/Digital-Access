import "server-only";
import { siteConfig } from "@/lib/site";

/* Construit l'email marketing de relance (HTML compatible clients mail : styles
   inline, structure simple). En-tête dégradé DA, message, cartes de formations
   recommandées avec bouton, CTA principal, pied de page avec désinscription. */

export interface ReengagementEmailCourse {
  title: string;
  subtitle?: string | null;
  slug: string;
  priceLabel: string;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function buildReengagementEmail(opts: {
  preheader?: string;
  message: string; // texte libre (paragraphes séparés par des sauts de ligne)
  courses: ReengagementEmailCourse[];
  ctaLabel: string;
}): string {
  const base = siteConfig.url.replace(/\/+$/, "");
  const paragraphs = opts.message
    .split(/\n{2,}|\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#374151;">${esc(p)}</p>`,
    )
    .join("");

  const courseCards = opts.courses
    .map(
      (c) => `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;border:1px solid #ececf3;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="padding:16px 18px;">
            <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1A1A2E;font-family:'Plus Jakarta Sans',Arial,sans-serif;">${esc(c.title)}</p>
            ${c.subtitle ? `<p style="margin:0 0 10px;font-size:13px;line-height:1.5;color:#6B7280;">${esc(c.subtitle)}</p>` : ""}
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td style="border-radius:8px;background:linear-gradient(135deg,#5B3FA8,#00BCD4);">
                <a href="${base}/formations/${encodeURIComponent(c.slug)}" style="display:inline-block;padding:9px 18px;font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;font-family:'Plus Jakarta Sans',Arial,sans-serif;">Voir la formation →</a>
              </td>
              <td style="padding-left:12px;font-size:13px;font-weight:600;color:#6B7280;">${esc(c.priceLabel)}</td>
            </tr></table>
          </td>
        </tr>
      </table>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:Inter,Arial,sans-serif;">
  ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(26,26,46,0.08);">
        <!-- En-tête dégradé -->
        <tr><td style="background:linear-gradient(135deg,#5B3FA8,#2B5CC6 45%,#1E8FE1 72%,#00BCD4);padding:26px 32px;">
          <p style="margin:0;font-size:20px;font-weight:800;color:#ffffff;font-family:'Plus Jakarta Sans',Arial,sans-serif;letter-spacing:-0.02em;">Access Academy</p>
          <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.9);">Apprenez une compétence. Préparez-vous à un métier.</p>
        </td></tr>
        <!-- Message -->
        <tr><td style="padding:28px 32px 8px;">${paragraphs}</td></tr>
        ${
          opts.courses.length
            ? `<tr><td style="padding:4px 32px 8px;">
                 <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF;">Formations qui pourraient vous plaire</p>
                 ${courseCards}
               </td></tr>`
            : ""
        }
        <!-- CTA principal -->
        <tr><td align="center" style="padding:12px 32px 30px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="border-radius:10px;background:linear-gradient(135deg,#5B3FA8,#00BCD4);">
              <a href="${base}" style="display:inline-block;padding:13px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:'Plus Jakarta Sans',Arial,sans-serif;">${esc(opts.ctaLabel)}</a>
            </td>
          </tr></table>
        </td></tr>
        <!-- Pied -->
        <tr><td style="padding:20px 32px;border-top:1px solid #ececf3;background:#fafafb;">
          <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:#9CA3AF;">Vous recevez cet email car vous avez créé un compte sur Access Academy.</p>
          <p style="margin:0;font-size:12px;color:#9CA3AF;">
            <a href="${base}" style="color:#2B5CC6;text-decoration:none;">${base.replace(/^https?:\/\//, "")}</a>
            &nbsp;·&nbsp; ${esc(siteConfig.contactEmail)}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
