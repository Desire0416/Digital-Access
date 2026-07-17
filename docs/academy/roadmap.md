# Access Academy v2 — Feuille de route harmonisée

> **Plan de travail unique** qui fusionne (a) les 9 chantiers du briefing de migration
> et (b) les sprints S6–S13 du `plan-mise-en-oeuvre-v2.md` (détail par lot + critères
> d'acceptation y restent la référence fine). Le web (`apps/web`) n'est jamais touché.
> Base de données dédiée : `packages/academy-db` (Neon `ACADEMY_DATABASE_URL`).

## Déjà livré (ne pas refaire)

- **Socle v2** : schéma dédié (~33 tables), auth locale, catalogue public (formations /
  parcours / écoles), filtres/recherche URL-driven, aiguilleur post-connexion.
- **Espace apprenant** : dashboard, mes formations/parcours, favoris, paramètres,
  lecteur immersif `(learn)` + quiz notés serveur (7 types jouables : QCU/QCM/V-F/
  réponse courte/appariement/ordonnancement ; LONG_ANSWER = manuel).
- **Projets & certification** : dépôt → correction à la grille → validation → badge par
  preuve → portfolio auto ; certificats PDF+QR type-aware (6 types) + `/certificats/verifier`.
- **Employabilité (base)** : Portfolio public `/portfolio/[slug]`, passeport de compétences
  `/espace/competences`, référentiel compétences admin.
- **Paiement** : Mobile Money **manuel** (preuve → validation admin ; invariant sécurité)
  + coupons (CRUD admin + application checkout).
- **Espaces rôles** : **formateur** `(formateur)/*` (dashboard, formations, éditeur scopé
  propriétaire, apprenants) ✅ *(= « studio instructeur » du briefing, item 3)*,
  **correcteur** `(correcteur)/*`.
- **Parcours-cœur** : prérequis inter-formations (verrou réel), test de positionnement IA
  par formation, équivalences / reconnaissance des acquis, recommandations personnalisées.
- **Admin** : dashboard KPI, écoles, parcours, formations, utilisateurs, paiements,
  certificats, coupons, compétences, équivalences (gardes anti-élévation).
- **Catalogue maître seedé (DRAFT)** : 10 écoles, 180 formations, 92 programmes, 46 parcours.
- **Transverse** : notifications (cloche + centre), recherche globale, responsive 375px,
  menu mobile accordéon.

---

## Track transversal — Contenu (parallèle à tous les sprints)

**T. Enrichissement du catalogue** *(briefing item 1)* — les 180 formations sont seedées
en **DRAFT** (fiches sans modules/leçons/quiz réels). À enrichir **par vagues** (Vague 1
prioritaire = parcours de lancement). Outil existant : `/admin/import-formation` (upload
docx/pdf/md → extraction IA → CareerPath/Course complet). Sortie de chaque vague : passer
les formations en `PUBLISHED` après relecture. **Se mène en continu, en fond des sprints ci-dessous.**

---

## Sprints restants (ordre d'exécution)

### Sprint 6 — Cohortes & Événements (§23, §24) — *Tome 7 (partie 1)* ✅ LIVRÉ (2026-07-16)
Modèles `Cohort`/`CohortMember`/`CohortInstructor` + `Event` (unifié : sessions de cohorte
+ événements autonomes) / `EventRegistration` / `Announcement`. Cohorte gratuite (join direct)
ou payante (tunnel Mobile Money, purpose COHORT, invariant respecté). Espaces apprenant
(`/espace/cohortes`, `/espace/agenda`), public (`/evenements`), admin (`/admin/{cohortes,evenements}`).
Échéances/RDV/annonces au dashboard (§16.1). Rappel cron (`/api/cron/reminders`, secret →
Vercel Cron à configurer). **Débloque le Sprint 8 (mentorat par groupe).**

### Sprint 7 — Communauté, commentaires & support (§25, §35) — *briefing item 4 + Tome 7 (partie 2)*
Scindé en deux tranches :
- **7A ✅ LIVRÉ (commit `362b0fe`)** — Forum contextualisé (formation/parcours/école/cohorte) :
  discussions/réponses threadées, réactions, suivre, marquer solution, signaler ;
  commentaires par leçon dans le lecteur ; file de modération admin `/admin/moderation`.
- **7B ✅ LIVRÉ (commit `38751ef`)** — Support/tickets §35 : `/espace/support` (ouvrir/répondre/
  clôturer, fil staff/apprenant/système) + file admin `/admin/support` (répondre, statut,
  priorité, assignation) + centre d'aide public `/aide` (FAQ administrable via `/admin/faq`).
  Temps réel hors périmètre (Ably retiré en v2 ; server-render + revalidate suffisent).

### Sprint 8 — Gouvernance pédagogique (§7.5–7.7)
Espaces scopés : **responsable d'école**, **responsable de parcours**, **mentor/tuteur**
(rattachement mentor↔groupe via cohortes). Aucun accès admin global.
**Dépend du Sprint 6.**

### Sprint 9 — Finitions apprenant, onboarding & CV Builder (§15–17) — *+ briefing item 8 (Tome 5)*
3ᵉ zone du lecteur (notes/signets), accessibilité (sous-titres/vitesse), onboarding complet
(5 questions → alimente les recos), profil enrichi, filtres projets/évaluations, partage
certificat. **+ CV Builder** (générateur CV depuis passeport de compétences + projets
publiés) et passeport avancé (Tome 5).

### Sprint 10 — Entreprises (§28) — *briefing item 6 (Tome 8)*
Admin des organisations, espace entreprise connecté (équipe, licences, rapports de
progression), facturation B2B, offres/missions + recherche de talents via portfolios.
**Dépend du Portfolio (fait) et du Sprint 11 (facturation).**

### Sprint 11 — Paiements avancés & abonnements (§27) — *briefing items 2 + 5*
**Intégration CinetPay/FedaPay** (Mobile Money automatique — le manuel reste en secours ;
schéma prêt : provider CINETPAY/FEDAPAY, vérif signature webhook). Factures/reçus PDF,
statuts PARTIAL/REFUNDED/EXPIRED, échéancier/acompte, **abonnements MONTHLY/YEARLY**.

### Sprint 12 — Administration complète & rapports (§30, §34)
14 sections admin manquantes (cohortes, événements, formateurs, entreprises, commandes,
notifications, rapports, audit…), versioning des formations publiées, rapports analytiques
(Recharts + exports), publication programmée (scheduler `SCHEDULED`).

### Sprint 13 — IA avancée (Tome 10) — *briefing item 9*
Couche IA transversale au-delà de l'existant (diagnostic, positionnement, import,
recommandations) : assistant pédagogique apprenant, aide formateur (génération quiz/leçons),
correction assistée, aide projet/portfolio/**CV**/entretien, matching entreprise↔talent,
prompt library, orchestrateur + journal IA (gouvernance §10). Déploiement MVP→avancé.

### Sprint 14 — Multilingue réel (§37) — *Phase 4*
Infrastructure i18n (next-intl), interface externalisée, entité de traductions de contenu,
sous-titres/transcriptions par langue. Lourd — planifié en dernier.

---

## Hors périmètre (§5.2)
App mobile native · marketplace ouverte de formateurs · proctoring · visio interne ·
paiement crypto · diplômes réglementés.

## Comptes de démonstration (base dédiée v2)
`superadmin@` (SUPER_ADMIN) · `pedagogie@` (ACADEMIC_ADMIN) · `formateur@` (INSTRUCTOR) ·
`apprenant@` (LEARNER) — tous `@digitalaccess.ci` / `DigitalAccess2026!`.

## Régénérer les données (base academy dédiée)
```bash
cd packages/academy-db
npx prisma db push            # réveiller Neon via le pooler d'abord
npx prisma generate
# ⚠️ rejouer les index partiels après CHAQUE db push :
pnpm --filter @da/academy-db partial-indexes
```
