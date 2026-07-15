# Briefing de contexte — Digital Access (migration PC)

> Ce document contient tout le contexte nécessaire pour reprendre le travail sur un nouvel ordinateur avec Claude Code. Colle-le dans ta première conversation Claude Code après avoir cloné le repo et installé les dépendances.

---

## Projet

**Digital Access** = monorepo Turborepo (npm workspaces), 2 apps :

- `apps/web` (port 3000) → digitalaccess.ci — site vitrine + portail client + CRM admin
- `apps/academy` (port 3001) → academy.digitalaccess.ci — plateforme e-learning Access Academy

Interface **100% française**, devise **FCFA (XOF)**, cible **Côte d'Ivoire** (mobile 3G/4G).

## Ce qui est FAIT (14 sprints + post-launch + refonte Academy)

### apps/web — COMPLET
- Homepage animée (hero collage de bureau) + toutes les pages marketing (services, portfolio, blog, tarifs, a-propos, contact, devis wizard, FAQ, légales)
- Auth (email/password + Google OAuth + vérification email Resend)
- Portail client (dashboard, projets+timeline+messaging, factures PDF, maintenance, support/tickets)
- CRM admin complet (dashboard KPI, leads pipeline kanban, projets, factures CRUD+PDF, tickets, blog CRUD, portfolio CRUD, utilisateurs)
- Rôles avancés CRM : COMMERCIAL, CHEF_PROJET, RESPONSABLE_COMMERCIAL + permissions explicites
- Prospects (liste+kanban+fiche), Audits structurés, Activités/Tâches, Opportunités (Deal pipeline+devis), Conversion deal→projet
- Import prospect IA (upload Word/PDF → extraction Claude → création auto)
- Chatbot IA flottant (streaming, base de connaissances réelle)
- SEO complet (JSON-LD, OG dynamiques, sitemap, breadcrumb, 6 pages services locales)
- Responsive 375px vérifié partout

### apps/academy — REFONTE COMPLÈTE (cahier des charges 10 tomes)
- **Schéma dédié** (`packages/academy-db`) sur Neon séparée — 40+ modèles
- 10 écoles (S00-S09), 180 formations, 92 programmes, 46 parcours métiers (catalogue maître seedé)
- Catalogue public (formations courtes + parcours métiers + écoles + projets portfolio)
- Player immersif (markdown + vidéo YouTube/Vimeo + quiz QCU/QCM/V-F, progression, streak)
- Espace apprenant (dashboard, mes formations, passeport compétences, badges, certificats, portfolio, projets, recommandations IA, favoris, équivalences)
- Espace formateur (dashboard, mes formations, apprenants)
- Espace correcteur (file de correction + formulaire de revue)
- Paiement Mobile Money manuel (preuve + validation admin, invariant sécurité)
- Certificats PDF (react-pdf, QR code, vérification publique)
- Notifications in-app (cloche + panneau)
- Recherche globale
- Coupons (admin CRUD + application checkout)
- Admin complet (dashboard KPI, écoles, parcours, formations, utilisateurs, paiements, soumissions, certificats, coupons)
- Diagnostic IA (maturité numérique par parcours + orientation publique)
- Import IA de formations (upload docx/pdf → extraction Claude → création)
- Méga-menu header (parcours, écoles, projets)
- Test de positionnement IA, prérequis inter-formations, équivalences, recommandations personnalisées

### Infrastructure en place
- **2 bases Neon PostgreSQL** : web (`DATABASE_URL`) + academy (`ACADEMY_DATABASE_URL`)
- **Vercel** déployé (auto-deploy GitHub) : digitalaccess.ci + academy.digitalaccess.ci
- **Resend** (domaine digitalaccess.ci vérifié)
- **Vercel Blob** (uploads images)
- **Ably** (chat temps réel academy)
- **Anthropic Claude** (chatbot web + diagnostic/import IA academy)
- **Google OAuth** (configuré, test mode)

