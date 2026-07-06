/**
 * Templates d'emails transactionnels brandés Digital Access (HTML inline,
 * compatibles clients mail). Chaque fonction renvoie { subject, html }.
 */

const BRAND = {
  gradient: "linear-gradient(120deg,#7B34F8 0%,#4340E8 34%,#2072E8 66%,#12C7E8 100%)",
  solid: "#4340E8", // repli couleur unie (Outlook n'affiche pas les dégradés)
  link: "#2072E8",
  navy: "#1A1A2E",
  ink: "#374151",
  muted: "#6B7280",
  faint: "#9CA3AF",
  hair: "#ECEDF3",
  bg: "#F4F5FA",
  tagline: "Le numérique accessible, utile et stratégique",
};

/** Coordonnées officielles Digital Access (source de vérité des emails). */
const CONTACT = {
  site: "https://digitalaccess.ci",
  siteLabel: "digitalaccess.ci",
  academy: "https://academy.digitalaccess.ci",
  email: "contact@digitalaccess.ci",
  whatsappUrl: "https://wa.me/2250564452692",
  phoneLabel: "+225 05 64 45 26 92",
  address: "Cocody, Abidjan — Côte d'Ivoire",
};

/** Monogramme DA en dégradé (repli couleur unie), rendu fiable en HTML mail. */
function logoLockup(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="vertical-align:middle;">
      <div style="width:46px;height:46px;border-radius:13px;background-color:${BRAND.solid};background-image:${BRAND.gradient};text-align:center;">
        <span style="display:inline-block;line-height:46px;color:#ffffff;font-weight:800;font-size:19px;letter-spacing:.03em;">DA</span>
      </div>
    </td>
    <td style="vertical-align:middle;padding-left:13px;">
      <div style="font-size:16px;font-weight:800;letter-spacing:.15em;color:${BRAND.navy};line-height:1;">DIGITAL ACCESS</div>
      <div style="font-size:11px;color:${BRAND.muted};letter-spacing:.03em;margin-top:5px;line-height:1.2;">${BRAND.tagline}</div>
    </td>
  </tr></table>`;
}

/** Pied de page : coordonnées complètes + mentions. */
function footer(footerNote?: string): string {
  const sep = `<span style="color:${BRAND.faint};padding:0 8px;">·</span>`;
  const a = (href: string, label: string) =>
    `<a href="${href}" style="color:${BRAND.link};text-decoration:none;white-space:nowrap;">${label}</a>`;
  return `
    <div style="max-width:560px;margin:22px auto 0;padding:0 8px;text-align:center;">
      <div style="font-size:13px;font-weight:700;color:${BRAND.navy};letter-spacing:.02em;">Digital Access</div>
      <div style="font-size:12px;color:${BRAND.muted};margin-top:3px;">${BRAND.tagline}</div>
      <div style="font-size:12.5px;color:${BRAND.ink};line-height:2;margin-top:12px;">
        ${a(CONTACT.site, CONTACT.siteLabel)}${sep}${a("mailto:" + CONTACT.email, CONTACT.email)}${sep}${a(CONTACT.whatsappUrl, "WhatsApp " + CONTACT.phoneLabel)}
      </div>
      <div style="font-size:12px;color:${BRAND.faint};margin-top:4px;">${CONTACT.address}</div>
      ${footerNote ? `<div style="font-size:11px;color:${BRAND.faint};margin-top:10px;">${footerNote}</div>` : ""}
      <div style="font-size:11px;color:${BRAND.faint};margin-top:14px;">© ${new Date().getFullYear()} Digital Access. Tous droits réservés.</div>
    </div>`;
}

function layout(opts: {
  heading: string;
  body: string;
  footerNote?: string;
  preheader?: string;
}): string {
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.navy};-webkit-font-smoothing:antialiased;">
  ${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>` : ""}
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 12px 44px -20px rgba(43,58,140,.4);border:1px solid ${BRAND.hair};">
      <div style="height:5px;background-color:${BRAND.solid};background-image:${BRAND.gradient};"></div>
      <div style="padding:26px 32px 4px;">
        ${logoLockup()}
      </div>
      <div style="padding:6px 32px 34px;">
        <h1 style="font-size:22px;font-weight:800;letter-spacing:-.01em;line-height:1.3;margin:18px 0 12px;color:${BRAND.navy};">${opts.heading}</h1>
        ${opts.body}
      </div>
    </div>
    ${footer(opts.footerNote)}
  </div>
</body>
</html>`;
}

/** Bouton « bulletproof » (table) — dégradé + repli uni pour Outlook. */
function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr><td align="center" style="border-radius:11px;background-color:${BRAND.solid};background-image:${BRAND.gradient};">
      <a href="${href}" style="display:inline-block;padding:15px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:11px;letter-spacing:.01em;">${label}</a>
    </td></tr>
  </table>`;
}

const p = (text: string) =>
  `<p style="font-size:15px;line-height:1.65;color:#374151;margin:0 0 16px;">${text}</p>`;

