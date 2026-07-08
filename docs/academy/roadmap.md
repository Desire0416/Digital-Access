# Digital Access Academy — Feuille de route

Reconstruction par phases (les Lots du CDC maître regroupés). Le web n'est jamais touché.

| Phase | Lots CDC | Contenu | État |
|---|---|---|---|
| **0 — Socle : shell & docs** | 1 | Nettoyage ancienne UI · shell institutionnel (header/nav/footer) · homepage data-driven · `/schools`(+détail), `/career-paths`(+détail), `/short-courses`(+détail), `/certifications`, `/companies` · docs | ✅ Fait |
| **1 — Modèle de données** | 2 | Schéma Prisma (24 modèles) · migration Neon (destructive côté academy, web préservé) · seed complet · types + helpers | ✅ Fait |
| **2 — Public + Auth** | 3-4 | Filtres/recherche catalogue (école/niveau/recherche, URL-driven) · inscription→LearnerProfile · 9 rôles + gardes de route + aiguilleur post-connexion | ✅ Fait |
| **3 — Espace apprenant** | 5 | `/dashboard` (vue d'ensemble, mes-cours, passeport, badges, certificats, portfolio, opportunités) · player leçon immersif `(learn)` + quiz noté serveur · modèle `LessonProgress` · contenu+quiz enrichis (6 parcours) | ✅ Fait |
| **4 — Projets & Certification** | 6-7 | Moteur projets (dépôt liens/captures/déclaration IA → revue à la grille par relecteur → validation) · badges par preuve · portfolio auto-alimenté · certificats vérifiables (react-pdf + QR, `/api/certificates/[id]`) · `/verify/[code]` public · émission conditionnée (parcours terminé + projets validés) | ✅ Fait |
| **5 — Administration** | 8 | Back-office CRUD complet (écoles→paiements→coupons→reports) | À faire |
| **6 — Entreprises** | 9 | Espace entreprise (comptes vérifiés, offres/missions, recherche talents, candidatures, B2B) | À faire |
| **7 — Finitions** | 10 | Responsive, SEO/OG, sécurité, notifications, gate qualité | À faire |
| **8 — Intelligence Artificielle** | Tome 10 | Assistant pédago, aide projet/CV/entretien, correction assistée, matching, prompt library | À faire |

## Comptes de démonstration (seed)

- `admin@digitalaccess.ci` — ADMIN / SUPER_ADMIN
- `koffi@digitalaccess.ci` — INSTRUCTOR
- `mentor@digitalaccess.ci` — MENTOR
- `apprenant@digitalaccess.ci`, `yann@digitalaccess.ci`, `mariam@digitalaccess.ci` — LEARNER
- Mot de passe commun : `DigitalAccess2026!`

## Regénérer les données

```bash
# depuis la racine du repo
npx prisma generate --schema=packages/db/prisma/schema.prisma
npx prisma db push  --schema=packages/db/prisma/schema.prisma   # réveiller Neon via le pooler d'abord
npx tsx -r dotenv/config packages/db/prisma/seed.ts
```
