# Digital Access Academy — Cahier des charges (source)

La vision et les exigences complètes proviennent de deux sources rédigées par la structure :

1. **10 tomes de conception** (`Digital_Access_Academy/Tome_1..10.docx`) :
   1. Vision stratégique · 2. Architecture pédagogique · 3. Architecture des cours ·
   4. Architecture des projets · 5. Employabilité · 6. Certification · 7. Communauté ·
   8. Entreprises · 9. Administration · 10. Intelligence Artificielle.
2. **Cahier des charges maître** — synthèse actionnable : positionnement, stack, modèle de données
   (24 modèles), routes, rôles, seed, et 10 lots de développement.

Ces documents sont la **source de vérité**. Ce dossier `docs/academy/` en est la traduction technique
vivante : voir `architecture.md`, `data-model.md`, `roadmap.md`.

## Formule directrice

> Former → Pratiquer → Produire → Prouver → Certifier → Valoriser → Insérer.

## Décisions structurantes actées

- Reconstruction **from scratch** de `apps/academy`, **sans casser** `apps/web`.
- Base Neon + schéma Prisma **partagés** ; refonte destructive limitée aux tables Academy.
- Déploiement progressif : peu de parcours au départ, mais de qualité (6 parcours prioritaires).
- Mobile-first, 100 % français, prix en FCFA, contexte ivoirien/africain.
