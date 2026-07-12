# CAHIER DES CHARGES FONCTIONNEL COMPLET
## Plateforme Access Academy

**Projet :** Access Academy  
**Type de plateforme :** Académie numérique de formation, de certification et de préparation aux métiers  
**Version :** 1.0  
**Statut :** Spécifications fonctionnelles de référence  
**Porteur du projet :** Digital Access  
**Site cible :** `academy.digitalaccess.ci`  
**Destinataires :** équipe produit, UX/UI designers, développeurs, intégrateurs, formateurs, administrateurs, correcteurs, partenaires et prestataires techniques

---

# 1. Objet du document

Le présent cahier des charges définit les besoins fonctionnels de la plateforme Access Academy.

Il précise :

- le positionnement du produit ;
- l’organisation des formations, parcours métiers et écoles ;
- les utilisateurs et leurs rôles ;
- les pages publiques ;
- les espaces privés ;
- les règles métier ;
- les workflows ;
- les évaluations ;
- les projets ;
- les certifications ;
- les paiements ;
- les fonctions d’administration ;
- les rapports ;
- les critères d’acceptation ;
- les priorités de mise en œuvre.

Ce document constitue la référence fonctionnelle pour la conception UX/UI, le développement, les tests, la recette et la mise en production.

---

# 2. Vision du produit

Access Academy est une académie numérique orientée vers :

- l’acquisition de compétences concrètes ;
- la préparation à des métiers ;
- la réalisation de projets pratiques ;
- la certification ;
- l’employabilité ;
- la formation continue ;
- l’accompagnement professionnel ;
- la formation des équipes en entreprise.

La plateforme ne doit pas être une simple bibliothèque de vidéos. Elle doit constituer un environnement complet d’apprentissage en ligne, avec une présentation institutionnelle, moderne, fluide, professionnelle et adaptée aux usages mobiles.

---

# 3. Principe fonctionnel central

## 3.1. La formation est la brique pédagogique principale

Une formation est créée une seule fois dans le catalogue central.

Elle contient :

- des modules ;
- des leçons ;
- des activités ;
- des ressources ;
- des évaluations ;
- un projet éventuel ;
- des compétences ;
- des prérequis ;
- un certificat éventuel.

Une formation peut être :

- suivie individuellement ;
- intégrée à plusieurs parcours métiers ;
- rattachée à plusieurs écoles ;
- obligatoire dans un parcours ;
- optionnelle dans un autre ;
- utilisée comme prérequis ;
- proposée dans plusieurs cohortes ;
- affectée à plusieurs formateurs.

## 3.2. Le parcours métier assemble des formations existantes

Un parcours métier est une combinaison ordonnée de formations déjà présentes dans le catalogue.

Il ne duplique jamais le contenu des formations.

Il définit :

- les phases du parcours ;
- l’ordre des formations ;
- les formations obligatoires ;
- les formations optionnelles ;
- les règles de progression ;
- les équivalences ;
- les projets transversaux ;
- le portfolio attendu ;
- la certification métier finale.

## 3.3. L’école regroupe des formations et parcours existants

Une école représente un grand domaine professionnel ou académique.

Elle regroupe :

- des formations ;
- des parcours métiers ;
- des métiers ;
- des formateurs ;
- des ressources ;
- des événements ;
- une communauté thématique.

Elle ne contient pas directement les leçons.

## 3.4. Hiérarchie de référence

```text
Access Academy
│
├── Catalogue central des formations
│   └── Formation
│       └── Module
│           └── Leçon
│               ├── Ressource
│               ├── Activité
│               └── Évaluation
│
├── Parcours métiers
│   └── Assemblage de formations existantes
│
└── Écoles
    └── Regroupement thématique de formations et parcours
```

---

# 4. Objectifs fonctionnels

La plateforme doit permettre :

1. de publier et gérer un catalogue central de formations ;
2. de réutiliser une formation dans plusieurs parcours et écoles ;
3. de créer des parcours métiers complets ;
4. de créer des écoles thématiques ;
5. d’inscrire des apprenants à une formation ou un parcours ;
6. de suivre précisément leur progression ;
7. d’intégrer des évaluations automatiques et manuelles ;
8. de gérer des projets pratiques ;
9. de délivrer des certificats vérifiables ;
10. de reconnaître les formations déjà validées ;
11. d’éviter de facturer deux fois une même formation ;
12. de gérer les formateurs, correcteurs, mentors et cohortes ;
13. de proposer des espaces entreprise ;
14. de produire des statistiques et rapports ;
15. d’offrir une expérience fluide sur ordinateur, tablette et mobile.

---

# 5. Périmètre fonctionnel

## 5.1. Inclus dans le périmètre

- site public institutionnel ;
- catalogue des formations ;
- catalogue des parcours métiers ;
- catalogue des écoles ;
- moteur de recherche global ;
- authentification ;
- espace apprenant ;
- espace formateur ;
- espace correcteur ;
- espace mentor ;
- espace responsable d’école ;
- espace responsable de parcours ;
- espace entreprise ;
- administration ;
- gestion des contenus ;
- gestion des évaluations ;
- gestion des projets ;
- gestion des compétences ;
- gestion des certificats ;
- gestion des paiements ;
- gestion des cohortes ;
- gestion des notifications ;
- gestion des prérequis ;
- gestion des équivalences ;
- statistiques ;
- vérification publique des certificats ;
- portfolio apprenant ;
- favoris ;
- support ;
- communauté ;
- commentaires et discussions pédagogiques.

## 5.2. Hors périmètre initial mais prévu pour extension

- application mobile native ;
- marketplace ouverte de formateurs ;
- proctoring biométrique avancé ;
- reconnaissance faciale ;
- visioconférence développée en interne ;
- correction automatique par intelligence artificielle des projets complexes ;
- paiement par cryptomonnaie ;
- délivrance de diplômes universitaires réglementés ;
- gestion complète d’un établissement scolaire traditionnel.

---

# 6. Publics cibles

## 6.1. Visiteurs

- étudiants ;
- professionnels ;
- personnes en reconversion ;
- entrepreneurs ;
- entreprises ;
- institutions ;
- formateurs potentiels ;
- partenaires ;
- recruteurs.

