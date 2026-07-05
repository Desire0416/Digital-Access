# CLAUDE.md — Digital Access Ecosystem

## Project overview

Digital Access is a two-app ecosystem built in a single Turborepo monorepo:

- **apps/web** → digitalaccess.ci — Site vitrine + portail client + CRM admin
- **apps/academy** → academy.digitalaccess.ci — Plateforme e-learning Access Academy (produit autonome complet)

Each app adapts its navigation and pages selon le rôle de l'utilisateur connecté (role-based UI). Pas d'application admin séparée — l'admin est intégré dans chaque app.

## Critical design rule

**LA PLATEFORME NE DOIT PAS ÊTRE GÉNÉRIQUE.** Chaque page doit porter l'identité Digital Access. Pas de template Tailwind/shadcn par défaut. Pas de hero "titre centré + bouton sur fond blanc". Pas de spinner générique. Chaque composant shadcn/ui utilisé DOIT être personnalisé visuellement avec l'identité DA.

Éléments obligatoires :
- Hero sections avec compositions visuelles originales (formes géométriques animées, illustrations SVG abstraites)
- Dégradé signature violet→cyan (#5B3FA8→#00BCD4) omniprésent (CTA, bordures focus, barres de progression, navigation active)
- Loader personnalisé aux couleurs DA (monogramme DA animé), jamais un spinner cercle
- Pages 404/500 brandées avec illustrations et personnalité
- Micro-interactions Framer Motion sur chaque élément interactif (hover, focus, click)
- Transitions de page animées (AnimatePresence) — jamais de rechargement brut
- Cards de cours avec personnalité : overlay gradient, badge catégorie, barre de progression intégrée, hover élévation 3D
- Scroll animations staggered (Intersection Observer + Framer Motion)

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Server Actions, Server Components) |
| Monorepo | Turborepo |
| Language | TypeScript (strict mode) |
| ORM | Prisma |
| Database | PostgreSQL (Neon serverless) |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |
| Auth | Auth.js v5 (NextAuth) — email/password + Google OAuth + GitHub OAuth |
| File storage | Vercel Blob |
| Video embed | YouTube / Vimeo iFrame |
| Realtime | Socket.io or Ably |
| Payments | CinetPay or FedaPay (Mobile Money: Orange, MTN, Wave) |
| Email | Resend + react-email templates |
| Rich text editor | Tiptap or Novel |
| PDF generation | @react-pdf/renderer |
| Charts | Recharts |
| Validation | Zod (server + client) |
| Deployment | Vercel |
| Monitoring | Vercel Analytics + Sentry |

## Monorepo structure

