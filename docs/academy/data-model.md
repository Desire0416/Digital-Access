# Digital Access Academy — Modèle de données

Schéma Prisma unifié : `packages/db/prisma/schema.prisma`. 24 modèles Academy (+ modèles web préservés).

## Modèles

| Modèle | Rôle |
|---|---|
| **School** | École (grand domaine). name, slug, descriptions, icon, color, order, status. |
| **CareerPath** | Parcours métier. school, targetJob, level, duration, price, prerequisites/objectives/outcomes/tools, certificateTitle, featured, status. |
| **ShortCourse** | Formation courte. school, level, price, courseType, objectives. |
| **Module** | Étape (rattachée à un parcours OU une formation courte). |
| **Lesson** | Leçon (module). lessonType (VIDEO/TEXT/EXERCISE/QUIZ/RESOURCE/LIVE), content, videoUrl, isPreview. |
| **Skill** | Compétence. category (TECHNICAL/PROFESSIONAL/METHODOLOGICAL/ENTREPRENEURIAL/TRANSVERSAL), level, school. |
| **CareerPathSkill** | Liaison parcours ⇄ compétences. |
| **Quiz** / **QuizQuestion** / **QuizAttempt** | Évaluations (8 types de questions), tentatives des apprenants. |
| **ProfessionalProject** | Projet. projectType (EXERCISE/MINI_PROJECT/PROFESSIONAL_MISSION/FINAL_PROJECT/CLIENT_PROJECT/COLLABORATIVE_PROJECT), context/problem/mission, deliverables, rubric, requiresDefense, isPortfolioEligible. |
| **Rubric** | Grille d'évaluation (criteria JSON, totalPoints, passingScore). |
| **ProjectSubmission** | Dépôt. files/links, status (NOT_STARTED→…→PORTFOLIO_READY), score, feedback, reviewer, aiDeclaration, version. |
| **Badge** | Badge. category (TECHNICAL_SKILL/PROFESSIONAL_SKILL/PROJECT/EXCELLENCE/ENGAGEMENT/TALENT), skill/project. |
| **LearnerBadge** | Attribution d'un badge (par preuve). |
| **Certificate** | Certificat. certificateType (SHORT_COURSE/MICRO_CERTIFICATION/CAREER_PATH/ADVANCED_CERTIFICATE), mention, certificateNumber (unique), qrCode, verificationUrl, status. |
| **PortfolioItem** | Élément de portfolio. project, tools/skills, visibility (PRIVATE/PUBLIC/LINK_ONLY/COMPANIES_ONLY). |
| **LearnerProfile** | Profil apprenant (headline, bio, liens, visibility). |
| **Enrollment** | Inscription parcours/formation. status, accessType (PAID/FREE/COUPON/GRANT/COMPANY/MANUAL), progress. |
| **Payment** | Paiement. provider (MOBILE_MONEY/PAYDUNYA/CINETPAY/MANUAL/FREE), status (PENDING/PAID/FAILED/CANCELLED/MANUAL_REVIEW/REFUNDED), purpose, proofUrl. |
| **Coupon** | Code de réduction/bourse. |
| **Company** | Entreprise. verification (UNVERIFIED/VERIFIED/PARTNER/PREMIUM), status. |
| **Opportunity** | Offre. type (INTERNSHIP/JOB/FREELANCE/CLIENT_PROJECT/APPRENTICESHIP), requiredSkills, status. |
| **Application** | Candidature. status (RECEIVED/REVIEWED/SHORTLISTED/INTERVIEW/ACCEPTED/REJECTED). |

## Enums transversaux

`Level` (BEGINNER/INTERMEDIATE/ADVANCED/EXPERT), `ContentStatus` (DRAFT/REVIEW/PUBLISHED/ARCHIVED),
`MasteryLevel` (UNDERSTOOD/APPLIED/MASTERED/PROFESSIONAL) pour le passeport de compétences.

## Seed

`packages/db/prisma/seed.ts` consomme `seed-academy.json` (contenu FR généré) : 8 écoles, 6 parcours prioritaires
(4 modules × ~6 leçons + 3 projets chacun), 12 formations courtes, 30 compétences, 12 badges, 3 entreprises,
5 opportunités + utilisateurs de démo (admin, formateur, mentor, 3 apprenants). Comptes démo : mot de passe `DigitalAccess2026!`.