## 6.2. Apprenants

- débutants ;
- apprenants autonomes ;
- apprenants en cohorte ;
- salariés inscrits par une entreprise ;
- candidats à un parcours métier ;
- personnes en recherche d’emploi ;
- apprenants en spécialisation.

## 6.3. Intervenants pédagogiques

- formateurs principaux ;
- tuteurs ;
- correcteurs ;
- mentors ;
- experts invités ;
- responsables de projets ;
- animateurs de communauté.

## 6.4. Organisations

- entreprises ;
- ONG ;
- écoles ;
- universités ;
- administrations ;
- organismes de formation ;
- partenaires techniques ;
- recruteurs.

---

# 7. Rôles utilisateurs et permissions

## 7.1. Visiteur

Peut :

- consulter les pages publiques ;
- rechercher des formations ;
- consulter les parcours ;
- consulter les écoles ;
- consulter les formateurs ;
- vérifier un certificat ;
- créer un compte ;
- contacter le support ou le service commercial.

## 7.2. Apprenant

Peut :

- gérer son profil ;
- s’inscrire à une formation ;
- s’inscrire à un parcours ;
- payer ;
- suivre ses cours ;
- réaliser les activités ;
- passer les évaluations ;
- soumettre des projets ;
- consulter ses notes ;
- télécharger ses certificats ;
- alimenter son portfolio ;
- participer aux discussions ;
- rejoindre une cohorte ;
- gérer ses favoris ;
- demander une équivalence ;
- contacter un formateur ou le support.

## 7.3. Formateur

Peut :

- consulter les formations qui lui sont affectées ;
- gérer les contenus selon ses permissions ;
- publier des annonces ;
- corriger les travaux ;
- noter les projets ;
- consulter la progression des apprenants ;
- répondre aux questions ;
- organiser des sessions ;
- fournir des ressources ;
- consulter ses statistiques.

## 7.4. Correcteur

Peut :

- consulter les soumissions qui lui sont affectées ;
- appliquer une grille de correction ;
- attribuer une note ;
- rédiger un feedback ;
- demander une nouvelle soumission ;
- valider ou rejeter un projet.

## 7.5. Mentor ou tuteur

Peut :

- suivre un groupe d’apprenants ;
- consulter leur progression ;
- proposer des rendez-vous ;
- envoyer des recommandations ;
- publier des messages ;
- signaler les apprenants en difficulté.

## 7.6. Responsable d’école

Peut :

- gérer la présentation de son école ;
- consulter les parcours rattachés ;
- consulter les formations rattachées ;
- proposer des formateurs ;
- consulter les statistiques de l’école ;
- publier des événements ;
- gérer les ressources thématiques ;
- soumettre des demandes de modification.

## 7.7. Responsable de parcours

Peut :

- organiser les phases d’un parcours ;
- sélectionner des formations existantes ;
- définir l’ordre ;
- définir les formations obligatoires et optionnelles ;
- gérer les projets transversaux ;
- suivre la progression ;
- organiser les soutenances.

## 7.8. Responsable entreprise

Peut :

- gérer son organisation ;
- inviter des collaborateurs ;
- acheter des licences ;
- inscrire des collaborateurs ;
- affecter des formations et parcours ;
- consulter les progrès ;
- télécharger des rapports ;
- gérer la facturation ;
- contacter Access Academy.

## 7.9. Administrateur pédagogique

Peut :

- créer et gérer les formations ;
- créer les modules et leçons ;
- gérer les évaluations ;
- gérer les compétences ;
- gérer les projets ;
- gérer les certificats ;
- gérer les prérequis ;
- valider les publications.

## 7.10. Administrateur commercial

Peut :

- gérer les prix ;
- gérer les coupons ;
- consulter les commandes ;
- gérer les remboursements ;
- gérer les plans entreprise ;
- consulter les factures ;
- produire les rapports commerciaux.

## 7.11. Super administrateur

Dispose de tous les droits, notamment :

- gestion des utilisateurs ;
- gestion des rôles et permissions ;
- gestion des paramètres ;
- gestion des paiements ;
- gestion des contenus ;
- gestion des certificats ;
- gestion des écoles ;
- gestion des parcours ;
- gestion des rapports ;
- audit des actions ;
- sécurité ;
- intégrations ;
- maintenance.

---

# 8. Architecture de navigation publique

## 8.1. Menu principal

- Accueil
- Formations
- Parcours métiers
- Écoles
- Certifications
- Entreprises
- À propos

## 8.2. Actions de droite

- Rechercher
- Se connecter
- Commencer

## 8.3. Menu utilisateur connecté

- Tableau de bord
- Mes formations
- Mes parcours
- Mes projets
- Mes évaluations
- Mes certificats
- Mon portfolio
- Mes favoris
- Paramètres
- Déconnexion

---

# 9. Page d’accueil

## 9.1. Section hero

Doit contenir :

- une proposition de valeur claire ;
- un sous-titre ;
- deux appels à l’action ;
- une image professionnelle ;
- des indicateurs de confiance.

Appels à l’action recommandés :

- Explorer les parcours métiers
- Voir les formations

## 9.2. Bloc d’orientation

Présenter trois choix :

### Apprendre une compétence

Redirection vers les formations.

### Se préparer à un métier

Redirection vers les parcours métiers.

### Explorer un domaine

Redirection vers les écoles.

## 9.3. Parcours métiers mis en avant

Afficher :

- métier ;
- école ;
- durée ;
- nombre de formations ;
- nombre de projets ;
- certification ;
- niveau de départ ;
- bouton de découverte.

## 9.4. Formations populaires

Afficher :

- titre ;
- image ;
- niveau ;
- durée ;
- note ;
- prix ;
- certificat ;
- projet inclus ;
- nombre d’apprenants.

## 9.5. Écoles

Afficher les écoles principales sous forme de cartes.

## 9.6. Fonctionnement

Présenter quatre étapes :

1. choisir ;
2. apprendre ;
3. pratiquer ;
4. certifier.

## 9.7. Projets apprenants

Présenter des exemples de projets réels ou simulés.

## 9.8. Certifications

Présenter les niveaux de reconnaissance.

