# Plan de mise en œuvre — Access Academy v2 (Phases 3–4)

> Basé sur l'**audit d'écart vérifié du 2026-07-12** (6 agents, 54 points confrontés au code réel)
> et sur la **priorisation du cahier des charges §48**. Les sprints sont classés par
> **priorité décroissante** (valeur ÷ effort, en débloquant d'abord les boucles cœur).
> La **table de couverture** en fin de document garantit qu'aucun écart n'est laissé.

**Périmètre déjà LIVRÉ (MVP §49 + Phases 1–2) — ne pas refaire :** site public, catalogues
(formations/parcours/écoles), auth, espace apprenant (dashboard, mes formations, mes parcours,
projets, évaluations, certificats, favoris, paramètres), lecteur immersif + quiz notés serveur,
projets/soumissions, certificats PDF+QR + vérification publique, paiement Mobile Money manuel,
admin (dashboard, écoles, parcours, formations, utilisateurs, paiements, certificats) avec
constructeurs formation & parcours, principe formation-réutilisable + tarification intelligente,
workflow de publication.

**Conventions d'effort :** `S` < 1 j · `M` 1–3 j · `L` 3–7 j · `XL` > 1 semaine.
Chaque lot indique : Objectif · Tâches · Dépendances · Critères d'acceptation (CA).

---

## Sprint 1 — Débloquer le cycle pédagogique · finitions « backend prêt » 🟢

> **Pourquoi en premier :** le code serveur existe déjà pour ces 4 points ; il ne manque que
> l'UI. ROI maximal, effort minimal, et cela débloque la boucle *projet → correction → certificat*
> et la communication apprenant.

### 1.1 — Espace correcteur / file de correction `M`
- **Objectif :** rendre exploitable `reviewSubmission()` (aujourd'hui **code mort**).
- **Tâches :** groupe de routes `/correction` (ou section admin « Soumissions ») gardé
  `requireRole(["GRADER","INSTRUCTOR"])` + admins ; liste des soumissions à corriger (scopée par
  `CourseInstructor` pour les non-admins) ; fiche de correction (aperçu livrable, grille/`rubric`,
  saisie note + feedback, boutons Valider / Demander une révision / Rejeter) branchée sur
  `reviewSubmission` (lib/learn-actions.ts:735).
- **Dépendances :** aucune (action serveur prête).
- **CA :** un GRADER voit uniquement les soumissions de ses formations, les corrige, l'apprenant
  reçoit la notification + la progression/certificat se recalcule ; un non-autorisé est bloqué.

### 1.2 — Notifications in-app (cloche + centre) `S`
- **Objectif :** brancher l'UI sur `lib/notify.ts` / `notify-actions.ts` (déjà complets).
- **Tâches :** remplacer la pastille placeholder (SiteHeader.tsx:320) par une **cloche réelle**
  (badge `unreadCount`) + panneau déroulant (liste + « marquer lu » / « tout marquer lu »).
- **Dépendances :** aucune.
- **CA :** le compteur reflète l'état réel ; cliquer marque lu ; le panneau liste les dernières
  notifications avec liens.

### 1.3 — Recherche globale `M`
- **Objectif :** exposer `searchAll()` (lib/catalogue.ts:629, aujourd'hui code mort).
- **Tâches :** page `/recherche` (résultats classés par type : formations, parcours, écoles) ;
  brancher la barre du header dessus (au lieu de `/formations?q=`) ; **étendre** `searchAll` aux
  sources manquantes utiles (compétences, projets publics) ; état vide + suggestions simples.
- **Dépendances :** idéalement après Portfolio/Projets publics (Sprint 3) pour indexer les projets.
- **CA :** une recherche renvoie des résultats multi-types classés ; la barre header pointe `/recherche`.

### 1.4 — Coupons de réduction `M`
- **Objectif :** activer le modèle `Coupon` (orphelin) de bout en bout.
- **Tâches :** page `/admin/coupons` (CRUD : code, type, valeur, plafond, expiration, actif) ;
  champ « code promo » au checkout (`/paiement/[type]/[slug]`) ; application dans
  `getCheckoutInfo`/`submitManualPayment` (validation, décrément `usedCount`, refus si expiré/épuisé).
- **Dépendances :** aucune.
- **CA :** un coupon valide réduit le montant recalculé serveur ; usage tracé ; coupon invalide refusé.

---

## Sprint 2 — Espace formateur (§29) 🟠

> **Pourquoi :** aujourd'hui un formateur doit passer par l'admin global. C'est le rôle
> intervenant le plus utilisé après l'apprenant.

- **2.1 Coque `/formateur`** gardée `requireRole(["INSTRUCTOR"])` `S`
- **2.2 Tableau de bord formateur** (§29.1) : ses formations via `CourseInstructor`, apprenants,
  note moyenne, soumissions en attente `M`
- **2.3 Gestion de contenu** des formations affectées (§29.2) : réutiliser `CourseBuilder` **scopé
  au propriétaire** (vérif `CourseInstructor`) `M`
- **2.4 Suivi apprenants** (§29.3) : progression par apprenant/formation `M`
- **2.5 Correction** (§29.4) : réutilise l'espace correcteur (1.1), filtré sur ses formations `S`
- **2.6 Annonces** aux inscrits d'une formation `S`
- **CA :** un INSTRUCTOR gère uniquement ses formations et ses apprenants, sans accès admin global.

---

## Sprint 3 — Employabilité : Portfolio + publication de projets (§16.7, §19.5) 🔴

> **Pourquoi :** c'est le **cœur de la mission** de l'académie (« pas d'employabilité sans preuve »).
> Entièrement absent (aucun modèle).

- **3.1 Modèle de données** `M` : `Portfolio` / `PortfolioItem` (présentation, compétences,
  projets, certificats, outils, expériences, liens, visibilité publique/privée) ; champ
  `isPublic`/`publishedAt` sur `Submission`.
- **3.2 Publication d'un projet validé** (§19.5) `M` : depuis un projet approuvé →
  ajout au portfolio / galerie publique.
- **3.3 `/espace/portfolio`** (édition) `M` + **page publique `/portfolio/[handle]`** `M`.
- **3.4 Agrégation** compétences validées + certificats + projets publiés `S`.
- **3.5 Upload de fichiers génériques** (pas seulement images) pour les livrables projet `S`.
- **3.6 Partage** (lien public + méta OG) `S`.
- **Dépendances :** correction de projets (Sprint 1.1) pour qu'il y ait des projets validés.
- **CA :** un apprenant publie un projet validé, compose son portfolio, une page publique
  présente ses preuves ; visibilité contrôlée.

---

## Sprint 4 — Compétences & évaluations complètes (§21, §18) 🟡

- **4.1 Référentiel de compétences en admin** (§21) `M` : CRUD `Skill`, rattachement aux formations
  dans `CourseBuilder`, domaine/critères.
- **4.2 Profil de compétences apprenant** (§21.4) `M` : compétences acquises + niveau + preuves
  (projet/évaluation/équivalence) dans `/espace`.
- **4.3 Types de questions manquants** (§18.1) `L` : champs de saisie + correction pour **réponse
  courte/longue** (auto ou manuelle), **appariement**, **ordonnancement** (aujourd'hui non jouables
  dans QuizRunner).
- **4.4 Correction manuelle des devoirs/examens** (§18.4) `M` : brancher `AssessmentAttempt`
  (statut `GRADED`, `feedback`, `gradedById`) à une UI correcteur (réutilise Sprint 1.1) ;
  distinguer les états devoir/examen (à faire/en cours/soumises/corrigées) manquants côté apprenant.
- **4.5 Banque de questions réutilisable** (§18.3) `L` : modèle `QuestionBank` (catégories,
  niveaux, tags, compétences, versioning, stats) + import.
- **4.6 Badges & types de certificats** (§20) `M` : émettre PARTICIPATION/SPECIALIZATION/
  SKILL_BADGE (enum déjà présent, émission non câblée).
- **CA :** les 7 types de questions sont jouables/corrigeables ; les compétences se gèrent en admin
  et se reflètent dans le profil apprenant ; les badges se délivrent.

---

## Sprint 5 — Prérequis, positionnement & recommandations IA (§22, §33) 🟡

> **Pourquoi :** reporter la valeur IA de la v1 (diagnostic d'orientation/maturité **non repris** en v2).

- **5.1 Prérequis structurés inter-formations** (§22.1) `M` : câbler `CoursePrerequisite`
  (modèle orphelin) dans l'admin + affichage/verrouillage côté fiche/lecteur (aujourd'hui = texte libre).
- **5.2 Test de positionnement** (§22.2) `L` : **reporter le diagnostic IA v1** (génération +
  évaluation, tool-use forcé) → accès direct / orientation / dispense / reco préparatoire.
- **5.3 Équivalences** (§22.3–22.4) `M` : dépôt de preuve (certificat/diplôme/portfolio) +
  validation admin (acceptée/refusée/partielle/conditionnelle) ; `AccessType.EQUIVALENCE` existe.
- **5.4 Moteur de recommandations personnalisées** (§33) `L` : exploiter objectif/niveau/historique/
  résultats/compétences/favoris (aujourd'hui = simple « populaires ») ; types de reco (suite/
  mise à niveau/spécialisation/projet).
- **Dépendances :** onboarding complet (Sprint 9.3) alimente le moteur.
- **CA :** les prérequis verrouillent réellement ; un test de positionnement oriente ; les
  équivalences réduisent le prix (cf. §27.4) ; les recos exploitent le profil.

---

## Sprint 6 — Cohortes & événements (§23, §24) 🔴

- **6.1 Cohortes** (§23) `L` : modèle `Cohort` (dates début/fin, effectif, calendrier), inscription
  en cohorte, tableau de bord de suivi de cohorte, échéances alimentant le dashboard apprenant (§16.1).
- **6.2 Événements / webinaires** (§24) `L` : modèle `Event`, agenda/calendrier, inscription,
  rappels/notifications, rendez-vous (alimente le dashboard §16.1).
- **CA :** créer une cohorte datée avec inscrits ; publier un événement, s'y inscrire, recevoir un rappel.

---

## Sprint 7 — Communauté, commentaires & support (§25, §35) 🔴

- **7.1 Modèles communauté** `M` : canaux/sujets/réponses (par école/parcours/cohorte) + `Comment`
  lié à `Lesson`.
- **7.2 Forum** (§25) `L` : listes, fils, création, mentions, modération.
- **7.3 Commentaires par leçon** dans le lecteur `M`.
- **7.4 Support / tickets** (§35) `M` : modèle `Ticket`/`TicketMessage`, `/espace/support`
  (création + fil), file de traitement admin.
- **7.5 Temps réel** (optionnel, §25) `M` : présence/mises à jour live.
- **CA :** un apprenant poste dans un forum, commente une leçon, ouvre un ticket suivi jusqu'à
  résolution ; l'admin modère.

---

## Sprint 8 — Espaces de gouvernance pédagogique (§7.5, §7.6, §7.7) 🟠

- **8.1 Responsable d'école** (§7.6) `L` : espace scopé à son école (présentation, parcours/formations
  rattachés, proposition de formateurs, ressources, événements, stats, demandes de modif à l'admin).
- **8.2 Responsable de parcours** (§7.7) `L` : espace scopé à ses parcours (phases/ordre, sélection
  de formations existantes + obligatoire/optionnel, projets transversaux, progression, soutenances).
- **8.3 Mentor / tuteur** (§7.5) `L` : rattachement mentor↔groupe d'apprenants, vues de progression,
  proposition de RDV, messages/recommandations, signalement des apprenants en difficulté.
- **Dépendances :** cohortes (Sprint 6) pour les groupes de mentorat ; événements pour les RDV.
- **CA :** chaque responsable/mentor agit uniquement dans son périmètre, sans accès admin global.

---

## Sprint 9 — Finitions apprenant & onboarding (§15.4, §16, §17) 🟡

- **9.1 3ᵉ zone du lecteur** (§17.1) `M` : panneau complémentaire (notes / discussion / questions /
  aide / ressources / transcription) ; **notes & signets** (modèles + UI).
- **9.2 Accessibilité lecteur** (§17.2–17.3) `M` : sous-titres VTT réels, transcriptions, réglage de
  taille de police, contrôle de vitesse pour embeds.
- **9.3 Onboarding complet** (§15.4) `M` : étape dédiée post-inscription (5 questions manquantes :
  domaine, disponibilité, langue, rythme, métier visé) alimentant le moteur de reco (Sprint 5.4).
- **9.4 Profil enrichi** (§16.9) `S` : langues, disponibilités, liens professionnels, préférences,
  confidentialité/visibilité.
- **9.5 Filtres manquants** `S` : `/espace/projets` (formation/parcours/statut/échéance/note),
  `/espace/evaluations` (états complets) ; favoris étendus (écoles/projets/événements, §16.8).
- **9.6 Divers** `S` : partage social du certificat (§16.6), vérification par numéro (§20.4).
- **CA :** onboarding en une étape guidée ; lecteur avec notes/sous-titres ; filtres opérationnels.

---

## Sprint 10 — Entreprises (§28) 🔵

- **10.1 Admin des organisations** `M` : CRUD `Organization`/`OrganizationMember` (aujourd'hui vides).
- **10.2 Espace entreprise connecté** `L` : dashboard équipe, sièges/licences, rapports de progression.
- **10.3 Prise en charge / facturation B2B** (§27.2, §27.4) `M` : affectation de licences,
  remises entreprise dans le calcul de prix.
- **10.4 Offres/missions + recherche de talents + candidatures** `XL`.
- **Dépendances :** portfolio (Sprint 3) pour la recherche de talents ; paiements (Sprint 11) pour la facturation.
- **CA :** une entreprise inscrit ses collaborateurs, suit leur progression, publie une mission,
  recherche des talents via leurs portfolios.

---

## Sprint 11 — Paiements avancés & facturation (§27.1, §27.5, §27.6) 🔵

- **11.1 Factures / reçus PDF** (§27.5) `M` : numérotation, génération PDF après paiement validé,
  téléchargement.
- **11.2 Statuts pilotables** (§27.3) `S` : transitions/UI pour PARTIAL, REFUNDED, EXPIRED
  (déclarés mais inatteignables).
- **11.3 Échéancier / acompte** (§27.6) `L` : acompte, échéances, relances, restriction d'accès
  selon solde.
- **11.4 Abonnements** (§27.1) `L` : modèle `Subscription`, plans, cycle de facturation, gestion admin.
- **CA :** un reçu PDF est émis après validation ; un remboursement se trace ; un abonnement/échéancier fonctionne.

---

## Sprint 12 — Administration complète & rapports (§30, §34) 🔵

- **12.1 Sections admin manquantes** (§30.1, 7/21 aujourd'hui) `L` : Compétences, Évaluations,
  Projets, Cohortes, Formateurs, Entreprises, Commandes, Coupons (Sprint 1.4), Notifications,
  Rapports, Paramètres, Journal d'audit (`AuditLog` existe).
- **12.2 Versioning des formations publiées** (§30.5) `L` : nouvelle version, apprenants maintenus
  sur l'ancienne, migration sélective, historique, comparaison.
- **12.3 Compléments constructeurs** `M` : duplication contrôlée de formation, projet de fin de
  formation, substitutions/équivalences de parcours, certification configurable (au-delà d'un intitulé).
- **12.4 Éditeur d'école enrichi** (§30.4) `M` : responsables, métiers, formateurs, ressources,
  événements, stats (complète Sprint 8.1).
- **12.5 Rapports avancés** (§34.2–34.5) `L` : analytique par formation (complétion/abandon/
  satisfaction/questions difficiles), par parcours (phases/certification/formations bloquantes),
  par école, par entreprise ; graphiques Recharts + exports.
- **12.6 Publication programmée** (§31) `S` : planificateur auto-publiant l'état `SCHEDULED`.
- **CA :** le menu admin couvre les 21 domaines ; les rapports exploitables ; le versioning protège
  les apprenants en cours.

---

## Sprint 13 — Multilingue réel (§37) `XL` ⚪ (Phase 4)

- Infrastructure i18n (ex. `next-intl`) ; interface externalisée ; entité de traductions de
  contenu ; sous-titres/transcriptions par langue. **Lourd — à planifier en Phase 4** ; aujourd'hui
  seule `Course.language` est stockée comme étiquette.

---

## Hors périmètre initial (§5.2) — non planifié
Application mobile native · marketplace ouverte de formateurs · proctoring biométrique ·
reconnaissance faciale · visioconférence interne · correction IA de projets complexes ·
paiement crypto · diplômes universitaires réglementés · gestion d'établissement scolaire traditionnel.

---

## Table de couverture — chaque écart de l'audit → sprint

| Écart (réf. cahier) | Statut audit | Sprint |
|---|---|---|
| Espace correcteur / UI de correction §7.4, §19.4 | manquant (action en code mort) | **1.1** |
| Notifications — centre/cloche §26 | partiel (backend prêt) | **1.2** |
| Recherche globale §32 | partiel (searchAll mort) | **1.3** |
| Coupons §27.2 | orphelin | **1.4** |
| Espace formateur §29 | manquant | **2** |
| Portfolio §16.7 | manquant | **3.1–3.4** |
| Publication de projets §19.5 | manquant | **3.2** |
| Upload fichiers génériques (livrables) §19.2 | partiel | **3.5** |
| Référentiel compétences (admin) §21 | partiel | **4.1** |
| Profil de compétences apprenant §21.4 | manquant | **4.2** |
| Types de questions (courte/longue/appariement/ordonnancement) §18.1 | partiel | **4.3** |
| Correction manuelle devoirs/examens §18.4 + états éval. §16.5 | partiel | **4.4** |
| Banque de questions §18.3 | manquant | **4.5** |
| Types de certificats/badges §20.1–20.2 | partiel | **4.6** |
| Prérequis structurés inter-formations §22.1 | orphelin | **5.1** |
| Test de positionnement §22.2 (diagnostic IA v1) | manquant | **5.2** |
| Équivalences §22.3–22.4 | manquant | **5.3** |
| Recommandations personnalisées §33 | partiel | **5.4** |
| Cohortes §23 | manquant | **6.1** |
| Événements §24 + RDV/échéances dashboard §16.1 | manquant | **6.2** |
| Communauté / forum §25 | manquant | **7.1–7.2** |
| Commentaires par leçon §5.1 | manquant | **7.3** |
| Support / tickets §35 | manquant | **7.4** |
| Responsable d'école §7.6 | manquant | **8.1** |
| Responsable de parcours §7.7 | manquant | **8.2** |
| Mentor §7.5 | manquant | **8.3** |
| Lecteur 3ᵉ zone + notes/signets §17.1–17.2 | partiel | **9.1** |
| Accessibilité lecteur (sous-titres/transcription/police) §17.3 | partiel | **9.2** |
| Onboarding complet §15.4 | partiel | **9.3** |
| Profil enrichi §16.9 | partiel | **9.4** |
| Filtres projets/évaluations §16.4–16.5 · favoris §16.8 | partiel | **9.5** |
| Partage certificat §16.6 · vérif par numéro §20.4 | mineur | **9.6** |
| Entreprises — admin orgs / espace / missions / talents §28 | partiel (vitrine) | **10** |
| Prise en charge & remises entreprise §27.2, §27.4 | manquant | **10.3** |
| Factures / reçus §27.5 | manquant | **11.1** |
| Statuts paiement PARTIAL/REFUNDED/EXPIRED §27.3 | partiel | **11.2** |
| Échéancier / acompte §27.6 | manquant | **11.3** |
| Abonnements §27.1 | manquant | **11.4** |
| Menu admin (7/21) + Commandes §30.1 | partiel | **12.1** |
| Versioning formations §30.5 | manquant | **12.2** |
| Compléments constructeurs formation/parcours §30.2–30.3 | partiel | **12.3** |
| Éditeur d'école enrichi §30.4 | partiel | **12.4** |
| Rapports avancés §34.2–34.5 | partiel | **12.5** |
| Publication programmée §31 (scheduler) | mineur | **12.6** |
| Multilingue réel §37 | partiel (étiquette) | **13** |
| Extensions §5.2 (mobile, marketplace, proctoring…) | hors périmètre | — |

**Déjà livré et validé par l'audit (aucune action) :** Mes formations §16.2, Mes parcours §16.3,
Mes certificats §16.6, Vérification publique §20.4, Workflow de publication §31, Paiement
Mobile Money manuel §27.2–27.3, + tout le socle MVP/Phases 1–2.