## Ce qui RESTE à faire

Le catalogue maître (180 formations) est seedé en DRAFT. Voici ce qui reste selon le cahier des charges :

1. **Enrichir le contenu** des 180 formations (modules, leçons, quiz) — progressivement par vagues (Vague 1 prioritaire)
2. **Intégrer CinetPay/FedaPay** pour le paiement Mobile Money automatique (le manuel fonctionne déjà)
3. **Studio instructeur** pour la nouvelle architecture (adapter au nouveau schéma academy-db)
4. **Forum/Chat par formation** (adapter au nouveau schéma)
5. **Abonnements** (plans MONTHLY/YEARLY pour accès illimité)
6. **Espace entreprises** (comptes vérifiés, offres, matching talents — Tome 8)
7. **Campus communautaire** avancé (challenges, hackathons, events — Tome 7)
8. **CV Builder + passeport de compétences** avancé (Tome 5)
9. **IA avancée** (aide formateur, correction assistée, aide projet/CV — Tome 10)
10. **Google OAuth production** (ajouter redirect URI prod dans Google Cloud)
11. **Sentry** monitoring
12. **Remplacer les numéros Mobile Money placeholder** dans `apps/academy/lib/site.ts` (pour les vrais)

## Comptes de démo (tous mdp : `DigitalAccess2026!`)

| Email | Rôles | App |
|-------|-------|-----|
| admin@digitalaccess.ci | ADMIN, SUPER_ADMIN | web + academy |
| koffi@digitalaccess.ci | INSTRUCTOR | academy |
| apprenant@digitalaccess.ci | LEARNER | academy |
| client@digitalaccess.ci | CLIENT | web |

## Commandes clés

```bash
npm run dev -w web        # apps/web sur :3000
npm run dev -w academy    # apps/academy sur :3001
npm run build -w web      # Build web
npm run build -w academy  # Build academy

# Prisma (academy-db)
cd packages/academy-db
npx prisma db push          # Push schema → Neon
npx prisma generate         # Régénérer le client
npx tsx --env-file=../../.env prisma/catalogue-seed.ts      # Seed catalogue part 1
npx tsx --env-file=../../.env prisma/catalogue-seed-part2.ts # Seed catalogue part 2
```

## Architecture technique clé

- **Next.js 15** (App Router, Server Actions, Server Components)
- **Prisma** sur **Neon** PostgreSQL (2 bases séparées)
- **Auth.js v5** (credentials + JWT + Google OAuth)
- **Tailwind CSS 4** (thème DA dans globals.css via `@theme`)
- **Framer Motion** (transitions, hover, stagger)
- **Resend** + react-email (templates brandées)
- **Vercel Blob** (stockage fichiers)
- Dégradé signature : `#5B3FA8 → #00BCD4` (violet → cyan)
- Toutes les pages sont **dynamiques** (`force-dynamic` dans root layout)

## Gotchas importants

1. **Neon autosuspend** : la base s'endort après inactivité — le premier appel peut timeout. Utiliser le pooler pour réveiller.
2. **Env vars** : le `.env` est à la racine, chargé via `loadEnv({path:'../../.env'})` dans chaque `next.config.ts`.
3. **Cookies partagés** : Auth.js partage les cookies entre localhost:3000 et :3001 — re-login quand tu changes d'app en dev.
4. **Prisma generate** : nécessaire après chaque clone (`postinstall` le fait normalement via `npm install`).
5. **tsx --env-file** : utiliser `--env-file=../../.env` (pas `source .env`) pour les scripts seed sur Windows.
6. **`@react-pdf/renderer`** : nécessite `serverExternalPackages` dans next.config.ts.
7. **Lucide v1** : pas d'icône `Linkedin` — utiliser `Briefcase` ou autre alternative.

## Cahier des charges

Les 10 tomes du cahier des charges sont dans `Digital_Access_Academy/` à la racine du repo (fichiers .docx). Le catalogue maître est dans le même dossier.