```
digital-access/
├── apps/
│   ├── web/                    # Site vitrine DA + portail client + CRM
│   │   ├── app/
│   │   │   ├── (public)/       # Pages publiques (VISITOR)
│   │   │   │   ├── page.tsx              # Accueil — hero animé, services, réalisations, témoignages
│   │   │   │   ├── services/             # Présentation des packs
│   │   │   │   ├── portfolio/            # Réalisations + page détail [slug]
│   │   │   │   ├── blog/                 # Articles + page [slug]
│   │   │   │   ├── contact/              # Formulaire + WhatsApp + Maps
│   │   │   │   ├── devis/                # Wizard multi-étapes de demande de devis
│   │   │   │   ├── tarifs/               # Comparaison des packs
│   │   │   │   ├── a-propos/             # Histoire, mission, valeurs
│   │   │   │   └── academy/              # Landing de promotion Access Academy
│   │   │   ├── (client)/       # Portail client (rôle CLIENT)
│   │   │   │   ├── mes-projets/          # Liste + page détail avec timeline
│   │   │   │   ├── factures/             # Historique + téléchargement PDF
│   │   │   │   ├── maintenance/          # Contrat de maintenance actif
│   │   │   │   └── support/              # Tickets de support
│   │   │   ├── (admin)/        # Back-office (rôle ADMIN)
│   │   │   │   ├── dashboard/            # KPI Recharts
│   │   │   │   ├── leads/                # CRM leads + pipeline kanban
│   │   │   │   ├── projets/              # Gestion projets + facturation
│   │   │   │   ├── blog-admin/           # CRUD articles
│   │   │   │   ├── portfolio-admin/      # CRUD réalisations
│   │   │   │   ├── utilisateurs/         # Gestion comptes
│   │   │   │   └── parametres/           # Config
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── verify/               # Vérification email token
│   │   │   ├── layout.tsx      # Layout racine avec navigation role-based
│   │   │   └── globals.css
│   │   ├── components/         # Composants spécifiques à apps/web
│   │   ├── lib/                # Utils spécifiques
│   │   └── next.config.ts
│   │
│   └── academy/                # Plateforme Access Academy (produit autonome)
│       ├── app/
│       │   ├── (public)/       # Pages publiques (VISITOR)
│       │   │   ├── page.tsx              # Accueil Academy — hero, cours vedettes, CTA
│       │   │   ├── courses/              # Catalogue + page détail [slug]
│       │   │   ├── pricing/              # Plans et abonnements
│       │   │   └── about/                # À propos d'Academy
│       │   ├── (learner)/      # Espace apprenant (rôle LEARNER)
│       │   │   ├── dashboard/            # Cours en cours, progression, streak
│       │   │   ├── courses/[slug]/
│       │   │   │   ├── learn/[chapterId]/  # Player de cours immersif
│       │   │   │   └── forum/            # Forum de discussion du cours
│       │   │   ├── certificates/         # Mes certificats
│       │   │   └── profile/              # Mon profil
│       │   ├── (instructor)/   # Studio instructeur (rôle INSTRUCTOR)
│       │   │   ├── studio/               # Dashboard instructeur
│       │   │   ├── courses/              # Mes cours + création wizard
│       │   │   │   ├── new/              # Wizard de création
│       │   │   │   └── [id]/edit/        # Édition d'un cours
│       │   │   ├── stats/                # Statistiques par cours
│       │   │   └── revenue/              # Revenus
│       │   ├── (admin)/        # Admin Academy (rôle ADMIN)
│       │   │   ├── admin/
│       │   │   │   ├── dashboard/        # KPI Recharts
│       │   │   │   ├── courses/          # Gestion cours (validation, publication)
│       │   │   │   ├── categories/       # CRUD catégories
│       │   │   │   ├── users/            # Gestion utilisateurs
│       │   │   │   ├── payments/         # Transactions + remboursements
│       │   │   │   ├── subscriptions/    # Abonnements actifs
│       │   │   │   └── settings/         # Paramètres Academy
│       │   ├── auth/
│       │   │   ├── login/
│       │   │   ├── register/
│       │   │   ├── verify/               # /auth/verify?token=[UUID]
│       │   │   └── verify-email/         # Page d'attente post-inscription
│       │   ├── verify/[code]/  # Vérification publique de certificat
│       │   ├── checkout/[courseId]/       # Paiement Mobile Money
│       │   ├── layout.tsx      # Layout avec navigation role-based
│       │   └── globals.css
│       ├── components/         # Composants spécifiques à Academy
│       └── next.config.ts
│
├── packages/
│   ├── db/                     # Prisma schema + client partagé
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Schéma unifié (toutes les entités)
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── index.ts            # Export du client Prisma
│   │
│   ├── ui/                     # Design system partagé
│   │   ├── components/         # Boutons, Cards, Modals, Tables, Inputs, etc.
│   │   ├── animations/         # Variants Framer Motion, transitions, wrappers
│   │   ├── theme/              # Tokens de design, couleurs, polices
│   │   ├── hooks/              # useMediaQuery, useIntersectionObserver, etc.
│   │   └── index.ts
│   │
│   ├── auth/                   # Auth.js config partagée
│   │   ├── config.ts           # Providers (email, Google, GitHub)
│   │   ├── middleware.ts       # Vérification de rôle
│   │   ├── guards.ts           # Fonctions de protection de route
│   │   └── index.ts
│   │
│   ├── email/                  # Templates Resend + service d'envoi
│   │   ├── templates/
│   │   │   ├── verify-email.tsx        # Confirmation de compte
│   │   │   ├── welcome.tsx             # Bienvenue post-confirmation
│   │   │   ├── reset-password.tsx      # Réinitialisation MDP
│   │   │   ├── course-enrolled.tsx     # Inscription à un cours
│   │   │   ├── certificate.tsx         # Certificat obtenu
│   │   │   ├── payment-confirmed.tsx   # Paiement reçu
│   │   │   ├── invoice.tsx             # Facture client (apps/web)
│   │   │   └── inactivity-reminder.tsx # Rappel de streak
│   │   ├── send.ts             # Service Resend (sendEmail function)
│   │   └── index.ts
│   │
│   ├── payment/                # CinetPay / FedaPay
│   │   ├── cinetpay.ts         # API CinetPay
│   │   ├── fedapay.ts          # API FedaPay
│   │   ├── webhooks.ts         # Traitement des webhooks
│   │   ├── subscriptions.ts    # Gestion des abonnements
│   │   └── index.ts
│   │
│   ├── realtime/               # Socket.io / Ably
│   │   ├── chat.ts
│   │   ├── notifications.ts
│   │   ├── presence.ts
│   │   └── index.ts
│   │
│   ├── pdf/                    # Génération PDF
│   │   ├── certificate.tsx     # Template certificat (@react-pdf/renderer)
│   │   ├── invoice.tsx         # Template facture
│   │   ├── quote.tsx           # Template devis
│   │   └── index.ts
│   │
│   └── config/                 # Config partagée
│       ├── tsconfig.base.json
│       ├── eslint.config.mjs
│       ├── tailwind.config.ts  # Thème DA avec couleurs, polices, animations
│       └── env.ts              # Validation des env vars (Zod)
│
├── turbo.json
├── package.json
├── CLAUDE.md                   # Ce fichier
└── .env.example
```

