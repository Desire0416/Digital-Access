/* ══════════════════════════════════════════════════════════════════════════
   CORRECTION DE CONFORMITÉ — contenus stockés en base.
   Remplacements de chaînes EXACTES sur les seuls enregistrements identifiés
   par l'audit (scripts/audit-conformite.mjs). Aucune suppression de ligne.
   Idempotent : relancer le script ne change plus rien une fois appliqué.

   Usage (depuis packages/academy-db) :
     node --env-file=../../.env scripts/fix-conformite-contenus.mjs [--dry]
   ══════════════════════════════════════════════════════════════════════════ */

import { PrismaClient as AcademyClient } from "../generated/client/index.js";
import { PrismaClient as WebClient } from "@prisma/client";

const DRY = process.argv.includes("--dry");

/* Ordre significatif : les expressions les plus longues d'abord. */
const REMPLACEMENTS = [
  ["projet professionnel certifiant", "projet professionnel de validation"],
  ["projet certifiant", "projet de validation"],
  ["La certification est délivrée", "Le certificat interne de réussite est délivré"],
  ["Formation professionnelle certifiante", "Formation professionnelle courte"],
  ["Formation certifiante niveau", "Formation professionnelle courte, niveau"],
  ["Formations certifiantes", "Formations avec certificat"],
];

/** Cibles : { base, model, id, fields[] } — issues de l'audit. */
const CIBLES = [
  { base: "academy", model: "course", id: "cmrgtl3jf000dua08nxz4l1a9", fields: ["description"] },
  { base: "academy", model: "course", id: "cmrgtlipm003iua08tet6f6ln", fields: ["description", "objectives"] },
  { base: "web", model: "blogPost", id: "cmrf9k4q0000buax4dufzq6jk", fields: ["content"] },
  { base: "web", model: "careerPath", id: "cmrge65np0001uawsqd54szln", fields: ["shortDescription", "longDescription", "outcomes"] },
  { base: "web", model: "careerPath", id: "cmrgjaxcr0001ua6s4dox56n8", fields: ["shortDescription", "longDescription", "objectives"] },
];

function corriger(valeur) {
  if (typeof valeur !== "string") return { valeur, change: false };
  let out = valeur;
  for (const [avant, apres] of REMPLACEMENTS) out = out.split(avant).join(apres);
  return { valeur: out, change: out !== valeur };
}

async function traiter(client, cible, journal) {
  const row = await client[cible.model].findUnique({ where: { id: cible.id } });
  if (!row) {
    journal.push({ ...cible, statut: "INTROUVABLE" });
    return;
  }
  const data = {};
  for (const field of cible.fields) {
    const actuel = row[field];
    if (Array.isArray(actuel)) {
      const nouveau = actuel.map((v) => corriger(v).valeur);
      if (JSON.stringify(nouveau) !== JSON.stringify(actuel)) {
        data[field] = nouveau;
        journal.push({ ...cible, field, statut: "MODIFIÉ (liste)" });
      }
    } else {
      const { valeur, change } = corriger(actuel);
      if (change) {
        data[field] = valeur;
        journal.push({ ...cible, field, statut: "MODIFIÉ" });
      }
    }
  }
  if (Object.keys(data).length === 0) {
    journal.push({ ...cible, statut: "déjà conforme" });
    return;
  }
  if (!DRY) await client[cible.model].update({ where: { id: cible.id }, data });
}

async function main() {
  const journal = [];
  const academy = new AcademyClient();
  const web = new WebClient();
  try {
    for (const cible of CIBLES) {
      await traiter(cible.base === "academy" ? academy : web, cible, journal);
    }
  } finally {
    await academy.$disconnect();
    await web.$disconnect();
  }

  console.log(DRY ? "── SIMULATION (--dry) ──" : "── APPLIQUÉ ──");
  for (const j of journal) {
    console.log(`  [${j.base}] ${j.model}.${j.field ?? "*"} (${j.id.slice(0, 10)}…) → ${j.statut}`);
  }
  const n = journal.filter((j) => String(j.statut).startsWith("MODIFIÉ")).length;
  console.log(`\n${n} champ(s) ${DRY ? "à modifier" : "modifié(s)"}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
