# Digital Access Academy — Architecture

Refonte 2026 : passer d'un e-learning basique à une **académie orientée compétences, projets, employabilité**.
Principe fondateur : **« Apprendre en faisant »** — pas de compétence sans pratique, pas de certification sans projet, pas d'employabilité sans preuve.

## Monorepo

- `apps/web` — site principal Digital Access (**intouché** par la refonte Academy).
- `apps/academy` — Digital Access Academy (reconstruite sur place).
- `packages/db` — schéma Prisma + client, **partagé** (une seule base Neon).
- `packages/{ui,auth,email,config}` — design system, auth, e-mails, config partagés.

## Séparation web / academy dans la base partagée

Un seul schéma Prisma, une seule base Neon. Frontière :

- **Web + partagé (préservés)** : `User, VerificationToken, Account, Session, Notification, Lead, Project, ProjectStage, ProjectMessage, Invoice, MaintenanceContract, Ticket, TicketMessage, BlogPost, Testimonial, PortfolioProject`.
- **Academy (refonte)** : les 24 modèles ci-dessous.
- `User.roles` est étendu (MENTOR, REVIEWER, COMPANY, ACADEMIC_MANAGER) ; l'enum web `ProjectType` reste réservé au web (l'academy utilise `ProfessionalProjectType`).

## Hiérarchie pédagogique

```
École → Parcours métier → Module → Leçon → Quiz
                        ↘ Projet professionnel → Dépôt → Correction (grille)
Compétences ⇄ Parcours (join) · Badges (par preuve) · Portfolio · Certificat vérifiable · Opportunités
```

## Stack

Next.js 15 (App Router, Server Actions), React 19, TypeScript strict, Tailwind CSS 4, Prisma + PostgreSQL (Neon),
Auth.js v5, Vercel Blob (uploads), `@react-pdf/renderer` (certificats), next/og (images de partage). Déploiement Vercel.

## Rôles (RBAC)

`VISITOR, LEARNER, INSTRUCTOR, MENTOR, REVIEWER, COMPANY, ACADEMIC_MANAGER, ADMIN, SUPER_ADMIN`.

## Couche de données publique

`apps/academy/lib/queries.ts` — requêtes résilientes (try/catch → vide) : `getSchools`, `getSchool`,
`getCareerPaths`, `getFeaturedCareerPaths`, `getCareerPath`, `getShortCourses`, `getShortCourse`, `getAcademyStats`.
Types de vue dans `lib/types.ts`.

Le cahier des charges complet (10 tomes + CDC maître) est la source de vérité — voir `cahier-des-charges.md`.
