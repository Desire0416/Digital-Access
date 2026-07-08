/* Libellés FR des énumérations de l'espace apprenant (badges, certificats, compétences, offres). */

export const BADGE_CATEGORY_LABEL: Record<string, string> = {
  TECHNICAL_SKILL: "Compétence technique",
  PROFESSIONAL_SKILL: "Compétence professionnelle",
  PROJECT: "Projet",
  EXCELLENCE: "Excellence",
  ENGAGEMENT: "Engagement",
  TALENT: "Talent",
};

export const CERTIFICATE_TYPE_LABEL: Record<string, string> = {
  SHORT_COURSE: "Formation courte",
  MICRO_CERTIFICATION: "Micro-certification",
  CAREER_PATH: "Parcours métier",
  ADVANCED_CERTIFICATE: "Certificat avancé",
};

export const CERTIFICATE_MENTION_LABEL: Record<string, string> = {
  VALIDATED: "Validé",
  GOOD: "Bien",
  VERY_GOOD: "Très bien",
  EXCELLENCE: "Excellence",
};

export const SKILL_CATEGORY_LABEL: Record<string, string> = {
  TECHNICAL: "Technique",
  PROFESSIONAL: "Professionnelle",
  METHODOLOGICAL: "Méthodologique",
  ENTREPRENEURIAL: "Entrepreneuriale",
  TRANSVERSAL: "Transversale",
};

export const OPPORTUNITY_TYPE_LABEL: Record<string, string> = {
  INTERNSHIP: "Stage",
  JOB: "Emploi",
  FREELANCE: "Freelance",
  CLIENT_PROJECT: "Projet client",
  APPRENTICESHIP: "Alternance",
};

export const PROJECT_TYPE_LABEL: Record<string, string> = {
  EXERCISE: "Exercice",
  MINI_PROJECT: "Mini-projet",
  PROFESSIONAL_MISSION: "Mission professionnelle",
  FINAL_PROJECT: "Projet final",
  CLIENT_PROJECT: "Projet client",
  COLLABORATIVE_PROJECT: "Projet collaboratif",
};

export const SUBMISSION_STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "À démarrer",
  IN_PROGRESS: "Brouillon",
  SUBMITTED: "Soumis",
  UNDER_REVIEW: "En évaluation",
  REVISION_REQUESTED: "Révisions demandées",
  VALIDATED: "Validé",
  REJECTED: "Non retenu",
  PORTFOLIO_READY: "Dans le portfolio",
};
