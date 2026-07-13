/* ══════════════════════════════════════════════════════════════════════════
   Types de certificats (cahier §20.1) — métadonnées partagées.
   Une SEULE source de vérité pour les libellés, l'énoncé PDF et le classement
   « certificat formel » vs « badge ». Importable partout (serveur, PDF, pages).
   ══════════════════════════════════════════════════════════════════════════ */

export const CERTIFICATE_TYPES = [
  "PARTICIPATION",
  "COURSE",
  "SPECIALIZATION",
  "EXPERTISE",
  "CAREER_PATH",
  "SKILL_BADGE",
] as const;

export type CertificateTypeKey = (typeof CERTIFICATE_TYPES)[number];

/** Libellé complet (fiche, vérification publique, admin). */
export const CERTIFICATE_TYPE_LABEL: Record<string, string> = {
  PARTICIPATION: "Attestation de participation",
  COURSE: "Certificat de formation",
  SPECIALIZATION: "Certificat de spécialisation",
  EXPERTISE: "Certificat d'expertise",
  CAREER_PATH: "Certification métier",
  SKILL_BADGE: "Badge de compétence",
};

/** Libellé court (puces, chips). */
export const CERTIFICATE_TYPE_SHORT: Record<string, string> = {
  PARTICIPATION: "Participation",
  COURSE: "Formation",
  SPECIALIZATION: "Spécialisation",
  EXPERTISE: "Expertise",
  CAREER_PATH: "Parcours métier",
  SKILL_BADGE: "Compétence",
};

/** Énoncé du document PDF selon le type (titre + sous-titre + phrase d'intro). */
export const CERTIFICATE_PDF_COPY: Record<string, { title: string; subtitle: string; intro: string }> = {
  PARTICIPATION: { title: "ATTESTATION", subtitle: "DE PARTICIPATION", intro: "pour avoir suivi la formation" },
  COURSE: { title: "CERTIFICAT", subtitle: "DE RÉUSSITE", intro: "pour avoir complété avec succès la formation" },
  SPECIALIZATION: { title: "CERTIFICAT", subtitle: "DE SPÉCIALISATION", intro: "pour avoir complété la spécialisation" },
  EXPERTISE: { title: "CERTIFICAT", subtitle: "D'EXPERTISE", intro: "pour l'expertise démontrée en" },
  CAREER_PATH: { title: "CERTIFICATION", subtitle: "MÉTIER", intro: "pour avoir complété le parcours métier" },
  SKILL_BADGE: { title: "BADGE", subtitle: "DE COMPÉTENCE", intro: "pour la maîtrise de la compétence" },
};

/** Un badge de compétence est un crédential distinct des certificats formels (§20.1). */
export function isSkillBadge(type: string): boolean {
  return type === "SKILL_BADGE";
}

export function certificateTypeLabel(type: string): string {
  return CERTIFICATE_TYPE_LABEL[type] ?? "Certificat";
}
