import { siteConfig } from "./site";

/* ══════════════════════════════════════════════════════════════════════════
   Générateur de signature email Digital Access.
   HTML « compatible email » : mise en page en <table>, styles INLINE, images en
   URL absolue (logo + icônes monochromes hébergés — les SVG inline sont
   supprimés par Gmail). Palette limitée : violet DA, cyan DA, noir, gris.
   Utilisé à la fois pour l'aperçu et pour la copie (presse-papiers).
   ══════════════════════════════════════════════════════════════════════════ */

const BASE = "https://digitalaccess.ci";
export const SIGNATURE_LOGO_URL = `${BASE}/images/email/logo-digital-access.png`;
const ICONS = `${BASE}/images/email/icons`;

/* Palette (uniquement : violet, cyan, noir, gris). */
const VIOLET = "#5B3FA8";
const CYAN = "#00BCD4";
const BLACK = "#111827";
const GRAY = "#4B5563";
const GRAY_SOFT = "#6B7280";
const GRAY_FAINT = "#9CA3AF";
const DIVIDER = "#CFC3F5"; // violet clair
const HAIRLINE = "#E5E7EB";

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

const EMAIL_DOMAIN = siteConfig.contact.email.split("@")[1] || "digitalaccess.ci";

/** Adresse email proposée automatiquement selon le poste (boîte de service). */
export function suggestedEmailForPoste(poste: string): string {
  const p = (poste || "").toLowerCase();
  let prefix = "contact";
  if (p.includes("support")) prefix = "support";
  else if (p.includes("audit")) prefix = "audit";
  else if (p.includes("commercial") || p.includes("vente") || p.includes("devis")) prefix = "devis";
  return `${prefix}@${EMAIL_DOMAIN}`;
}

/** Toutes les adresses de service possibles (pour distinguer auto vs. saisie manuelle). */
export const SUGGESTED_EMAILS = ["contact", "support", "audit", "devis"].map(
  (p) => `${p}@${EMAIL_DOMAIN}`,
);

/** Échappe le HTML pour empêcher toute injection dans l'aperçu / la signature. */
function esc(value: string): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Une ligne de contact : icône monochrome + contenu. */
function contactRow(icon: string, content: string): string {
  return `<tr>
    <td style="padding:3px 9px 3px 0;vertical-align:middle;width:15px;"><img src="${ICONS}/${icon}.png" width="15" height="15" alt="" style="display:block;border:0;" /></td>
    <td style="padding:3px 0;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.35;color:${GRAY};">${content}</td>
  </tr>`;
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
  const website = esc(siteConfig.url.replace(/^https?:\/\//, ""));
  const address = esc(siteConfig.contact.address);
  const tagline = esc(siteConfig.tagline);
  const linkedin = siteConfig.socials.linkedin;

  const rows = [
    phone ? contactRow("phone", `<a href="tel:${telHref}" style="color:${GRAY};text-decoration:none;">${phoneEsc}</a>`) : "",
    email ? contactRow("mail", `<a href="mailto:${emailEsc}" style="color:${VIOLET};text-decoration:none;">${emailEsc}</a>`) : "",
    contactRow("globe", `<a href="${siteConfig.url}" style="color:${VIOLET};text-decoration:none;">${website}</a>`),
    contactRow("linkedin", `<a href="${linkedin}" style="color:${VIOLET};text-decoration:none;">LinkedIn</a>`),
    contactRow("pin", `<span style="color:${GRAY_SOFT};">${address}</span>`),
  ].join("");

  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;font-family:Arial,Helvetica,sans-serif;color:${BLACK};">
  <tr>
    <td style="padding:0 4px 0 0;vertical-align:middle;">
      <img src="${SIGNATURE_LOGO_URL}" alt="Digital Access" width="184" style="display:block;width:184px;height:auto;border:0;" />
    </td>
    <td style="padding:0 22px;vertical-align:middle;">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td style="width:2px;height:70px;background:${DIVIDER};font-size:0;line-height:0;">&nbsp;</td></tr></table>
    </td>
    <td style="vertical-align:middle;">
      <div style="font-size:19px;font-weight:bold;color:${BLACK};line-height:1.2;">${name}</div>
      <div style="font-size:13px;color:${GRAY_SOFT};margin-top:2px;">${poste}</div>
      <div style="font-size:13px;font-weight:bold;color:${VIOLET};letter-spacing:1.2px;margin-top:7px;">DIGITAL ACCESS</div>
      <div style="font-size:12px;color:${GRAY_SOFT};font-style:italic;margin-top:2px;">${tagline}</div>
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;margin-top:11px;">
        ${rows}
      </table>
    </td>
  </tr>
  <tr>
    <td colspan="3" style="padding:14px 0 0;">
      <div style="border-top:1px solid ${HAIRLINE};padding-top:9px;">
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:bold;letter-spacing:0.3px;color:${GRAY};">Access Web Solutions <span style="color:${GRAY_FAINT};font-weight:normal;">·</span> <span style="color:${CYAN};">Access Academy</span></div>
        <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:${GRAY_FAINT};margin-top:2px;">Création de sites web • Plateformes e-learning • IA • Stratégie numérique</div>
      </div>
    </td>
  </tr>
</table>`;
}

/** Version texte brut (repli presse-papiers pour les clients sans HTML). */
export function buildSignatureText(input: SignatureInput): string {
  const website = siteConfig.url.replace(/^https?:\/\//, "");
  return [
    input.name.trim() || "Prénom Nom",
    input.poste.trim() || "Poste",
    "DIGITAL ACCESS",
    siteConfig.tagline,
    "",
    input.phone.trim(),
    input.email.trim(),
    website,
    siteConfig.contact.address,
    "",
    "Access Web Solutions · Access Academy",
    "Création de sites web • Plateformes e-learning • IA • Stratégie numérique",
  ]
    .filter((line, i, arr) => line !== "" || (arr[i - 1] ?? "") !== "")
    .join("\n");
}