## Brand identity and design tokens

### Colors

```typescript
// packages/config/tailwind.config.ts
const colors = {
  // Logo gradient (signature)
  brand: {
    violet: '#5B3FA8',      // Dégradé start
    'blue-royal': '#2B5CC6', // Dégradé mid-1
    'blue-vif': '#1E8FE1',   // Dégradé mid-2
    cyan: '#00BCD4',         // Dégradé end
  },
  // Interface
  primary: '#2B3A8C',        // Boutons, liens, header
  secondary: '#06B6D4',      // Badges, tags, accents
  accent: '#7C3AED',         // Gamification, premium, badges
  navy: '#1A1A2E',           // Titres, texte principal
  // Functional
  success: '#059669',
  error: '#DC2626',
  warning: '#F59E0B',
  info: '#3B82F6',
  // Surfaces
  'surface-primary': '#FFFFFF',
  'surface-secondary': '#F9FAFB',
  'surface-dark': '#0F0F1A',   // Dark mode
  'surface-dark-card': '#1A1A2E',
  // Text
  'text-primary': '#1A1A2E',
  'text-secondary': '#6B7280',
  'text-muted': '#9CA3AF',
}

// Gradient CSS utility
// bg-gradient-da → background: linear-gradient(135deg, #5B3FA8, #00BCD4)
```

### Typography

```typescript
// Google Fonts to import
const fonts = {
  sans: ['Inter', 'sans-serif'],           // Corps de texte, UI
  display: ['Plus Jakarta Sans', 'sans-serif'], // Titres, headings
  mono: ['JetBrains Mono', 'monospace'],   // Code, données techniques
}

// Type scale
// H1: Plus Jakarta Sans 700, 36-48px (hero: 48-64px)
// H2: Plus Jakarta Sans 600, 24-30px
// H3: Plus Jakarta Sans 600, 20-24px
// Body: Inter 400, 16px, line-height 1.6
// Body small: Inter 400, 14px
// UI/Buttons: Inter 500, 14-16px
// Caption: Inter 400, 12px
// Code: JetBrains Mono 400, 14px
```

### Border radius

```
Inputs: 8px (rounded-lg)
Buttons: 8px (rounded-lg)  
Cards: 12px (rounded-xl)
Modals: 16px (rounded-2xl)
Badges/Pills: 9999px (rounded-full)
```

### Shadows (hover only, no shadows at rest)

```
hover: shadow-lg (0 10px 15px -3px rgba(0,0,0,0.1))
card-hover: shadow-xl + scale(1.02) via Framer Motion
```

## Authentication flow (Resend email confirmation)

### Registration flow