export function verificationEmail(opts: { name: string; url: string }) {
  return {
    subject: "Confirmez votre compte Access Academy",
    html: layout({
      preheader: "Il ne reste qu'une étape : confirmez votre adresse pour activer votre compte.",
      heading: `Bienvenue, ${opts.name} 👋`,
      body: `
        ${p("Merci d'avoir créé votre compte <b>Access Academy</b> ! Il ne reste plus qu'une étape : confirmez votre adresse email pour activer votre compte et accéder à toutes vos formations.")}
        <div style="margin:28px 0;">${button(opts.url, "Confirmer mon compte")}</div>
        <div style="background:#F7F8FC;border:1px solid ${BRAND.hair};border-radius:12px;padding:14px 16px;margin:4px 0 20px;">
          <p style="margin:0 0 6px;font-size:12px;color:${BRAND.faint};text-transform:uppercase;letter-spacing:.08em;font-weight:700;">Le bouton ne fonctionne pas ?</p>
          <a href="${opts.url}" style="color:${BRAND.link};font-size:13px;word-break:break-all;text-decoration:none;">${opts.url}</a>
        </div>
        ${p(`<span style="color:${BRAND.faint};font-size:13px;">🔒 Ce lien est valable <b>24 heures</b>. Si vous n'êtes pas à l'origine de cette inscription, vous pouvez ignorer cet email en toute sécurité.</span>`)}
        <div style="border-top:1px solid ${BRAND.hair};margin:22px 0 0;padding-top:18px;">
          ${p(`<span style="font-size:13.5px;color:${BRAND.ink};">Une question ? Écrivez-nous à <a href="mailto:${CONTACT.email}" style="color:${BRAND.link};text-decoration:none;">${CONTACT.email}</a> ou sur <a href="${CONTACT.whatsappUrl}" style="color:${BRAND.link};text-decoration:none;">WhatsApp</a> — nous sommes là pour vous aider.</span>`)}
        </div>
      `,
    }),
  };
}

export function welcomeEmail(opts: { name: string; catalogueUrl: string }) {
  return {
    subject: "Bienvenue sur Digital Access 🎉",
    html: layout({
      heading: `Votre compte est activé, ${opts.name} !`,
      body: `
        ${p("Merci d'avoir confirmé votre adresse. Vous avez désormais accès à l'ensemble de votre espace Digital Access.")}
        ${p("Découvrez nos services, suivez vos projets, ou explorez les formations d'Access Academy.")}
        <div style="margin:26px 0;">${button(opts.catalogueUrl, "Découvrir la plateforme")}</div>
      `,
    }),
  };
}

export function resetPasswordEmail(opts: { name: string; url: string }) {
  return {
    subject: "Réinitialisation de votre mot de passe",
    html: layout({
      heading: `Bonjour ${opts.name},`,
      body: `
        ${p("Vous avez demandé la réinitialisation de votre mot de passe. Cliquez ci-dessous pour en choisir un nouveau.")}
        <div style="margin:26px 0;">${button(opts.url, "Réinitialiser mon mot de passe")}</div>
        ${p("<span style='color:#9CA3AF;font-size:13px;'>Ce lien est valable 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email — votre mot de passe reste inchangé.</span>")}
      `,
    }),
  };
}

