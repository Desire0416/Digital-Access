import { servicePacks } from "./content";

/**
 * Pages de destination SEO locales — une par service (cœur du SEO local).
 * Chaque entrée alimente le template <ServiceLanding /> : hero, prestations,
 * arguments locaux, FAQ (accordéon + JSON-LD) et données structurées Service.
 * Contenus réels et bespoke, ciblant une intention de recherche à Abidjan /
 * en Côte d'Ivoire.
 */

/** Élément à icône (prestation livrée ou argument « pourquoi nous »). */
export interface ServiceIconItem {
  /** Nom d'icône lucide (voir components/Icon). */
  icon: string;
  title: string;
  text: string;
}

/** Question / réponse d'une FAQ de page service. */
export interface ServiceFaqItem {
  question: string;
  answer: string;
}

export interface ServiceLandingPage {
  /** Segment d'URL sous /services/. */
  slug: string;
  /** Sur-titre du hero. */
  eyebrow: string;
  /** Titre H1 complet (aussi utilisé pour le fil d'Ariane et le schéma Service). */
  title: string;
  /** Fragment du titre mis en dégradé signature (doit être une sous-chaîne de `title`). */
  titleAccent?: string;
  /** Titre SEO concis (sans « — Digital Access », ajouté par le template racine). */
  metaTitle: string;
  /** Meta description unique (~150 caractères, intention locale). */
  metaDescription: string;
  keywords: string[];
  /** Accroche du hero. */
  intro: string;
  /** serviceType Schema.org (défaut = title). */
  serviceType?: string;
  /** Prix de départ en FCFA (bloc prix + Offer JSON-LD). */
  priceFrom?: number;
  /** Suffixe affiché après le prix (ex. « /mois »). */
  priceSuffix?: string;
  /** Sous-titre de la section « Ce que nous livrons ». */
  deliverablesSubtitle: string;
  deliverables: ServiceIconItem[];
  /** Sous-titre de la section « Pourquoi Digital Access ». */
  reasonsSubtitle: string;
  reasons: ServiceIconItem[];
  faq: ServiceFaqItem[];
  /** Titre du bloc CTA final. */
  ctaTitle: string;
  ctaDescription: string;
}

/** Prix de départ récupéré depuis les packs (source unique de vérité tarifaire). */
const packPrice = (slug: string): number | undefined =>
  servicePacks.find((p) => p.slug === slug)?.price;