## 9.9. Témoignages

Afficher les retours des apprenants et partenaires.

## 9.10. Entreprises partenaires

Afficher les logos et références autorisés.

## 9.11. Appel à l’action final

Inviter à :

- s’inscrire ;
- explorer le catalogue ;
- demander une offre entreprise.

---

# 10. Catalogue des formations

## 10.1. URL

```text
/formations
```

## 10.2. Fonctionnalités

- liste paginée ou chargement progressif ;
- affichage grille ou liste ;
- filtres ;
- tri ;
- recherche ;
- favoris ;
- comparaison ;
- partage ;
- recommandations ;
- indication des formations déjà acquises.

## 10.3. Filtres

- école ;
- domaine ;
- compétence ;
- niveau ;
- durée ;
- prix ;
- gratuit ou payant ;
- langue ;
- modalité ;
- certification ;
- projet inclus ;
- accompagnement ;
- cohorte disponible ;
- date de mise à jour.

## 10.4. Tri

- pertinence ;
- popularité ;
- nouveauté ;
- note ;
- durée ;
- prix ;
- niveau.

## 10.5. Carte formation

Doit afficher :

- image ;
- titre ;
- résumé ;
- niveau ;
- durée ;
- nombre de modules ;
- certificat ;
- projet ;
- prix ;
- note ;
- école principale ;
- badges ;
- bouton d’accès.

## 10.6. États possibles

- brouillon ;
- en révision ;
- publiée ;
- suspendue ;
- archivée ;
- fermée aux inscriptions.

---

# 11. Fiche détaillée d’une formation

## 11.1. Informations générales

- titre ;
- sous-titre ;
- description ;
- objectifs ;
- niveau ;
- durée ;
- langue ;
- modalité ;
- prix ;
- formateur ;
- nombre de modules ;
- nombre de leçons ;
- nombre d’activités ;
- nombre d’évaluations ;
- date de dernière mise à jour ;
- certificat ;
- note moyenne ;
- nombre d’inscrits.

## 11.2. Public cible

- profils concernés ;
- prérequis ;
- niveau attendu ;
- outils nécessaires.

## 11.3. Compétences visées

Chaque compétence doit être reliée au référentiel global.

## 11.4. Programme

Afficher les modules sous forme d’accordéons.

Chaque module doit afficher :

- titre ;
- objectifs ;
- durée ;
- nombre de leçons ;
- activités ;
- évaluation ;
- état d’accès.

## 11.5. Projet de formation

Afficher :

- sujet ;
- contexte ;
- livrables ;
- durée ;
- grille d’évaluation ;
- note minimale ;
- nombre de soumissions autorisées.

## 11.6. Évaluations

Afficher :

- types ;
- pondération ;
- conditions ;
- tentatives ;
- note minimale ;
- modalités de correction.

## 11.7. Certification

Afficher :

- nom du certificat ;
- conditions ;
- compétences ;
- lien de vérification ;
- exemple visuel.

## 11.8. Formateurs

Afficher :

- nom ;
- photo ;
- biographie ;
- compétences ;
- formations associées ;
- évaluations.

## 11.9. Appartenance

Afficher les parcours et écoles auxquels la formation est rattachée.

## 11.10. Avis

Conditions :

- inscription active ;
- progression minimale ;
- un seul avis par utilisateur ;
- modération possible.

## 11.11. Actions

- s’inscrire ;
- acheter ;
- ajouter aux favoris ;
- offrir ;
- partager ;
- demander une prise en charge entreprise ;
- tester son niveau.

---

# 12. Gestion pédagogique d’une formation

## 12.1. Structure

```text
Formation
├── Module
│   ├── Leçon
│   ├── Activité
│   ├── Ressource
│   └── Évaluation
├── Projet
└── Certificat
```

## 12.2. Types de leçons

- vidéo ;
- texte ;
- PDF ;
- audio ;
- présentation ;
- tutoriel interactif ;
- démonstration ;
- lien externe ;
- classe virtuelle ;
- étude de cas ;
- atelier ;
- laboratoire pratique.

## 12.3. Types de ressources

- fichier PDF ;
- document Word ;
- tableur ;
- présentation ;
- fichier ZIP ;
- code source ;
- image ;
- audio ;
- vidéo ;
- lien ;
- modèle ;
- jeu de données.

## 12.4. Contrôle de progression

Une leçon peut être validée :

- manuellement par l’apprenant ;
- automatiquement après lecture ;
- après visionnage minimal ;
- après réussite d’un quiz ;
- après dépôt d’une activité ;
- après validation du formateur.

## 12.5. Déverrouillage

Modes :

- libre ;
- séquentiel ;
- conditionnel ;
- par date ;
- par validation ;
- par cohorte ;
- manuel.

## 12.6. Progression

La progression doit distinguer :

- leçons consultées ;
- activités réalisées ;
- évaluations réussies ;
- projet validé ;
- progression globale.

---

# 13. Parcours métiers

## 13.1. URL

```text
/parcours-metiers
```

## 13.2. Catalogue

Doit permettre :

- recherche ;
- filtres ;
- tri ;
- comparaison ;
- favoris ;
- test d’orientation.

## 13.3. Carte parcours

Afficher :

- métier ;
- école ;
- durée totale ;
- nombre de formations ;
- nombre de projets ;
- niveau d’entrée ;
- niveau de sortie ;
- certification ;
- prix ;
- débouchés.

## 13.4. Fiche parcours

Doit contenir :

- titre ;
- métier visé ;
- description ;
- missions ;
- compétences finales ;
- niveau d’entrée ;
- durée ;
- rythme ;
- prix ;
- école ;
- responsable ;
- certification ;
- débouchés ;
- prérequis ;
- phases ;
- formations ;
- projets ;
- portfolio ;
- conditions de réussite.

## 13.5. Phases

Exemples :

- Fondations ;
- Compétences principales ;
- Spécialisation ;
- Professionnalisation ;
- Projet final.

## 13.6. Composition

Chaque relation parcours-formation doit inclure :

- position ;
- phase ;
- obligatoire ou optionnelle ;
- prérequis ;
- crédits ou poids ;
- durée indicative ;
- mode de validation ;
- règle de substitution.