```
1. User fills form → Zod validation (email, password 8+ chars with uppercase + digit, name)
2. Server Action: createUser()
   → Hash password (bcrypt, 12 rounds)
   → Create User in DB with emailVerified: null, isActive: false
   → Generate token: crypto.randomUUID()
   → Store in VerificationToken table (token, userId, type: EMAIL_VERIFICATION, expiresAt: now + 24h)
   → Send email via Resend (packages/email, template: verify-email.tsx)
   → Redirect to /auth/verify-email (waiting page)
3. Waiting page: animated envelope, "Check your inbox at [email]", "Resend email" button (rate limited: 1 per 2 min)
4. User clicks link in email → /auth/verify?token=[UUID]
5. Server: validate token (exists, not expired, not used)
   → Update User: emailVerified = new Date(), isActive = true
   → Mark token: usedAt = new Date()
   → Delete other pending tokens for this user
   → Create session (Auth.js)
   → Redirect to /dashboard with confetti animation + "Welcome!" toast
6. If token expired/invalid → error page + "Resend verification email" button
```

### Restrictions before email verification

```
emailVerified === null → user can:
  ✓ Browse public pages and catalogue
  ✓ View course detail pages
  ✗ Cannot purchase courses or subscribe
  ✗ Cannot participate in forums or chat
  ✗ Cannot access the full dashboard
  → Persistent banner: "Confirmez votre email pour accéder à toutes les fonctionnalités" with CTA
```

### Google OAuth → emailVerified auto-set to true (verified by Google)

### Resend email templates (packages/email)

All templates use react-email components and carry the DA brand:
- Logo DA header with gradient accent line
- Plus Jakarta Sans headings, Inter body
- Primary CTA button with gradient violet→cyan
- Footer with unsubscribe + social links

```
From: "Access Academy" <noreply@digitalaccess.ci>
Reply-To: contact@digitalaccess.ci
```

## Prisma schema key entities

### User model

```prisma
model User {
  id             String    @id @default(cuid())
  name           String
  email          String    @unique
  password       String?   // null for OAuth-only users
  avatar         String?
  bio            String?
  roles          UserRole[] @default([LEARNER])
  emailVerified  DateTime?
  isActive       Boolean   @default(false)
  streak         Int       @default(0)
  xp             Int       @default(0)
  lastActiveAt   DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  // ... relations
}

enum UserRole {
  LEARNER
  CLIENT
  INSTRUCTOR
  ADMIN
  SUPER_ADMIN
}
```

### VerificationToken model

```prisma
model VerificationToken {
  id        String   @id @default(cuid())
  token     String   @unique
  type      TokenType
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
}

enum TokenType {
  EMAIL_VERIFICATION
  PASSWORD_RESET
}
```

### Key entities by pole

**Solutions pole (apps/web):** Lead, Project, ProjectStage, Invoice, MaintenanceContract, Ticket, TicketMessage, ProjectMessage

**Academy pole (apps/academy):** Course, Category, Module, Chapter, Quiz, QuizQuestion, Enrollment, Progress, Certificate, Review, Comment, ForumTopic, ForumReply, ChatRoom, ChatMessage

**Shared:** User, Payment, Subscription, PromoCode, Notification, BlogPost, Testimonial, PortfolioProject, VerificationToken

### Key enums

```
UserRole: LEARNER, CLIENT, INSTRUCTOR, ADMIN, SUPER_ADMIN
CourseLevel: BEGINNER, INTERMEDIATE, ADVANCED
CourseStatus: DRAFT, REVIEW, PUBLISHED, ARCHIVED
ChapterType: VIDEO, TEXT, QUIZ, EXERCISE, ASSIGNMENT
PaymentStatus: PENDING, COMPLETED, FAILED, REFUNDED
PaymentProvider: CINETPAY, FEDAPAY, MANUAL, FREE
PaymentType: COURSE, SUBSCRIPTION, INVOICE
SubscriptionPlan: MONTHLY, YEARLY
SubscriptionStatus: ACTIVE, CANCELLED, EXPIRED, PAST_DUE
LeadStatus: NEW, CONTACTED, QUOTE_SENT, NEGOTIATION, WON, LOST
ProjectStatus: PENDING, IN_PROGRESS, REVIEW, DELIVERED, MAINTENANCE, ARCHIVED
ProjectType: SITE_VITRINE, SITE_INSTITUTIONNEL, ELEARNING, REFONTE, MAINTENANCE, OTHER
InvoiceStatus: DRAFT, SENT, PAID, OVERDUE, CANCELLED
TicketPriority: LOW, MEDIUM, HIGH, URGENT
TicketStatus: OPEN, IN_PROGRESS, RESOLVED, CLOSED
MaintenancePlan: BASIC, STANDARD, PREMIUM
BlogStatus: DRAFT, PUBLISHED, ARCHIVED
TokenType: EMAIL_VERIFICATION, PASSWORD_RESET
```

