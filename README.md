# Digital Access — Écosystème numérique

> Le numérique accessible, utile et stratégique.

Monorepo **Turborepo** de l'écosystème Digital Access : deux applications Next.js 15 qui partagent 60–70 % de leur code via des packages communs.

| Application | Domaine | Périmètre |
|-------------|---------|-----------|
| **apps/web** | digitalaccess.ci | Site vitrine + portail client + CRM admin |
| **apps/academy** | academy.digitalaccess.ci | Plateforme e-learning Access Academy |

La navigation et les pages s'adaptent au **rôle** de l'utilisateur connecté (VISITOR, CLIENT, LEARNER, INSTRUCTOR, ADMIN, SUPER_ADMIN) — pas d'app admin séparée.

---

## 🎨 Principe de design : anti-générique

La plateforme **ne doit jamais** ressembler à un template sorti de boîte. Chaque page porte l'identité Digital Access :

- **Dégradé signature** violet→cyan (`#5B3FA8 → #00BCD4`) omniprésent — CTA, bordures focus, barres de progression, accents.
- **Loader monogramme DA** animé (jamais un spinner générique).
- **Hero sections** à composition visuelle originale (dégradés animés, formes organiques, mockups flottants).
- **Micro-interactions Framer Motion** partout (hover, focus, tap, reveal au scroll).
- **Transitions de page** narratives via `AnimatePresence`.
- **Pages 404/500** brandées.

Le design system vit dans **`packages/ui`** (`@da/ui`).

---

## 🧱 Stack technique

Next.js 15 (App Router) · TypeScript strict · Turborepo · Tailwind CSS 4 · Framer Motion · Prisma + PostgreSQL (Neon) · Auth.js v5 · Resend · CinetPay/FedaPay (Mobile Money) · Vercel Blob · @react-pdf/renderer · Recharts · Zod · Vercel.

## 📁 Structure

```
digital-access/
├── apps/
│   └── web/                 # Site DA (vitrine + client + admin)
│       ├── app/(public)/    # Pages publiques (VISITOR)
│       ├── app/auth/        # Connexion / inscription / vérification
│       ├── components/      # Composants spécifiques à l'app
│       └── lib/             # site.ts (config) · content.ts (contenu éditorial)
├── packages/
│   ├── ui/                  # @da/ui — design system (composants, animations, thème)
│   ├── db/                  # @da/db — schéma Prisma unifié + données de démo
│   └── config/             # @da/config — tsconfig, validation env (Zod)
├── turbo.json
└── package.json
```

## 🚀 Démarrage

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env        # renseignez les valeurs (facultatif en dev)

# 3. Lancer apps/web en développement
npm run web                 # → http://localhost:3000
# ou tout le monorepo
npm run dev
```

> **Sans base de données ?** Le site public fonctionne d'emblée : les pages consomment
> des **données de démonstration typées** (`@da/db` → `src/mock.ts`). Le client Prisma
> n'est chargé que lorsqu'on l'importe explicitement (`@da/db/client`).

### Base de données (optionnel)

```bash
# Après avoir renseigné DATABASE_URL (Neon PostgreSQL)
npm run db:generate         # génère le client Prisma
npm run db:push             # applique le schéma
npm run db:seed             # jeu de données de démo
```

Compte administrateur de démonstration après seed :
`admin@digitalaccess.ci` / `DigitalAccess2026!`

## 📜 Scripts

| Script | Effet |
|--------|-------|
| `npm run dev` | Démarre toutes les apps (Turborepo) |
| `npm run web` | Démarre uniquement apps/web (port 3000) |
| `npm run build` | Build de production |
| `npm run typecheck` | Vérification TypeScript |
| `npm run db:generate\|push\|seed` | Prisma |

## 🎨 Tokens de marque

| Rôle | Valeur |
|------|--------|
| Dégradé | `linear-gradient(135deg,#5B3FA8,#2B5CC6,#1E8FE1,#00BCD4)` — utilitaire `bg-gradient-da` / `text-gradient-da` |
| Primaire | `#2B3A8C` · Secondaire `#06B6D4` · Accent `#7C3AED` · Navy `#1A1A2E` |
| Titres | Plus Jakarta Sans · Corps : Inter · Code : JetBrains Mono |
| Devise | FCFA (XOF), sans décimale |

## 🗺️ Roadmap (14 sprints)

Ce dépôt couvre le **Sprint 1 (infrastructure & design system)** et le **Sprint 2–3 (site vitrine apps/web)** : monorepo, schéma Prisma complet, `@da/ui`, et l'ensemble des pages publiques + parcours d'authentification. Les sprints suivants (Academy, portail client, CRM, paiement, forum/chat, certificats) s'appuient sur ces fondations partagées.

## 📄 Licence

© Digital Access — Abidjan, Côte d'Ivoire. Tous droits réservés.