export const serviceLandingPages: ServiceLandingPage[] = [
  // ─────────────────────────────────────────────────────────────
  {
    slug: "creation-site-web",
    eyebrow: "Création de site web",
    title: "Création de site web à Abidjan",
    titleAccent: "à Abidjan",
    metaTitle: "Création de site web à Abidjan",
    metaDescription:
      "Agence de création de site web à Abidjan : sites vitrines rapides, sur-mesure et optimisés SEO, avec paiement Mobile Money. Devis gratuit sous 48h.",
    keywords: [
      "création site web Abidjan",
      "agence web Abidjan",
      "création site internet Côte d'Ivoire",
      "site vitrine Abidjan",
      "créer un site web Côte d'Ivoire",
      "développeur web Abidjan",
    ],
    intro:
      "Nous concevons des sites web professionnels, rapides et pensés pour le mobile, qui inspirent confiance dès le premier clic et transforment vos visiteurs en clients — à Abidjan comme partout en Côte d'Ivoire.",
    serviceType: "Création de site web",
    priceFrom: packPrice("presence-web"),
    deliverablesSubtitle:
      "Un site complet, prêt à travailler pour vous, sans mauvaise surprise ni template récupéré.",
    deliverables: [
      {
        icon: "palette",
        title: "Design à votre image",
        text: "Une identité visuelle unique : couleurs, typographies et compositions alignées sur votre marque, jamais un thème générique.",
      },
      {
        icon: "smartphone",
        title: "100 % responsive mobile",
        text: "Un affichage impeccable sur smartphone, tablette et ordinateur, optimisé pour les connexions 3G/4G ivoiriennes.",
      },
      {
        icon: "megaphone",
        title: "Référencement local (SEO)",
        text: "Structure, vitesse et métadonnées optimisées pour être trouvé sur Google à Abidjan et en Côte d'Ivoire.",
      },
      {
        icon: "handshake",
        title: "Contact & WhatsApp",
        text: "Formulaire de contact, bouton WhatsApp et Google Maps pour que vos clients vous joignent en un seul geste.",
      },
      {
        icon: "shield-check",
        title: "Domaine & hébergement inclus",
        text: "Nom de domaine (.ci, .com…) et hébergement sécurisé la première année compris dans l'offre.",
      },
      {
        icon: "rocket",
        title: "Mise en ligne rapide",
        text: "Votre site en ligne en 2 à 3 semaines, avec une formation à la prise en main pour rester autonome.",
      },
    ],
    reasonsSubtitle:
      "Un partenaire local qui comprend votre marché, votre langue et vos clients.",
    reasons: [
      {
        icon: "target",
        title: "Une équipe basée à Abidjan",
        text: "Nous échangeons en français, par WhatsApp et en visio, et connaissons les réalités du marché ivoirien.",
      },
      {
        icon: "smartphone",
        title: "Paiement Mobile Money",
        text: "Orange Money, MTN et Wave intégrés pour vos acomptes comme pour encaisser vos propres clients.",
      },
      {
        icon: "zap",
        title: "Optimisé pour le mobile ivoirien",
        text: "Des sites légers et rapides, pensés pour les usages et les réseaux mobiles locaux.",
      },
      {
        icon: "headphones",
        title: "Support de proximité",
        text: "Après la mise en ligne, une équipe réactive veille sur votre site et répond à vos questions.",
      },
    ],
    faq: [
      {
        question: "Combien coûte la création d'un site web à Abidjan ?",
        answer:
          "Un site vitrine professionnel démarre à 150 000 FCFA. Le tarif final dépend du nombre de pages, des fonctionnalités (blog, catalogue, paiement) et du design souhaité. Nous vous remettons un devis clair et gratuit sous 48h.",
      },
      {
        question: "Combien de temps faut-il pour créer mon site ?",
        answer:
          "Un site vitrine est mis en ligne en 2 à 3 semaines une fois les contenus réunis. Les projets plus complexes (e-commerce, espace membre) prennent de 4 à 8 semaines.",
      },
      {
        question: "Le nom de domaine et l'hébergement sont-ils inclus ?",
        answer:
          "Oui. La première année de nom de domaine (.ci, .com…) et d'hébergement sécurisé est comprise dans nos offres. Le renouvellement est ensuite couvert par votre contrat de maintenance.",
      },
      {
        question: "Pourrai-je mettre à jour le site moi-même ?",
        answer:
          "Absolument. Nous livrons un espace d'administration simple et vous formons à son utilisation. Vous restez autonome sur vos textes, images et actualités.",
      },
      {
        question: "Mon site sera-t-il visible sur Google ?",
        answer:
          "Oui. Chaque site est optimisé pour le référencement local : structure technique, vitesse, métadonnées et bonnes pratiques SEO pour être trouvé par vos clients à Abidjan et en Côte d'Ivoire.",
      },
    ],
    ctaTitle: "Prêt à lancer votre site web ?",
    ctaDescription:
      "Recevez un devis gratuit et personnalisé sous 48h. Sans engagement.",
  },

  // ─────────────────────────────────────────────────────────────
  {
    slug: "refonte-site-web",
    eyebrow: "Refonte de site web",
    title: "Refonte de site web en Côte d'Ivoire",
    titleAccent: "en Côte d'Ivoire",
    metaTitle: "Refonte de site web en Côte d'Ivoire",
    metaDescription:
      "Votre site est lent, daté ou invisible sur Google ? Digital Access refait votre site web à Abidjan : nouveau design, performance et SEO. Devis gratuit.",
    keywords: [
      "refonte site web Côte d'Ivoire",
      "refonte site internet Abidjan",
      "moderniser son site web",
      "redesign site web Abidjan",
      "refonte site vitrine Côte d'Ivoire",
    ],
    intro:
      "Un site vieillissant, lent ou peu visible fait fuir vos clients. Nous repensons votre site de fond en comble — design, performance, contenu et référencement — pour lui redonner toute sa force commerciale.",
    serviceType: "Refonte de site web",
    deliverablesSubtitle:
      "Une remise à neuf complète, sans perdre l'acquis de votre référencement.",
    deliverables: [
      {
        icon: "refresh-cw",
        title: "Audit de l'existant",
        text: "Analyse de votre site actuel : design, vitesse, SEO, contenus et parcours utilisateur, avec des recommandations claires.",
      },
      {
        icon: "palette",
        title: "Nouveau design moderne",
        text: "Une refonte graphique à votre image, actuelle et professionnelle, qui valorise votre marque et votre crédibilité.",
      },
      {
        icon: "zap",
        title: "Performance & vitesse",
        text: "Un site reconstruit sur des bases techniques modernes : chargement rapide, même sur les réseaux 3G/4G.",
      },
      {
        icon: "smartphone",
        title: "Adaptation mobile",
        text: "Une expérience irréprochable sur smartphone, là où se trouve la majorité de vos visiteurs.",
      },
      {
        icon: "megaphone",
        title: "SEO préservé & renforcé",
        text: "Migration soignée des URLs et redirections 301 pour ne perdre aucun acquis Google, puis optimisation du référencement.",
      },
      {
        icon: "file-text",
        title: "Reprise de vos contenus",
        text: "Nous récupérons, réorganisons et modernisons vos textes, images et pages existantes.",
      },
    ],
    reasonsSubtitle:
      "Une refonte maîtrisée, sans rupture de service ni perte de visibilité.",
    reasons: [
      {
        icon: "target",
        title: "Équipe à Abidjan",
        text: "Un interlocuteur proche, qui comprend votre historique, votre secteur et vos objectifs.",
      },
      {
        icon: "shield-check",
        title: "Migration sans perte",
        text: "Redirections 301 et sauvegardes complètes pour préserver votre référencement et vos données.",
      },
      {
        icon: "zap",
        title: "Gain de vitesse mesurable",
        text: "Des scores de performance nettement améliorés, pour le confort de vos visiteurs et votre SEO.",
      },
      {
        icon: "headphones",
        title: "Maintenance après refonte",
        text: "Nous continuons de veiller sur votre site pour qu'il reste rapide, sécurisé et à jour.",
      },
    ],
    faq: [
      {
        question: "Pourquoi refaire mon site web ?",
        answer:
          "Un site daté, lent ou non responsive nuit à votre crédibilité et à votre visibilité sur Google. Une refonte modernise votre image, améliore vos performances et augmente vos conversions.",
      },
      {
        question: "Vais-je perdre mon référencement Google ?",
        answer:
          "Non. Nous mettons en place un plan de redirections (301) et migrons proprement vos URLs pour conserver votre positionnement, que nous cherchons ensuite à renforcer.",
      },
      {
        question: "Pouvez-vous récupérer mes contenus actuels ?",
        answer:
          "Oui. Nous reprenons vos textes, images et pages existantes, puis nous les réorganisons et les modernisons dans la nouvelle version du site.",
      },
      {
        question: "Combien de temps dure une refonte ?",
        answer:
          "Comptez en général 3 à 6 semaines selon la taille du site et le volume de contenus à migrer. Nous établissons un calendrier précis dès le devis.",
      },
    ],
    ctaTitle: "Donnez une seconde vie à votre site",
    ctaDescription:
      "Recevez un audit et un devis de refonte gratuits sous 48h. Sans engagement.",
  },

  // ─────────────────────────────────────────────────────────────
  {
    slug: "application-web",
    eyebrow: "Application web",
    title: "Développement d'applications web sur-mesure",
    titleAccent: "sur-mesure",
    metaTitle: "Développement d'applications web sur-mesure",
    metaDescription:
      "Digital Access développe des applications web sur-mesure à Abidjan : espaces membres, tableaux de bord, outils métiers et SaaS. Devis gratuit sous 48h.",
    keywords: [
      "développement application web Abidjan",
      "application web sur-mesure Côte d'Ivoire",
      "créer une application web",
      "logiciel métier Abidjan",
      "SaaS Côte d'Ivoire",
      "développeur application web Abidjan",
    ],
    intro:
      "Au-delà du site vitrine, nous concevons des applications web sur-mesure — espaces membres, tableaux de bord, outils métiers et plateformes SaaS — qui automatisent votre activité et font gagner du temps à vos équipes.",
    serviceType: "Développement d'application web",
    deliverablesSubtitle:
      "Un outil taillé pour vos processus réels, robuste et évolutif.",
    deliverables: [
      {
        icon: "code",
        title: "Développement sur-mesure",
        text: "Une application pensée pour vos processus réels, bâtie avec des technologies modernes et pérennes.",
      },
      {
        icon: "target",
        title: "Espaces membres & rôles",
        text: "Comptes utilisateurs, gestion des rôles et des droits, tableaux de bord personnalisés selon le profil.",
      },
      {
        icon: "brain",
        title: "Automatisation métier",
        text: "Nous automatisons vos tâches répétitives : facturation, suivi, notifications, rapports et relances.",
      },
      {
        icon: "smartphone",
        title: "Mobile-first & responsive",
        text: "Une application fluide sur tous les écrans, utilisable en déplacement comme au bureau.",
      },
      {
        icon: "shield-check",
        title: "Sécurité & données",
        text: "Authentification robuste, chiffrement et sauvegardes : vos données et celles de vos clients sont protégées.",
      },
      {
        icon: "refresh-cw",
        title: "Intégrations & API",
        text: "Connexion à vos outils existants — paiement Mobile Money, CRM, e-mail, comptabilité — via API.",
      },
    ],
    reasonsSubtitle:
      "Une équipe technique locale et un code de qualité, prêt à grandir avec vous.",
    reasons: [
      {
        icon: "target",
        title: "Équipe technique à Abidjan",
        text: "Des développeurs disponibles, qui comprennent vos contraintes locales et votre métier.",
      },
      {
        icon: "smartphone",
        title: "Paiement Mobile Money natif",
        text: "Encaissez et gérez les abonnements via Orange Money, MTN et Wave directement dans l'application.",
      },
      {
        icon: "gem",
        title: "Code de qualité & évolutif",
        text: "Une base technique propre et documentée, prête à évoluer au rythme de votre activité.",
      },
      {
        icon: "headphones",
        title: "Accompagnement continu",
        text: "Maintenance, évolutions et support : nous restons à vos côtés après la mise en production.",
      },
    ],
    faq: [
      {
        question: "Quelle est la différence entre un site web et une application web ?",
        answer:
          "Un site web présente votre activité (vitrine, blog, catalogue). Une application web est un outil interactif : espace membre, tableau de bord, gestion de données, automatisation. Nous réalisons les deux.",
      },
      {
        question: "Combien coûte une application web sur-mesure ?",
        answer:
          "Chaque application est unique : le tarif dépend des fonctionnalités, du nombre d'utilisateurs et des intégrations. Nous établissons un devis détaillé et gratuit après un premier échange sur votre besoin.",
      },
      {
        question: "Quelles technologies utilisez-vous ?",
        answer:
          "Nous développons avec des technologies modernes et éprouvées (Next.js, TypeScript, PostgreSQL) qui garantissent rapidité, sécurité et évolutivité sur le long terme.",
      },
      {
        question: "Pouvez-vous intégrer le paiement Mobile Money ?",
        answer:
          "Oui. Nous intégrons Orange Money, MTN et Wave (via CinetPay ou FedaPay) pour les paiements ponctuels comme pour les abonnements récurrents.",
      },
      {
        question: "Assurez-vous la maintenance de l'application ?",
        answer:
          "Oui. Nos contrats de maintenance couvrent l'hébergement, les mises à jour de sécurité, les sauvegardes et les évolutions fonctionnelles de votre application.",
      },
    ],
    ctaTitle: "Un outil métier à concevoir ?",
    ctaDescription:
      "Parlons de votre besoin. Un devis détaillé et gratuit vous est remis sous 48h.",
  },

  // ─────────────────────────────────────────────────────────────
  {
    slug: "plateforme-e-learning",
    eyebrow: "Plateforme e-learning",
    title: "Création de plateforme e-learning à Abidjan",
    titleAccent: "e-learning",
    metaTitle: "Création de plateforme e-learning à Abidjan",
    metaDescription:
      "Créez votre plateforme e-learning en Côte d'Ivoire : cours vidéo, quiz, certificats et paiement Mobile Money. Solution clé en main par Digital Access.",
    keywords: [
      "plateforme e-learning Côte d'Ivoire",
      "création plateforme e-learning Abidjan",
      "créer une plateforme de formation en ligne",
      "LMS Côte d'Ivoire",
      "formation en ligne Abidjan",
      "vendre des cours en ligne Côte d'Ivoire",
    ],
    intro:
      "Digitalisez votre savoir-faire avec une plateforme e-learning complète : cours vidéo, quiz interactifs, certificats et paiement Mobile Money. Une solution clé en main, propulsée par la technologie d'Access Academy.",
    serviceType: "Création de plateforme e-learning",
    priceFrom: packPrice("elearning"),
    deliverablesSubtitle:
      "Tout pour créer, vendre et animer vos formations en ligne, sur une base éprouvée.",
    deliverables: [
      {
        icon: "graduation-cap",
        title: "Catalogue de cours & modules",
        text: "Organisez vos formations en cours, modules et chapitres (vidéo, texte, quiz), avec un suivi de progression.",
      },
      {
        icon: "rocket",
        title: "Lecteur immersif",
        text: "Un lecteur de cours moderne : vidéos YouTube/Vimeo intégrées, contenus riches et navigation fluide.",
      },
      {
        icon: "brain",
        title: "Quiz & certificats",
        text: "Évaluez vos apprenants avec des quiz notés automatiquement et délivrez des certificats PDF vérifiables.",
      },
      {
        icon: "smartphone",
        title: "Paiement & abonnements",
        text: "Vendez vos cours à l'unité ou en abonnement, avec paiement Mobile Money (Orange, MTN, Wave).",
      },
      {
        icon: "target",
        title: "Espace apprenant",
        text: "Chaque apprenant suit sa progression, ses cours et ses certificats depuis un tableau de bord personnel.",
      },
      {
        icon: "handshake",
        title: "Forum & communauté",
        text: "Un espace d'échange par cours pour animer votre communauté d'apprenants et renforcer l'engagement.",
      },
    ],
    reasonsSubtitle:
      "Une technologie déjà en production, pensée pour l'apprentissage sur mobile.",
    reasons: [
      {
        icon: "gem",
        title: "Une technologie éprouvée",
        text: "Votre plateforme s'appuie sur le moteur d'Access Academy, déjà en production et éprouvé.",
      },
      {
        icon: "zap",
        title: "Optimisée pour la 3G/4G",
        text: "Vidéos et contenus servis efficacement pour un apprentissage fluide sur mobile en Côte d'Ivoire.",
      },
      {
        icon: "target",
        title: "Équipe à Abidjan",
        text: "Formation de vos formateurs, accompagnement au lancement et proximité à chaque étape.",
      },
      {
        icon: "headphones",
        title: "Support & évolutions",
        text: "Maintenance, hébergement et nouvelles fonctionnalités pour faire grandir votre académie dans la durée.",
      },
    ],
    faq: [
      {
        question: "Combien coûte une plateforme e-learning ?",
        answer:
          "Une plateforme e-learning complète démarre à 1 200 000 FCFA. Le tarif dépend des fonctionnalités (abonnements, forum, certificats) et du niveau de personnalisation souhaité.",
      },
      {
        question: "Puis-je vendre mes cours et encaisser en Mobile Money ?",
        answer:
          "Oui. La plateforme intègre le paiement Mobile Money (Orange Money, MTN, Wave) pour la vente de cours à l'unité comme pour les abonnements mensuels ou annuels.",
      },
      {
        question: "Les apprenants peuvent-ils obtenir un certificat ?",
        answer:
          "Oui. À la fin d'un parcours, un certificat PDF est généré automatiquement, avec un QR code et une page de vérification publique pour en attester l'authenticité.",
      },
      {
        question: "La plateforme fonctionne-t-elle bien sur mobile ?",
        answer:
          "Oui. Elle est optimisée pour les smartphones et les connexions 3G/4G ivoiriennes, afin que vos apprenants suivent leurs cours partout, même avec un réseau limité.",
      },
      {
        question: "Puis-je gérer moi-même mes cours et mes apprenants ?",
        answer:
          "Absolument. Un espace d'administration vous permet de créer vos cours, suivre vos apprenants, gérer les paiements et publier des contenus en toute autonomie.",
      },
    ],
    ctaTitle: "Lancez votre académie en ligne",
    ctaDescription:
      "Recevez un devis gratuit et personnalisé pour votre plateforme e-learning sous 48h.",
  },

  // ─────────────────────────────────────────────────────────────
  {
    slug: "maintenance-site-web",
    eyebrow: "Maintenance de site web",
    title: "Maintenance de site web en Côte d'Ivoire",
    titleAccent: "en Côte d'Ivoire",
    metaTitle: "Maintenance de site web en Côte d'Ivoire",
    metaDescription:
      "Contrat de maintenance de site web à Abidjan : mises à jour, sauvegardes, sécurité 24/7 et support prioritaire dès 50 000 FCFA/mois. Devis gratuit.",
    keywords: [
      "maintenance site web Côte d'Ivoire",
      "maintenance site internet Abidjan",
      "contrat de maintenance web",
      "sécurité site web Abidjan",
      "support site web Côte d'Ivoire",
    ],
    intro:
      "Un site web se cultive. Mises à jour, sauvegardes, sécurité et corrections : nous veillons en continu sur votre site pendant que vous vous concentrez sur votre activité.",
    serviceType: "Maintenance de site web",
    priceFrom: packPrice("maintenance"),
    priceSuffix: " / mois",
    deliverablesSubtitle:
      "Un site toujours à jour, rapide et sécurisé, sans que vous ayez à y penser.",
    deliverables: [
      {
        icon: "refresh-cw",
        title: "Mises à jour régulières",
        text: "Mises à jour techniques et de sécurité de votre site, de ses composants et de son infrastructure.",
      },
      {
        icon: "shield-check",
        title: "Surveillance sécurité 24/7",
        text: "Monitoring de la disponibilité, protection contre les intrusions et intervention rapide en cas d'incident.",
      },
      {
        icon: "file-text",
        title: "Sauvegardes automatiques",
        text: "Sauvegardes régulières et restauration rapide en cas de problème : vos données sont toujours protégées.",
      },
      {
        icon: "zap",
        title: "Optimisation des performances",
        text: "Nous surveillons la vitesse de votre site et l'optimisons pour qu'il reste rapide et bien référencé.",
      },
      {
        icon: "handshake",
        title: "Corrections & évolutions",
        text: "Un quota d'interventions mensuelles pour vos corrections, mises à jour de contenu et petites évolutions.",
      },
      {
        icon: "megaphone",
        title: "Rapport mensuel",
        text: "Un rapport clair chaque mois : trafic, performance, sécurité et actions réalisées sur votre site.",
      },
    ],
    reasonsSubtitle:
      "La tranquillité d'esprit d'un partenaire local, réactif et transparent.",
    reasons: [
      {
        icon: "target",
        title: "Équipe réactive à Abidjan",
        text: "Un interlocuteur local qui connaît votre site et répond vite, en français et par WhatsApp.",
      },
      {
        icon: "shield-check",
        title: "Tranquillité d'esprit",
        text: "Vous ne vous souciez plus de la technique : nous anticipons les problèmes avant qu'ils ne surviennent.",
      },
      {
        icon: "smartphone",
        title: "Paiement Mobile Money",
        text: "Réglez votre abonnement mensuel simplement via Orange Money, MTN ou Wave.",
      },
      {
        icon: "headphones",
        title: "Support prioritaire",
        text: "Vos demandes sont traitées en priorité, avec un suivi transparent via votre espace client.",
      },
    ],
    faq: [
      {
        question: "Combien coûte la maintenance d'un site web ?",
        answer:
          "Nos contrats de maintenance démarrent à 50 000 FCFA par mois. Le tarif dépend de la taille de votre site, du niveau de support souhaité et du volume d'évolutions prévues.",
      },
      {
        question: "Que comprend un contrat de maintenance ?",
        answer:
          "Mises à jour techniques et de sécurité, sauvegardes régulières, surveillance 24/7, optimisation des performances, corrections, un quota d'évolutions et un rapport mensuel.",
      },
      {
        question: "Maintenez-vous un site que vous n'avez pas créé ?",
        answer:
          "Oui. Après un audit de votre site existant, nous pouvons en assurer la maintenance, qu'il ait été développé par nous ou par un autre prestataire.",
      },
      {
        question: "Puis-je résilier à tout moment ?",
        answer:
          "Oui. Nos contrats sont sans engagement de longue durée : vous pouvez ajuster votre formule ou résilier avec un simple préavis. Vos données restent les vôtres.",
      },
    ],
    ctaTitle: "Confiez-nous la maintenance de votre site",
    ctaDescription:
      "Recevez une proposition de maintenance adaptée à votre site sous 48h. Sans engagement.",
  },

  // ─────────────────────────────────────────────────────────────
  {
    slug: "site-etablissement-scolaire",
    eyebrow: "Site pour établissement scolaire",
    title: "Site web pour établissement scolaire",
    titleAccent: "établissement scolaire",
    metaTitle: "Site web pour établissement scolaire",
    metaDescription:
      "Site web pour école, collège, lycée, université ou centre de formation en Côte d'Ivoire : admissions en ligne, espace élèves/parents et actualités. Devis gratuit.",
    keywords: [
      "site web école Côte d'Ivoire",
      "site internet établissement scolaire Abidjan",
      "site web université Côte d'Ivoire",
      "site web collège lycée Abidjan",
      "préinscription en ligne école",
      "site centre de formation Abidjan",
    ],
    intro:
      "Le site institutionnel pensé pour les établissements d'enseignement — écoles, collèges, lycées, universités et centres de formation. Présentez votre établissement, publiez vos actualités et gérez admissions et vie scolaire en ligne.",
    serviceType: "Création de site web pour établissement scolaire",
    priceFrom: packPrice("etablissement-scolaire"),
    deliverablesSubtitle:
      "L'offre principale pour les écoles, collèges, lycées, universités et centres de formation.",
    deliverables: [
      {
        icon: "school",
        title: "Site institutionnel complet",
        text: "8 à 15 pages : présentation, filières et programmes, équipe pédagogique, vie scolaire, contact et accès.",
      },
      {
        icon: "file-text",
        title: "Préinscription & admission en ligne",
        text: "Un formulaire d'inscription en ligne qui simplifie les candidatures et centralise les dossiers des futurs élèves.",
      },
      {
        icon: "target",
        title: "Espace élèves & parents",
        text: "Un accès sécurisé aux documents, emplois du temps, résultats et communications de l'établissement.",
      },
      {
        icon: "megaphone",
        title: "Actualités & événements",
        text: "Publiez facilement vos actualités, événements, rentrées et galeries photos pour animer la vie de l'école.",
      },
      {
        icon: "globe",
        title: "Référencement local (SEO)",
        text: "Soyez trouvé par les parents qui cherchent une école à Abidjan, avec une fiche Google Business optimisée.",
      },
      {
        icon: "smartphone",
        title: "Paiement des frais en ligne",
        text: "Encaissez les frais de scolarité et d'inscription via Mobile Money (Orange, MTN, Wave).",
      },
    ],
    reasonsSubtitle:
      "Des spécialistes des établissements scolaires ivoiriens, à vos côtés toute l'année.",
    reasons: [
      {
        icon: "school",
        title: "Spécialistes des écoles",
        text: "Nous connaissons les besoins des établissements ivoiriens : admissions, communication parents et image institutionnelle.",
      },
      {
        icon: "target",
        title: "Équipe à Abidjan",
        text: "Formation de votre équipe administrative et accompagnement de proximité tout au long de l'année.",
      },
      {
        icon: "smartphone",
        title: "Accessible aux parents mobiles",
        text: "Un site rapide et clair sur smartphone, là où les parents consultent l'information au quotidien.",
      },
      {
        icon: "headphones",
        title: "Support pendant les inscriptions",
        text: "Un support réactif, particulièrement pendant les périodes de rentrée et d'admission.",
      },
    ],
    faq: [
      {
        question: "Proposez-vous des sites pour tous les types d'établissements ?",
        answer:
          "Oui. Nous concevons des sites pour les écoles primaires, collèges, lycées, universités, grandes écoles et centres de formation professionnelle, adaptés à la taille et aux besoins de chaque établissement.",
      },
      {
        question: "Peut-on gérer les préinscriptions en ligne ?",
        answer:
          "Oui. Nous intégrons un module de préinscription et d'admission en ligne : les parents remplissent le dossier depuis leur téléphone, et votre administration reçoit et traite les candidatures de façon centralisée.",
      },
      {
        question: "Combien coûte un site pour un établissement scolaire ?",
        answer:
          "Un site institutionnel scolaire démarre à 350 000 FCFA. Le tarif dépend du nombre de pages, des modules (espace élèves/parents, admissions, paiement) et du niveau de personnalisation.",
      },
      {
        question: "Les parents pourront-ils payer les frais en ligne ?",
        answer:
          "Oui. Nous intégrons le paiement Mobile Money (Orange Money, MTN, Wave) pour les frais d'inscription et de scolarité, avec un suivi des règlements.",
      },
      {
        question: "L'équipe administrative pourra-t-elle mettre à jour le site ?",
        answer:
          "Absolument. Nous livrons un espace d'administration simple et formons votre équipe pour publier les actualités, gérer les documents et suivre les inscriptions en toute autonomie.",
      },
    ],
    ctaTitle: "Donnez à votre établissement le site qu'il mérite",
    ctaDescription:
      "Recevez un devis gratuit et adapté à votre établissement scolaire sous 48h.",
  },
];

/** Tous les slugs de pages service (pour generateStaticParams, sitemap, etc.). */
export const serviceLandingSlugs = serviceLandingPages.map((p) => p.slug);

/** Récupère une page service par son slug (ou undefined). */
export function getServicePage(slug: string): ServiceLandingPage | undefined {
  return serviceLandingPages.find((p) => p.slug === slug);
}