## 13.7. Reconnaissance des acquis

Si l’apprenant a déjà validé une formation :

- elle apparaît comme acquise ;
- la progression est reprise ;
- le certificat reste valide ;
- l’apprenant ne recommence pas ;
- le montant peut être déduit.

## 13.8. Projet transversal

Le parcours peut inclure un projet final différent des projets de formation.

## 13.9. Certification métier

Conditions possibles :

- toutes les formations obligatoires validées ;
- nombre minimal d’options ;
- projet final validé ;
- portfolio complété ;
- examen final ;
- soutenance ;
- présence minimale en cohorte.

---

# 14. Écoles

## 14.1. URL

```text
/ecoles
```

## 14.2. Catalogue des écoles

Chaque carte affiche :

- nom ;
- description ;
- illustration ;
- nombre de parcours ;
- nombre de formations ;
- métiers préparés.

## 14.3. Fiche école

Doit contenir :

- nom ;
- identité visuelle ;
- description ;
- domaines ;
- métiers ;
- parcours ;
- formations ;
- formateurs ;
- projets ;
- événements ;
- ressources ;
- témoignages ;
- partenaires.

## 14.4. Rattachement

Une formation ou un parcours peut appartenir à plusieurs écoles.

Un rattachement principal peut être défini pour l’affichage.

## 14.5. Absence de duplication

L’école affiche les formations et parcours existants par relation. Elle ne crée pas de copies pédagogiques.

---

# 15. Authentification et onboarding

## 15.1. Méthodes

- email et mot de passe ;
- connexion Google ;
- connexion Microsoft optionnelle ;
- connexion LinkedIn optionnelle.

## 15.2. Inscription

Champs :

- prénom ;
- nom ;
- email ;
- mot de passe ;
- pays ;
- téléphone facultatif ;
- objectif ;
- niveau ;
- acceptation des conditions.

## 15.3. Vérification

- vérification de l’email ;
- réinitialisation du mot de passe ;
- limitation des tentatives ;
- double authentification optionnelle.

## 15.4. Onboarding apprenant

Questions :

- domaine d’intérêt ;
- objectif ;
- expérience ;
- disponibilité ;
- langue ;
- rythme ;
- métier visé.

Le résultat alimente les recommandations.

---

# 16. Espace apprenant

## 16.1. Tableau de bord

Afficher :

- prochaine activité ;
- formation active ;
- parcours actif ;
- progression ;
- échéances ;
- notes récentes ;
- certificats ;
- recommandations ;
- annonces ;
- rendez-vous.

## 16.2. Mes formations

Une formation ne doit apparaître qu’une fois même si elle appartient à plusieurs parcours.

Informations :

- progression ;
- statut ;
- accès ;
- parcours liés ;
- certificat ;
- prochaine leçon.

## 16.3. Mes parcours

Afficher :

- progression globale ;
- phase actuelle ;
- formations validées ;
- formations en cours ;
- formations à venir ;
- projets ;
- certification.

## 16.4. Mes projets

Filtres :

- formation ;
- parcours ;
- statut ;
- échéance ;
- note.

## 16.5. Mes évaluations

Afficher :

- à faire ;
- en cours ;
- soumises ;
- corrigées ;
- à reprendre ;
- réussies ;
- échouées.

## 16.6. Mes certificats

Afficher :

- certificat ;
- date ;
- type ;
- identifiant ;
- QR code ;
- téléchargement ;
- partage ;
- lien public.

## 16.7. Portfolio

Doit permettre :

- présentation ;
- compétences ;
- projets ;
- certificats ;
- outils ;
- expériences ;
- liens ;
- visibilité publique ou privée.

## 16.8. Favoris

- formations ;
- parcours ;
- écoles ;
- projets ;
- événements.

## 16.9. Profil

- informations personnelles ;
- photo ;
- biographie ;
- localisation ;
- langues ;
- objectifs ;
- disponibilités ;
- liens professionnels ;
- préférences ;
- confidentialité.

---

# 17. Lecteur de formation

## 17.1. Structure d’écran

### Colonne latérale

- modules ;
- leçons ;
- activités ;
- évaluations ;
- progression ;
- verrouillage.

### Zone centrale

- contenu ;
- média ;
- ressources ;
- exercices ;
- navigation précédente et suivante.

### Zone complémentaire

- notes ;
- discussion ;
- questions ;
- aide ;
- ressources ;
- transcription.

## 17.2. Fonctions

- reprendre où l’apprenant s’est arrêté ;
- marquer comme terminé ;
- enregistrer automatiquement ;
- afficher les sous-titres ;
- modifier la vitesse vidéo ;
- passer en plein écran ;
- activer un mode sombre ;
- télécharger selon autorisation ;
- prendre des notes ;
- ajouter des signets ;
- consulter la progression.

## 17.3. Accessibilité

- navigation clavier ;
- contraste ;
- transcriptions ;
- sous-titres ;
- textes alternatifs ;
- taille de police adaptable.

---

# 18. Évaluations

## 18.1. Types

- quiz ;
- QCM ;
- vrai ou faux ;
- réponse courte ;
- réponse longue ;
- appariement ;
- classement ;
- exercice pratique ;
- dépôt de fichier ;
- devoir ;
- étude de cas ;
- projet ;
- soutenance ;
- examen oral ;
- examen pratique.

## 18.2. Paramètres

- durée ;
- nombre de tentatives ;
- note minimale ;
- mélange des questions ;
- ordre aléatoire ;
- date d’ouverture ;
- date de fermeture ;
- pénalité ;
- feedback ;
- correction automatique ou manuelle ;
- poids dans la note finale.

## 18.3. Banque de questions

Doit permettre :

- catégories ;
- niveaux ;
- tags ;
- compétences ;
- difficulté ;
- import ;
- réutilisation ;
- versioning ;
- statistiques par question.

## 18.4. Correction

- automatique ;
- manuelle ;
- avec barème ;
- avec grille ;
- avec commentaires ;
- avec pièces jointes ;
- avec demande de reprise.

## 18.5. Résultats

Afficher :

- note ;
- pourcentage ;
- statut ;
- feedback ;
- réponses ;
- corrigé selon réglage ;
- tentative ;
- historique.