## Domains and routing

```
digitalaccess.ci           → apps/web (site vitrine + client + admin)
academy.digitalaccess.ci   → apps/academy (e-learning platform)
```

## Role-based navigation

### apps/web

| Role | Navigation items |
|------|-----------------|
| VISITOR | Accueil, Services, Réalisations, Blog, Tarifs, Contact, Devis, Connexion |
| CLIENT | Accueil, Mes Projets, Factures, Maintenance, Support, Profil |
| ADMIN | Dashboard, Leads, Projets, Factures, Blog, Portfolio, Utilisateurs, Paramètres |

### apps/academy

| Role | Navigation items |
|------|-----------------|
| VISITOR | Catalogue, Tarifs, À propos, Connexion, Inscription |
| LEARNER | Catalogue, Mes cours, Dashboard, Certificats, Profil |
| INSTRUCTOR | Catalogue, Mes cours (studio), Statistiques, Revenus, Profil |
| ADMIN | Dashboard admin, Cours, Catégories, Utilisateurs, Paiements, Abonnements, Paramètres |

## Coding conventions

### General

- TypeScript strict mode everywhere
- Zod validation on ALL Server Actions and Route Handlers (never trust client input)
- Server Components by default, "use client" only when needed (interactivity, hooks)
- Server Actions for mutations, Route Handlers for webhooks and public API
- Prisma select: always specify fields, never `select *`
- Cursor-based pagination (not offset)
- All dates in UTC, display in user's timezone
- Currency: FCFA (XOF), no decimals
- Language: French (interface), i18n-ready architecture

### File naming

```
components/   → PascalCase (CourseCard.tsx, HeroSection.tsx)
lib/          → camelCase (sendEmail.ts, generatePdf.ts)
hooks/        → camelCase with use prefix (useMediaQuery.ts)
actions/      → camelCase (createCourse.ts, enrollUser.ts)
app/          → kebab-case folders (mes-projets/, verify-email/)
```

### Component patterns

```tsx
// Server Component (default)
export default async function CourseCatalog() {
  const courses = await getCourses()
  return <CourseGrid courses={courses} />
}

// Client Component (only when needed)
"use client"
export function CourseCard({ course }: { course: Course }) {
  // Framer Motion, event handlers, hooks
}
```

### Framer Motion conventions

```tsx
// Page transitions — wrap in layout.tsx
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
</AnimatePresence>

// Card hover
<motion.div
  whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
/>

// Stagger list
const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

// Progress bar
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${progress}%` }}
  transition={{ type: "spring", stiffness: 100, damping: 20 }}
  className="h-2 rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan"
/>

// ALWAYS respect reduced motion
@media (prefers-reduced-motion: reduce) → disable animations
```

### Security rules

- bcrypt with 12 salt rounds for passwords
- JWT sessions via Auth.js, 1h expiration
- Rate limiting on: login (5/min), register (3/min), password reset (3/hour), resend verification (1/2min)
- CSRF protection on all forms
- DOMPurify on all rich text content (forum posts, comments, course content)
- Signed URLs for Vercel Blob (videos, private files)
- Webhook signature verification (CinetPay/FedaPay)
- Row-level security: users see only their own data (Prisma where clauses with userId)
- Soft delete with 30-day retention

## Performance targets

```
FCP: < 1.5s (SSR for public pages)
LCP: < 2.5s (next/image with WebP, lazy loading)
CLS: < 0.1 (skeleton loading, fixed dimensions)
TTI: < 3s (code splitting, dynamic imports)
```

- ISR for catalogue and blog pages
- SWR or React Query for dynamic data
- Dynamic imports for heavy components (rich text editor, chat, charts)
- Optimize for 3G/4G mobile connections (common in Côte d'Ivoire)

## Environment variables

```env
# Database
DATABASE_URL=postgresql://...@neon.tech/digital-access

