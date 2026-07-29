/* ══════════════════════════════════════════════════════════════════════════
   AUDIT DE CONFORMITÉ — LECTURE SEULE. N'écrit ni ne supprime RIEN.
   Balaie les contenus stockés en base (les deux bases : web + academy) à la
   recherche du vocabulaire réglementé interdit et des affirmations chiffrées
   non vérifiables. Sortie : rapport JSON + résumé console.

   Usage (depuis packages/academy-db) :
     node --env-file=../../.env scripts/audit-conformite.mjs
   ══════════════════════════════════════════════════════════════════════════ */

import { PrismaClient as AcademyClient } from "../generated/client/index.js";
import { PrismaClient as WebClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

/* ─── Motifs recherchés ─────────────────────────────────────────────────── */
const PATTERNS = [
  { key: "certifiant", re: /certifiante?s?\b/gi, gravite: "haute" },
  { key: "certification reconnue", re: /certification[s]?\s+(reconnue?s?|professionnelle[s]?\s+reconnue?s?)/gi, gravite: "haute" },
  { key: "certificat officiel", re: /certificat[s]?\s+officiel[s]?/gi, gravite: "haute" },
  { key: "diplôme", re: /dipl[oô]m/gi, gravite: "haute" },
  { key: "agréé/accrédité", re: /agr[ée]{2}[es]?\b|accr[ée]dit/gi, gravite: "haute" },
  { key: "reconnu par", re: /reconnue?s?\s+par\s+(l'|le|les|la)/gi, gravite: "haute" },
  { key: "officiel", re: /officiel(le)?s?\b/gi, gravite: "moyenne" },
  { key: "titre reconnu", re: /titre[s]?\s+reconnu/gi, gravite: "haute" },
  { key: "chiffre non vérifiable", re: /\b\d{3,}\s?\+|\b\d{2,}\s?%\s*(de\s+)?(r[ée]ussite|satisfaction|insertion)/gi, gravite: "moyenne" },
  { key: "promotion (école)", re: /promotion\s+20\d{2}/gi, gravite: "moyenne" },
];

/* Modèles à balayer, par base. */
const ACADEMY_MODELS = [
  "course", "module", "lesson", "careerPath", "school", "review", "certificate",
  "faqItem", "event", "cohort", "announcement", "skill", "project", "program",
  "assessment", "portfolio", "portfolioItem",
];
const WEB_MODELS = ["testimonial", "blogPost", "portfolioProject", "shortCourse", "careerPath", "school", "badge"];

/* Champs à ignorer (identifiants, URLs, dates…). */
const SKIP_FIELDS = /^(id|slug|code|.*Id|.*Url|.*Image|url|image|email|password|token|createdAt|updatedAt|provider|status|type|locale|language|color|icon|hash|.*Key)$/i;

function scanValue(value) {
  const hits = [];
  if (typeof value !== "string" || value.length === 0) return hits;
  for (const p of PATTERNS) {
    p.re.lastIndex = 0;
    const m = p.re.exec(value);
    if (m) {
      const start = Math.max(0, m.index - 60);
      const extrait = value.slice(start, m.index + m[0].length + 60).replace(/\s+/g, " ").trim();
      hits.push({ motif: p.key, gravite: p.gravite, trouve: m[0], extrait });
    }
  }
  return hits;
}

async function scanModel(client, base, model) {
  const delegate = client[model];
  if (!delegate?.findMany) return [];
  let rows;
  try {
    rows = await delegate.findMany();
  } catch (e) {
    console.warn(`  ⚠️  ${base}.${model} : ${String(e.message).split("\n")[0]}`);
    return [];
  }
  const findings = [];
  for (const row of rows) {
    for (const [field, value] of Object.entries(row)) {
      if (SKIP_FIELDS.test(field)) continue;
      const values = Array.isArray(value) ? value : [value];
      for (const v of values) {
        for (const hit of scanValue(v)) {
          findings.push({
            base, model, field,
            id: row.id ?? "(sans id)",
            titre: row.title ?? row.name ?? row.question ?? row.author ?? null,
            ...hit,
          });
        }
      }
    }
  }
  return findings;
}

async function main() {
  const findings = [];

  console.log("── Base ACADEMY ──");
  const academy = new AcademyClient();
  try {
    for (const m of ACADEMY_MODELS) {
      const f = await scanModel(academy, "academy", m);
      if (f.length) console.log(`  ${m}: ${f.length} occurrence(s)`);
      findings.push(...f);
    }
  } finally {
    await academy.$disconnect();
  }

  console.log("── Base WEB ──");
  const web = new WebClient();
  try {
    for (const m of WEB_MODELS) {
      const f = await scanModel(web, "web", m);
      if (f.length) console.log(`  ${m}: ${f.length} occurrence(s)`);
      findings.push(...f);
    }
  } finally {
    await web.$disconnect();
  }

  writeFileSync("audit-conformite.json", JSON.stringify(findings, null, 2), "utf8");

  console.log(`\n════ TOTAL : ${findings.length} occurrence(s) ════`);
  const parMotif = {};
  for (const f of findings) parMotif[f.motif] = (parMotif[f.motif] ?? 0) + 1;
  for (const [motif, n] of Object.entries(parMotif).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${motif}: ${n}`);
  }
  console.log("\nRapport détaillé : packages/academy-db/audit-conformite.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