---

# 19. Projets

## 19.1. Types

- mini-projet ;
- projet de formation ;
- projet de phase ;
- projet transversal ;
- projet d’expertise ;
- projet d’entreprise.

## 19.2. Fiche projet

- titre ;
- contexte ;
- objectifs ;
- compétences ;
- consignes ;
- livrables ;
- format ;
- échéance ;
- ressources ;
- grille ;
- nombre de tentatives ;
- travail individuel ou collectif.

## 19.3. Soumission

- texte ;
- fichier ;
- lien ;
- dépôt GitHub ;
- vidéo ;
- présentation ;
- portfolio ;
- combinaison.

## 19.4. Correction

- note ;
- grille ;
- feedback ;
- statut ;
- demande de modification ;
- nouvelle soumission ;
- validation finale.

## 19.5. Publication

Un projet validé peut être :

- ajouté au portfolio ;
- rendu public ;
- présenté dans une galerie ;
- partagé à une entreprise ;
- utilisé dans une candidature.

---

# 20. Certifications

## 20.1. Types

- attestation de participation ;
- certificat de formation ;
- certificat de spécialisation ;
- certificat d’expertise ;
- certification de parcours métier ;
- badge de compétence.

## 20.2. Conditions

Configurables selon le programme :

- progression minimale ;
- moyenne minimale ;
- évaluations obligatoires ;
- projet validé ;
- présence ;
- soutenance ;
- paiement soldé.

## 20.3. Contenu du certificat

- nom complet ;
- titre ;
- type ;
- niveau ;
- compétences ;
- date ;
- numéro unique ;
- QR code ;
- signature ;
- identité Access Academy ;
- durée ;
- lien de vérification.

## 20.4. Vérification publique

URL :

```text
/certificats/verifier
```

Méthodes :

- numéro ;
- QR code ;
- lien direct.

## 20.5. Statuts

- valide ;
- expiré ;
- révoqué ;
- suspendu ;
- remplacé.

## 20.6. Partage

- téléchargement PDF ;
- lien public ;
- LinkedIn ;
- email ;
- réseaux sociaux.

---

# 21. Compétences et référentiel

## 21.1. Compétence

Une compétence contient :

- nom ;
- description ;
- niveau ;
- domaine ;
- catégorie ;
- critères ;
- preuves ;
- formations associées ;
- parcours associés.

## 21.2. Niveaux

- découverte ;
- débutant ;
- opérationnel ;
- avancé ;
- expert.

## 21.3. Validation

Une compétence peut être validée par :

- formation ;
- évaluation ;
- projet ;
- expérience ;
- équivalence ;
- validation manuelle.

## 21.4. Profil de compétences

Le profil apprenant doit montrer :

- compétences acquises ;
- niveau ;
- preuves ;
- certificats ;
- projets ;
- compétences recommandées.

---

# 22. Prérequis, positionnement et équivalences

## 22.1. Prérequis

Une formation peut exiger :

- une autre formation ;
- un niveau ;
- une compétence ;
- un test ;
- une validation administrative.

## 22.2. Test de positionnement

Peut permettre :

- d’accéder directement ;
- d’être orienté ;
- d’obtenir une dispense ;
- de recommander une formation préparatoire.

## 22.3. Équivalence

L’apprenant peut déposer :

- certificat ;
- diplôme ;
- portfolio ;
- preuve d’expérience ;
- résultat de test.

## 22.4. Validation

- acceptée ;
- refusée ;
- partielle ;
- conditionnelle.

---

# 23. Cohortes

## 23.1. Types

- autonome ;
- accompagnée ;
- intensive ;
- entreprise ;
- hybride ;
- classe virtuelle.

## 23.2. Paramètres

- nom ;
- formation ou parcours ;
- date de début ;
- date de fin ;
- capacité ;
- formateurs ;
- calendrier ;
- sessions ;
- règles ;
- prix ;
- inscription.

## 23.3. Fonctions

- liste des membres ;
- annonces ;
- calendrier ;
- discussions ;
- présence ;
- progression ;
- rapports ;
- sessions en direct.

---

# 24. Classes virtuelles et événements

## 24.1. Types

- webinaire ;
- classe virtuelle ;
- atelier ;
- soutenance ;
- mentorat ;
- conférence ;
- session de questions.

## 24.2. Intégrations possibles

- Google Meet ;
- Zoom ;
- Microsoft Teams ;
- Jitsi.

## 24.3. Fonctions

- inscription ;
- lien ;
- rappel ;
- présence ;
- replay ;
- ressources ;
- calendrier ;
- compte rendu.

---

# 25. Communauté

## 25.1. Espaces

- discussions par formation ;
- discussions par parcours ;
- communautés par école ;
- groupes de cohorte ;
- espaces projets ;
- annonces.

## 25.2. Fonctions

- publier ;
- répondre ;
- mentionner ;
- joindre un fichier ;
- réagir ;
- signaler ;
- suivre ;
- rechercher.

## 25.3. Modération

- administrateurs ;
- formateurs ;
- modérateurs ;
- règles ;
- signalement ;
- sanctions.

---

# 26. Notifications

## 26.1. Canaux

- notifications internes ;
- email ;
- SMS optionnel ;
- push web optionnel.

## 26.2. Événements

- inscription ;
- paiement ;
- nouvelle leçon ;
- échéance ;
- résultat ;
- feedback ;
- certificat ;
- annonce ;
- message ;
- session ;
- rappel ;
- expiration.

## 26.3. Préférences

Chaque utilisateur doit pouvoir gérer ses préférences de notification.

---

# 27. Paiements et facturation

## 27.1. Produits payables

- formation ;
- parcours ;
- cohorte ;
- certification ;
- examen ;
- renouvellement ;
- offre entreprise ;
- abonnement éventuel.

## 27.2. Moyens

- mobile money ;
- carte bancaire ;
- virement ;
- paiement manuel ;
- coupon ;
- prise en charge entreprise.

## 27.3. Statuts

- en attente ;
- payé ;
- partiellement payé ;
- échoué ;
- annulé ;
- remboursé ;
- expiré.

## 27.4. Réduction de parcours

