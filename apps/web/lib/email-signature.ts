import { siteConfig } from "./site";

/* ══════════════════════════════════════════════════════════════════════════
   Générateur de signature email Digital Access.
   HTML « compatible email » : mise en page en <table>, styles INLINE, image en
   URL absolue — pour un rendu fidèle dans Gmail, Outlook, Apple Mail, etc.
   Utilisé à la fois pour l'aperçu et pour la copie (presse-papiers).
   ══════════════════════════════════════════════════════════════════════════ */

/** Logo hébergé publiquement (voir public/images/email/). */
export const SIGNATURE_LOGO_URL = "https://digitalaccess.ci/images/email/logo-digital-access.png";

export interface SignatureInput {
  name: string;
  poste: string;
  email: string;
  phone: string;
}

/** Postes proposés en un clic (le champ reste librement modifiable). */
export const SIGNATURE_ROLES = [
  "Commercial",
  "Responsable commercial",
  "Support client",
  "Direction",
  "Chef de projet",
  "Marketing",
] as const;

/** Échappe le HTML pour empêcher toute injection dans l'aperçu / la signature. */
function esc(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Construit la signature en HTML compatible email. */
export function buildSignatureHtml(input: SignatureInput): string {
  const name = esc(input.name.trim() || "Prénom Nom");
  const poste = esc(input.poste.trim() || "Poste");
  const email = input.email.trim();
  const phone = input.phone.trim();
  const emailEsc = esc(email);
  const phoneEsc = esc(phone);
  const telHref = phone.replace(/[^\d+]/g, "");
  const website = siteConfig.url.replace(/^https?:\/\//, "");
  const address = esc(siteConfig.contact.address);
  const tagline = esc(siteConfig.tagline);

  const row = (symbol: string, content: string) =>
    `<tr><td style="padding:2px 8px 2px 0;vertical-align:top;font-size:12px;line-height:1.5;">${symbol}</td><td style="padding:2px 0;vertical-align:top;font-size:12px;line-height:1.5;color:#4B5563;">${content}</td></tr>`;

  const emailRow = email
    ? row("✉️", `<a href="mailto:${emailEsc}" style="color:#2B3A8C;text-decoration:none;">${emailEsc}</a>`)
    : "";
  const phoneRow = phone
    ? row("📞", `<a href="tel:${telHref}" style="color:#4B5563;text-decoration:none;">${phoneEsc}</a>`)
    : "";
  const siteRow = row(
    "🌐",
    `<a href="${siteConfig.url}" style="color:#2B3A8C;text-decoration:none;">${esc(website)}</a>`,
  );
  const addressRow = row("📍", address);

  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:#1A1A2E;">
  <tr>
    <td style="padding:0 18px 0 0;vertical-align:middle;">
      <img src="${SIGNATURE_LOGO_URL}" alt="Digital Access" width="132" style="display:block;width:132px;height:auto;border:0;" />
    </td>
    <td style="padding:2px 0 2px 18px;vertical-align:middle;border-left:3px solid #2B3A8C;">
      <div style="font-size:16px;font-weight:bold;color:#1A1A2E;line-height:1.25;">${name}</div>
      <div style="font-size:13px;font-weight:bold;color:#2B3A8C;margin-top:3px;">${poste}</div>
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;margin-top:9px;">
        ${emailRow}${phoneRow}${siteRow}${addressRow}
      </table>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding:12px 0 0;font-size:11px;font-style:italic;color:#9CA3AF;">${tagline}</td>
  </tr>
</table>`;
}

/** Version texte brut (repli presse-papiers pour les clients sans HTML). */
export function buildSignatureText(input: SignatureInput): string {
  const website = siteConfig.url.replace(/^https?:\/\//, "");
  return [
    input.name.trim() || "Prénom Nom",
    input.poste.trim() || "Poste",
    input.email.trim(),
    input.phone.trim(),
    website,
    siteConfig.contact.address,
    siteConfig.tagline,
  ]
    .filter(Boolean)
    .join("\n");
}
