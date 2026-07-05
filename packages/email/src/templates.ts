/**
 * Templates d'emails transactionnels brandés Digital Access (HTML inline,
 * compatibles clients mail). Chaque fonction renvoie { subject, html }.
 */

const BRAND = {
  gradient: "linear-gradient(120deg,#7B34F8 0%,#4340E8 34%,#2072E8 66%,#12C7E8 100%)",
  navy: "#1A1A2E",
  muted: "#6B7280",
  bg: "#F4F5FA",
};

function layout(opts: { heading: string; body: string; footerNote?: string }): string {
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.navy};">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 10px 40px -18px rgba(43,58,140,.35);">
      <div style="height:6px;background:${BRAND.gradient};"></div>
      <div style="padding:14px 32px 0;">
        <span style="font-size:20px;font-weight:800;letter-spacing:.12em;color:${BRAND.navy};">DIGITAL</span>
        <span style="font-size:20px;font-weight:800;letter-spacing:.12em;background:${BRAND.gradient};-webkit-background-clip:text;background-clip:text;color:#2072E8;"> ACCESS</span>
      </div>
      <div style="padding:8px 32px 36px;">
        <h1 style="font-size:22px;font-weight:800;letter-spacing:-.01em;margin:18px 0 10px;">${opts.heading}</h1>
        ${opts.body}
      </div>
    </div>
    <p style="text-align:center;color:${BRAND.muted};font-size:12px;line-height:1.6;margin:22px 8px 0;">
      Digital Access · Le numérique accessible, utile et stratégique<br>
      Cocody, Abidjan — Côte d'Ivoire · contact@digitalaccess.ci
      ${opts.footerNote ? `<br><span style="color:#9CA3AF;">${opts.footerNote}</span>` : ""}
    </p>
  </div>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${BRAND.gradient};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:10px;">${label}</a>`;
}

const p = (text: string) =>
  `<p style="font-size:15px;line-height:1.65;color:#374151;margin:0 0 16px;">${text}</p>`;

export function verificationEmail(opts: { name: string; url: string }) {
  return {
    subject: "Confirmez votre compte Access Academy",
    html: layout({
      heading: `Bonjour ${opts.name},`,
      body: `
        ${p("Bienvenue chez Digital Access ! Il ne reste qu'une étape : confirmez votre adresse email pour activer votre compte.")}
        <div style="margin:26px 0;">${button(opts.url, "Confirmer mon compte")}</div>
        ${p(`Ou copiez ce lien dans votre navigateur :<br><a href="${opts.url}" style="color:#2072E8;word-break:break-all;">${opts.url}</a>`)}
        ${p("<span style='color:#9CA3AF;font-size:13px;'>Ce lien expire dans 24 heures. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</span>")}
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