Le prix d’un parcours doit tenir compte :

- des formations déjà achetées ;
- des formations déjà validées ;
- des équivalences ;
- des coupons ;
- des promotions ;
- des remises entreprise.

## 27.5. Factures

- numéro ;
- client ;
- produit ;
- montant ;
- taxes ;
- statut ;
- date ;
- téléchargement PDF.

## 27.6. Paiement échelonné

Prévoir :

- acompte ;
- échéancier ;
- relances ;
- restriction d’accès selon règle ;
- solde.

---

# 28. Entreprises

## 28.1. Page publique

Présenter :

- formation des équipes ;
- parcours personnalisés ;
- suivi ;
- rapports ;
- certifications ;
- contact commercial.

## 28.2. Espace entreprise

Fonctions :

- créer l’organisation ;
- gérer les membres ;
- acheter des licences ;
- affecter des formations ;
- affecter des parcours ;
- suivre la progression ;
- exporter des rapports ;
- consulter les certificats ;
- gérer les factures ;
- définir des responsables.

## 28.3. Parcours entreprise

Une entreprise peut :

- sélectionner des formations existantes ;
- demander un parcours personnalisé ;
- ajouter des contenus internes ;
- organiser une cohorte privée.

---

# 29. Espace formateur

## 29.1. Tableau de bord

- formations ;
- cohortes ;
- corrections ;
- messages ;
- statistiques ;
- sessions ;
- échéances.

## 29.2. Gestion de contenu

Selon droits :

- créer ;
- modifier ;
- soumettre ;
- publier ;
- versionner ;
- archiver.

## 29.3. Suivi apprenants

- progression ;
- notes ;
- retards ;
- connexions ;
- difficultés ;
- messages ;
- exports.

## 29.4. Correction

- file d’attente ;
- filtres ;
- grille ;
- feedback ;
- note ;
- historique.

---

# 30. Administration

## 30.1. Menu principal

- Tableau de bord
- Utilisateurs
- Formations
- Modules
- Leçons
- Parcours métiers
- Écoles
- Compétences
- Évaluations
- Projets
- Certificats
- Cohortes
- Formateurs
- Entreprises
- Commandes
- Paiements
- Coupons
- Notifications
- Rapports
- Paramètres
- Journal d’audit

## 30.2. Constructeur de formation

Doit permettre :

- création ;
- duplication contrôlée ;
- versioning ;
- modules ;
- leçons ;
- ressources ;
- évaluations ;
- projet ;
- compétences ;
- prérequis ;
- certificat ;
- prix ;
- publication.

## 30.3. Constructeur de parcours

Doit permettre :

- sélection de formations existantes ;
- création de phases ;
- glisser-déposer ;
- ordre ;
- obligations ;
- options ;
- prérequis ;
- substitutions ;
- projet final ;
- certification ;
- tarification.

## 30.4. Gestion des écoles

- identité ;
- description ;
- responsables ;
- formations ;
- parcours ;
- métiers ;
- formateurs ;
- ressources ;
- événements ;
- statistiques.

## 30.5. Versioning

Toute modification majeure d’une formation publiée doit pouvoir :

- créer une nouvelle version ;
- conserver les apprenants sur l’ancienne ;
- migrer certains apprenants ;
- enregistrer l’historique ;
- comparer les versions.

---

# 31. Workflow de publication

## 31.1. États

- brouillon ;
- en rédaction ;
- en révision ;
- validé ;
- programmé ;
- publié ;
- suspendu ;
- archivé.

## 31.2. Processus

1. création ;
2. rédaction ;
3. revue pédagogique ;
4. revue technique ;
5. validation ;
6. publication ;
7. mise à jour ;
8. archivage.

---

# 32. Recherche globale

## 32.1. Sources

- formations ;
- parcours ;
- écoles ;
- compétences ;
- formateurs ;
- projets ;
- événements ;
- ressources publiques.

## 32.2. Résultats

Les résultats doivent être classés par type.

## 32.3. Fonctions

- suggestions ;
- correction orthographique ;
- filtres ;
- historique ;
- recherches récentes ;
- classement par pertinence.

---

# 33. Recommandations personnalisées

Le moteur de recommandation doit utiliser :

- niveau ;
- objectifs ;
- préférences ;
- formations terminées ;
- parcours actifs ;
- résultats ;
- compétences ;
- temps disponible ;
- favoris.

Exemples :

- formation suivante ;
- parcours pertinent ;
- mise à niveau ;
- spécialisation ;
- projet complémentaire.

---

# 34. Rapports et statistiques

## 34.1. Apprenant

- progression ;
- temps ;
- notes ;
- compétences ;
- certificats ;
- activité.

## 34.2. Formation

- inscriptions ;
- taux de complétion ;
- moyenne ;
- abandon ;
- satisfaction ;
- questions difficiles ;
- progression.

## 34.3. Parcours

- progression par phase ;
- taux de certification ;
- formations bloquantes ;
- durée réelle ;
- réussite.

## 34.4. École

- formations ;
- parcours ;
- apprenants ;
- certifications ;
- revenus ;
- satisfaction.

## 34.5. Entreprise

- membres ;
- activité ;
- progression ;
- certificats ;
- dépenses ;
- exports.

## 34.6. Administration

- utilisateurs ;
- revenus ;
- ventes ;
- paiements ;
- catalogue ;
- engagement ;
- support ;
- certificats.

---

# 35. Support

## 35.1. Centre d’aide

- FAQ ;
- guides ;
- tutoriels ;
- recherche ;
- catégories.

## 35.2. Tickets

- sujet ;
- catégorie ;
- priorité ;
- statut ;
- messages ;
- pièces jointes ;
- historique.

## 35.3. Canaux

- formulaire ;
- email ;
- chat optionnel ;
- WhatsApp optionnel.

---

# 36. Gestion documentaire

La plateforme doit permettre de gérer :

- supports ;
- règlements ;
- programmes ;
- attestations ;
- factures ;
- certificats ;
- conventions ;
- ressources ;
- documents entreprise.

Les documents doivent être :

- sécurisés ;
- versionnés si nécessaire ;
- téléchargeables selon les droits ;
- tracés.