export function leadNotificationEmail(opts: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  projectType: string;
  budget?: string;
  timeline?: string;
  message: string;
  reference: string;
  title?: string;
}) {
  const title = opts.title ?? "Nouvelle demande de devis";
  const row = (k: string, v?: string) =>
    v ? `<tr><td style="padding:6px 12px 6px 0;color:#9CA3AF;font-size:13px;">${k}</td><td style="padding:6px 0;font-size:14px;color:#374151;">${v}</td></tr>` : "";
  return {
    subject: `${title} — ${opts.name} (${opts.reference})`,
    html: layout({
      heading: title,
      body: `
        ${p(`Une nouvelle demande vient d'arriver via le site (réf. <b>${opts.reference}</b>).`)}
        <table style="width:100%;border-collapse:collapse;margin:8px 0 18px;">
          ${row("Nom", opts.name)}
          ${row("Email", opts.email)}
          ${row("Téléphone", opts.phone)}
          ${row("Entreprise", opts.company)}
          ${row("Type de projet", opts.projectType)}
          ${row("Budget", opts.budget)}
          ${row("Délai", opts.timeline)}
        </table>
        <div style="background:#F9FAFB;border:1px solid #eee;border-radius:12px;padding:14px 16px;">
          ${p(opts.message.replace(/</g, "&lt;"))}
        </div>
      `,
      footerNote: "Notification interne — CRM Digital Access",
    }),
  };
}

export function paymentSubmittedEmail(opts: {
  learnerName: string;
  learnerEmail: string;
  courseTitle: string;
  amountLabel: string;
  operator: string;
  payerPhone: string;
  transactionId: string;
  reference: string;
  adminUrl: string;
}) {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#9CA3AF;font-size:13px;">${k}</td><td style="padding:6px 0;font-size:14px;color:#374151;font-weight:600;">${v}</td></tr>`;
  return {
    subject: `💰 Paiement à valider — ${opts.courseTitle} (${opts.reference})`,
    html: layout({
      heading: "Nouveau paiement Mobile Money à vérifier",
      body: `
        ${p(`<b>${opts.learnerName}</b> (${opts.learnerEmail}) déclare avoir payé le cours <b>${opts.courseTitle}</b>.`)}
        <table style="width:100%;border-collapse:collapse;margin:8px 0 18px;">
          ${row("Référence", opts.reference)}
          ${row("Montant attendu", opts.amountLabel)}
          ${row("Opérateur", opts.operator)}
          ${row("Numéro payeur", opts.payerPhone)}
          ${row("ID de transaction", opts.transactionId)}
        </table>
        ${p("Vérifiez la réception du montant sur votre compte Mobile Money, puis approuvez ou rejetez la demande :")}
        <div style="margin:22px 0;">${button(opts.adminUrl, "Ouvrir la validation des paiements")}</div>
      `,
      footerNote: "Notification interne — validation des paiements Academy",
    }),
  };
}

export function paymentApprovedEmail(opts: {
  name: string;
  courseTitle: string;
  courseUrl: string;
  amountLabel: string;
  reference: string;
}) {
  return {
    subject: `✅ Paiement confirmé — accès ouvert à « ${opts.courseTitle} »`,
    html: layout({
      heading: `C'est confirmé, ${opts.name} !`,
      body: `
        ${p(`Votre paiement de <b>${opts.amountLabel}</b> (réf. ${opts.reference}) a été vérifié et validé. Votre accès au cours <b>${opts.courseTitle}</b> est désormais ouvert — à vie.`)}
        <div style="margin:24px 0;">${button(opts.courseUrl, "Commencer le cours")}</div>
        ${p("Bonne formation ! N'oubliez pas : chaque chapitre terminé fait grandir votre série 🔥.")}
      `,
    }),
  };
}

export function paymentRejectedEmail(opts: {
  name: string;
  courseTitle: string;
  reference: string;
  reason?: string;
  checkoutUrl: string;
}) {
  return {
    subject: `Paiement non validé — ${opts.courseTitle} (${opts.reference})`,
    html: layout({
      heading: `Bonjour ${opts.name},`,
      body: `
        ${p(`Nous n'avons pas pu valider votre paiement pour le cours <b>${opts.courseTitle}</b> (réf. ${opts.reference}).`)}
        ${opts.reason ? p(`<b>Motif :</b> ${opts.reason.replace(/</g, "&lt;")}`) : ""}
        ${p("Si vous pensez qu'il s'agit d'une erreur, vérifiez l'ID de transaction saisi et soumettez à nouveau votre preuve, ou contactez-nous sur WhatsApp — nous réglerons cela rapidement.")}
        <div style="margin:22px 0;">${button(opts.checkoutUrl, "Soumettre une nouvelle preuve")}</div>
      `,
    }),
  };
}

export function certificateEmail(opts: {
  name: string;
  courseTitle: string;
  certificatesUrl: string;
  verifyUrl: string;
  code: string;
}) {
  return {
    subject: `🏆 Félicitations ${opts.name} — votre certificat est prêt`,
    html: layout({
      heading: `Bravo ${opts.name}, c'est validé ! 🎓`,
      body: `
        ${p(`Vous avez complété avec succès la formation <b>${opts.courseTitle}</b>. Votre certificat de réussite Access Academy est officiellement délivré.`)}
        <div style="background:#F9FAFB;border:1px solid #eee;border-radius:12px;padding:14px 16px;margin:0 0 18px;">
          <p style="margin:0;font-size:13px;color:#9CA3AF;">Code de vérification</p>
          <p style="margin:4px 0 0;font-size:18px;font-weight:800;letter-spacing:.08em;color:${BRAND.navy};">${opts.code}</p>
        </div>
        ${p("Téléchargez-le en PDF, partagez-le sur LinkedIn, ou laissez un employeur vérifier son authenticité en ligne à tout moment.")}
        <div style="margin:24px 0;">${button(opts.certificatesUrl, "Voir mon certificat")}</div>
        ${p(`<span style='color:#9CA3AF;font-size:13px;'>Vérification publique : <a href="${opts.verifyUrl}" style="color:#2072E8;word-break:break-all;">${opts.verifyUrl}</a></span>`)}
      `,
    }),
  };
}

export function leadConfirmationEmail(opts: { name: string; reference: string }) {
  return {
    subject: "Nous avons bien reçu votre demande — Digital Access",
    html: layout({
      heading: `Merci ${opts.name} !`,
      body: `
        ${p(`Votre demande (réf. <b>${opts.reference}</b>) a bien été reçue. Notre équipe l'étudie et revient vers vous sous 48h ouvrées.`)}
        ${p("En attendant, n'hésitez pas à nous écrire sur WhatsApp pour toute précision.")}
      `,
    }),
  };
}