# Auth
AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Resend
RESEND_API_KEY=
EMAIL_FROM=noreply@digitalaccess.ci

# Payment
CINETPAY_API_KEY=
CINETPAY_SITE_ID=
CINETPAY_SECRET_KEY=

# Storage
BLOB_READ_WRITE_TOKEN=

# Realtime
ABLY_API_KEY= (or SOCKET_IO config)

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=

# URLs
NEXT_PUBLIC_WEB_URL=https://digitalaccess.ci
NEXT_PUBLIC_ACADEMY_URL=https://academy.digitalaccess.ci
```

## Sprint roadmap (14 sprints, 7 months)

| Sprint | Focus | Key deliverables |
|--------|-------|-----------------|
| S1 | Infrastructure | Turborepo setup, Prisma/Neon, Auth.js (email+Google+Resend verification), packages/ui design system, role-based layout |
| S2 | Site DA (1) | Homepage hero animé, Services, À propos, Contact+WhatsApp, SEO |
| S3 | Site DA (2) | Portfolio, Devis wizard, Blog, Tarifs, Témoignages, Légales |
| S4 | Academy catalogue | Course/Module/Chapter models, catalogue page filters+search, course detail, seed data |
| S5 | Course player | Immersive player layout, sidebar, video player (Blob+embed), MDX content, navigation, progress tracking |
| S6 | Quiz + Progress | Quiz QCU/QCM, animated feedback, scoring, learner dashboard, streak, completion |
| S7 | Payment | CinetPay/FedaPay integration, checkout, webhooks, subscriptions, conditional access |
| S8 | Instructor studio | Course creation wizard, drag-and-drop, video upload, quiz editor, preview, publication workflow |
| S9 | Client portal | Client dashboard, projects+timeline, deliverables, messaging, invoicing, maintenance |
| S10 | CRM Admin DA | KPI dashboard, leads+pipeline, PDF quotes, project management, tickets, blog, portfolio |
| S11 | Forum + Chat | Forum per course, comments per chapter, real-time chat (Socket.io/Ably), presence, mentions |
| S12 | Academy admin | KPI Recharts, course/category/user/payment/subscription management, promo codes |
| S13 | Certificates + Notifs | PDF certificates+QR, /verify page, badges, in-app+email notifications, preferences |
| S14 | Polish + Launch | Final Framer Motion animations, responsive, E2E tests, performance, SEO, pricing page, beta launch |

## Current sprint

**Sprint 1 — Infrastructure**

Focus: Turborepo setup, database schema, authentication with email verification, design system foundation.

### Done
- [x] Turborepo init with apps/web + all packages (@da/config, @da/db, @da/ui) — build green
- [x] Prisma schema (complete — all ~35 entities, both poles) — `prisma validate` OK
- [x] Neon database provisioned + seeded — schema pushed, verified end-to-end (register/verify/login/lead round-trip)
- [x] Auth.js v5 email/password (`@da/auth`, credentials + JWT sessions) — real login→session→protected `/mon-espace`; password reset done; Google OAuth pending real creds
- [x] Email verification flow with Resend (`@da/email`, branded templates) — register→verify token→activate works; ⚠️ verify `digitalaccess.ci` domain in Resend to deliver to arbitrary recipients (currently onboarding@resend.dev test mode)
- [x] packages/ui: design system foundation (Monogram/Loader, Button, Card, Field, tokens…)
- [x] Role-based layout and navigation (SiteHeader/SiteFooter, PageTransition)
- [x] Tailwind CSS 4 config with DA brand tokens (`@theme` in apps/web/app/globals.css)
- [x] Framer Motion page transition wrapper (AnimatePresence in PageTransition.tsx)

**Also delivered (Sprint 2–3 — site vitrine apps/web):** homepage (hero animé, stats, services, méthode, réalisations, Academy promo, témoignages), Services, Portfolio (+[slug]), Tarifs, Blog (+[slug]), À propos, Contact (form+action), Devis wizard, Academy landing, Légales (mentions/CGU/confidentialité), FAQ, Auth (login/register/verify-email/verify), 404/500/loading brandés, SEO (sitemap/robots/manifest). `next build` → 34 routes, exit 0.

**Also delivered (Sprints 4–6 — apps/academy, port 3001):** thème DA partagé extrait dans `packages/ui/src/theme.css` (importé par les 2 apps) ; data layer réel (`lib/queries.ts` + `lib/actions.ts` : catalogue filtré, détail, player avec verrouillage preview, dashboard, enrollInCourse, markChapterComplete avec streak/XP, submitQuiz noté serveur) ; seed 4 cours FR complets (28 chapitres VIDEO/TEXT/QUIZ, avis, apprenant démo `apprenant@digitalaccess.ci`) ; player immersif (groupe `(learn)` sans chrome, sidebar sombre rétractable, embeds YouTube nocookie, markdown+GFM via @tailwindcss/typography, QuizRunner QCU/QCM feedback animé) ; pages (groupe `(site)`) : accueil, catalogue (recherche debounce + filtres URL), détail cours (accordéon programme, EnrollCTA, sticky card), dashboard (streak/XP/reprendre), auth Academy (callbackUrl), pricing, about. E2E vérifié contre Neon (inscription→vérif→login→enroll→chapitre→quiz 100%→progression/streak/XP→dashboard). `next build` academy → 13 routes, exit 0.

**Sprint 7 (paiement, version pré-API) :** paiement Mobile Money **manuel** — `/checkout/[slug]` (numéros Orange/MTN/Wave dans `paymentConfig` = **placeholders à remplacer**, preuve : ID transaction unique + capture compressée), `Payment` PENDING (provider MANUAL) ; `/admin/payments` (rôle ADMIN) approuve→inscription+email / rejette+motif. Invariant : **une preuve ne donne jamais accès — seule l'approbation admin crée l'inscription**. E2E vérifié.

**Sprint 8 (studio instructeur) :** `lib/studio-{types,queries,actions}.ts` avec **vérification de propriété** sur chaque mutation (owner OU admin) ; workflow `DRAFT→REVIEW→PUBLISHED` (soumettre/approuver/rejeter+motif via champ `Course.reviewNote`). `/studio` (dashboard : stats revenus/apprenants/note, mes cours, création), `/studio/courses/[id]/edit` (onglets Infos / Programme drag-and-drop Reorder / Publication ; éditeur de chapitre vidéo/markdown/quiz), `/admin/courses` (file de validation). Le player autorise la prévisualisation de brouillon par le propriétaire/admin. E2E vérifié contre Neon (Koffi crée→édite→ajoute chapitre→soumet→admin approuve→publié→catalogue ; apprenant bloqué de l'éditeur).

**Sprint 9 (portail client, apps/web) :** `lib/portal-{queries,actions}.ts` avec **sécurité au niveau ligne** (chaque requête/action filtre `clientId===userId`). Nav CLIENT dans le header (Tableau de bord/Mes projets/Factures/Maintenance/Support). Pages : `/mon-espace` (dashboard : projets+progression, facture à venir, tickets, activité), `/mes-projets`(+[id] : timeline verticale des étapes, livrables, **messagerie projet** temps réel, validation de livrable), `/factures`(+[id] facture imprimable → PDF via window.print), `/maintenance` (contrat + comparatif plans), `/support`(+[id] : création de ticket + fil de discussion). Client de démo seedé : `client@digitalaccess.ci` / `DigitalAccess2026!` (Aïcha Koné, projet Boutique Élégance à 50%). E2E vérifié (dashboard→projet→message→ticket ; non-propriétaire bloqué). Paiement maintenance en ligne + CRM admin (S10) = suivant.

## Notes for Claude Code

- When creating components, ALWAYS customize them visually. No default shadcn appearance.
- The gradient `bg-gradient-to-r from-brand-violet to-brand-cyan` is the signature — use it on primary CTAs, active states, progress bars, accents.
- Every page transition uses Framer Motion AnimatePresence.
- Every list renders with stagger animation.
- Every card has a hover effect (scale + shadow via Framer Motion).
- The loader component uses the DA monogram animation, never a generic spinner.
- Skeleton loading on every async component.
- All emails go through packages/email with Resend — branded templates with react-email.
- Mobile Money payment is the PRIMARY payment method (CinetPay/FedaPay).
- Currency is FCFA, no decimals, use Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF' }).
- Interface language is French.
- Target audience is in Côte d'Ivoire — optimize for mobile 3G/4G.