---

# 37. Multilingue

La plateforme doit être conçue pour prendre en charge plusieurs langues.

Langue initiale :

- français.

Extensions possibles :

- anglais ;
- portugais ;
- arabe.

Chaque contenu doit pouvoir avoir :

- une langue principale ;
- des traductions ;
- des sous-titres ;
- une transcription.

---

# 38. Responsive et mobile

La plateforme doit être mobile-first.

Exigences :

- navigation simple ;
- cartes compactes ;
- lecteur adapté ;
- téléchargements ;
- reprise de lecture ;
- soumission de fichiers ;
- notifications ;
- accès aux certificats ;
- fonctionnement acceptable avec une connexion limitée.

---

# 39. Accessibilité

Objectifs :

- conformité WCAG autant que possible ;
- contraste ;
- textes alternatifs ;
- sous-titres ;
- navigation clavier ;
- formulaires accessibles ;
- messages d’erreur explicites ;
- structure sémantique ;
- compatibilité avec les lecteurs d’écran.

---

# 40. Règles métier principales

1. Une formation est créée une seule fois.
2. Une formation peut appartenir à plusieurs parcours.
3. Une formation peut appartenir à plusieurs écoles.
4. Une formation validée reste acquise.
5. Une formation acquise ne doit pas être facturée deux fois.
6. Une formation apparaît une seule fois dans l’espace apprenant.
7. Un parcours assemble des formations existantes.
8. Une école affiche des formations et parcours existants.
9. Une certification de formation est distincte d’une certification de parcours.
10. La progression est calculée sur les activités obligatoires.
11. Un certificat ne peut être délivré que si les conditions sont remplies.
12. Toute révocation de certificat doit être tracée.
13. Toute note modifiée doit être auditée.
14. Toute équivalence doit être validée par une personne autorisée.
15. Toute publication doit respecter le workflow.
16. Une formation archivée reste visible pour les apprenants déjà inscrits.
17. Un apprenant doit conserver son historique.
18. Les données entreprise sont séparées par organisation.
19. Les paiements et les accès doivent être cohérents.
20. Les droits sont appliqués par rôle et permission.

---

# 41. Statuts recommandés

## 41.1. Formation

- `DRAFT`
- `REVIEW`
- `APPROVED`
- `SCHEDULED`
- `PUBLISHED`
- `SUSPENDED`
- `ARCHIVED`

## 41.2. Inscription

- `PENDING`
- `ACTIVE`
- `PAUSED`
- `COMPLETED`
- `FAILED`
- `CANCELLED`
- `EXPIRED`

## 41.3. Évaluation

- `NOT_STARTED`
- `IN_PROGRESS`
- `SUBMITTED`
- `GRADED`
- `PASSED`
- `FAILED`
- `RETAKE_REQUIRED`

## 41.4. Projet

- `DRAFT`
- `SUBMITTED`
- `UNDER_REVIEW`
- `CHANGES_REQUESTED`
- `APPROVED`
- `REJECTED`

## 41.5. Paiement

- `PENDING`
- `PARTIAL`
- `PAID`
- `FAILED`
- `CANCELLED`
- `REFUNDED`
- `EXPIRED`

## 41.6. Certificat

- `ACTIVE`
- `SUSPENDED`
- `REVOKED`
- `EXPIRED`
- `REPLACED`

---

# 42. Modèle de données fonctionnel

## 42.1. Entités principales

```text
User
Role
Permission
Profile
School
CareerPath
CareerPathPhase
Course
CourseVersion
Module
Lesson
Resource
Activity
Assessment
Question
QuestionBank
Project
Skill
CourseSkill
CareerPathSkill
Instructor
Cohort
Enrollment
CareerPathEnrollment
Progress
Submission
Grade
Certificate
CertificateTemplate
Payment
Order
Invoice
Coupon
Organization
OrganizationMember
Notification
Discussion
Message
Review
Favorite
SupportTicket
AuditLog
```

## 42.2. Relations majeures

```text
Course ↔ School
Course ↔ CareerPath
CareerPath ↔ School
Course → Module
Module → Lesson
Course → Assessment
Course → Project
User ↔ Course via Enrollment
User ↔ CareerPath via CareerPathEnrollment
User ↔ Skill via validation
Organization ↔ User via OrganizationMember
```

---

# 43. Tables de liaison critiques

## 43.1. SchoolCourse

```text
id
schoolId
courseId
isPrimary
isFeatured
position
```

## 43.2. CareerPathCourse

```text
id
careerPathId
courseId
phaseId
position
isRequired
isOptional
prerequisiteCourseId
creditValue
```

## 43.3. SchoolCareerPath

```text
id
schoolId
careerPathId
isPrimary
position
```

## 43.4. CourseSkill

```text
id
courseId
skillId
targetLevel
isPrimary
```

---

# 44. Architecture des URL

```text
/
├── /formations
│   └── /formations/[slug]
├── /parcours-metiers
│   └── /parcours-metiers/[slug]
├── /ecoles
│   └── /ecoles/[slug]
├── /certifications
├── /certificats/verifier
├── /entreprises
├── /formateurs
├── /projets
├── /evenements
├── /a-propos
├── /contact
├── /connexion
└── /inscription
```

Espace apprenant :

```text
/espace
├── /espace/formations
├── /espace/parcours
├── /espace/projets
├── /espace/evaluations
├── /espace/certificats
├── /espace/portfolio
├── /espace/favoris
└── /espace/parametres
```

Administration :

```text
/admin
├── /admin/formations
├── /admin/parcours
├── /admin/ecoles
├── /admin/utilisateurs
├── /admin/evaluations
├── /admin/projets
├── /admin/certificats
├── /admin/paiements
├── /admin/entreprises
├── /admin/rapports
└── /admin/parametres
```

---

# 45. SEO fonctionnel

Chaque page publique doit pouvoir définir :

- titre ;
- description ;
- image ;
- slug ;
- URL canonique ;
- données structurées ;
- règles d’indexation ;
- métadonnées de partage social.

Les pages formations, parcours, écoles et formateurs doivent disposer de métadonnées dédiées.

---

# 46. Sécurité fonctionnelle

- contrôle d’accès par rôle ;
- permissions granulaires ;
- journal d’audit ;
- limitation des tentatives ;
- gestion des sessions ;
- expiration des accès ;
- validation des fichiers ;
- protection des certificats ;
- contrôle des paiements ;
- consentement ;
- suppression ou anonymisation selon politique ;
- sauvegarde ;
- traçabilité.

---

# 47. Critères d’acceptation globaux

La plateforme sera considérée fonctionnellement conforme si :

1. une formation peut être créée une seule fois ;
2. elle peut être associée à plusieurs parcours ;
3. elle peut être associée à plusieurs écoles ;
4. un parcours peut ordonner plusieurs formations ;
5. un apprenant retrouve une formation unique dans son espace ;
6. une formation déjà validée est reconnue dans un nouveau parcours ;
7. le coût d’un parcours peut déduire les formations déjà acquises ;
8. les évaluations fonctionnent ;
9. les projets peuvent être soumis et corrigés ;
10. les certificats sont vérifiables ;
11. la progression est enregistrée ;
12. les rôles sont respectés ;
13. les pages publiques sont responsive ;
14. les paiements donnent accès aux bons contenus ;
15. les rapports principaux sont disponibles ;
16. les actions sensibles sont auditées ;
17. les contenus restent accessibles aux utilisateurs autorisés ;
18. les statuts et workflows sont cohérents.

---

# 48. Priorisation de mise en œuvre

## Phase 1 — Socle fonctionnel

- site public ;
- authentification ;
- catalogue ;
- formations ;
- modules ;
- leçons ;
- progression ;
- évaluations simples ;
- espace apprenant ;
- administration ;
- certificats ;
- paiements de base.

## Phase 2 — Parcours et écoles

- parcours métiers ;
- phases ;
- réutilisation ;
- écoles ;
- prérequis ;
- équivalences ;
- tarification intelligente ;
- projets transversaux.

## Phase 3 — Professionnalisation

- portfolio ;
- compétences ;
- cohortes ;
- formateurs ;
- correction avancée ;
- communauté ;
- événements ;
- entreprises.

## Phase 4 — Optimisation

- recommandations ;
- rapports avancés ;
- automatisations ;
- multilingue ;
- application mobile ;
- intégrations avancées.

---

# 49. MVP recommandé

Le MVP doit inclure au minimum :

- page d’accueil ;
- catalogue des formations ;
- fiche formation ;
- trois formations en bases de données ;
- création de compte ;
- inscription ;
- paiement ;
- espace apprenant ;
- lecteur de cours ;
- progression ;
- quiz ;
- devoirs ;
- projet ;
- certificat ;
- administration ;
- un parcours métier ;
- une école ;
- relations sans duplication.

---

# 50. Cas d’usage de référence

## 50.1. Achat d’une formation

1. le visiteur consulte une formation ;
2. il crée un compte ;
3. il paie ;
4. l’inscription devient active ;
5. il accède au lecteur ;
6. il valide les modules ;
7. il réussit les évaluations ;
8. il obtient son certificat.

## 50.2. Inscription à un parcours

1. l’apprenant consulte un parcours ;
2. le système analyse ses acquis ;
3. les formations validées sont reconnues ;
4. le prix est recalculé ;
5. l’apprenant paie ;
6. il poursuit les formations restantes ;
7. il réalise le projet final ;
8. il obtient la certification métier.

## 50.3. Réutilisation d’une formation

1. l’administrateur crée une formation ;
2. il l’associe à plusieurs parcours ;
3. il l’associe à plusieurs écoles ;
4. le contenu reste unique ;
5. toute mise à jour contrôlée s’applique selon la version.

## 50.4. Formation entreprise

1. l’entreprise achète des places ;
2. elle invite ses collaborateurs ;
3. elle affecte une formation ;
4. les collaborateurs suivent ;
5. l’entreprise consulte les résultats ;
6. elle télécharge un rapport.

---

# 51. Exemple Access Academy — Bases de données

## 51.1. Formations

1. Fondamentaux des bases de données et SQL ;
2. Conception, administration et exploitation des bases SQL ;
3. Architecture, performance et administration avancée des bases de données.

## 51.2. Parcours principal

### Administrateur de bases de données

- formation 1 ;
- formation 2 ;
- formation 3 ;
- Linux ;
- Git ;
- Docker ;
- sécurité ;
- cloud ;
- projet final.

## 51.3. Écoles associées

- École des Données et de l’Intelligence artificielle ;
- École du Développement logiciel ;
- École de la Cybersécurité et des Infrastructures.

Chaque formation reste unique et réutilisée.

---

# 52. Livrables attendus du développement

- maquettes UX/UI ;
- design system ;
- base de données ;
- application publique ;
- espace apprenant ;
- espace formateur ;
- administration ;
- espace entreprise ;
- système d’évaluation ;
- système de certification ;
- système de paiement ;
- documentation ;
- tests ;
- scripts de déploiement ;
- guide administrateur ;
- guide formateur ;
- guide apprenant.

---

# 53. Contraintes de qualité

La plateforme doit être :

- rapide ;
- stable ;
- responsive ;
- accessible ;
- évolutive ;
- sécurisée ;
- maintenable ;
- documentée ;
- institutionnelle ;
- moderne ;
- fluide ;
- cohérente.

L’interface ne doit pas donner l’impression d’un assemblage de blocs génériques.

Elle doit reposer sur :

- une hiérarchie visuelle claire ;
- des pages aérées ;
- des animations discrètes ;
- une navigation cohérente ;
- des parcours simples ;
- une identité forte ;
- une expérience homogène.

---

# 54. Conclusion

Access Academy doit être conçue autour d’un catalogue central de formations réutilisables.

Les parcours métiers assemblent ces formations dans une progression professionnelle.

Les écoles regroupent les formations et parcours d’un même domaine.

Cette logique garantit :

- l’absence de duplication ;
- une maintenance simplifiée ;
- une expérience cohérente ;
- une tarification juste ;
- une progression reconnue ;
- une forte évolutivité ;
- une architecture pédagogique durable.

Ce cahier des charges constitue la référence fonctionnelle pour la conception et la réalisation complète de la plateforme.
