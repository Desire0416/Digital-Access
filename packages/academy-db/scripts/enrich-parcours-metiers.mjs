// Remplit les parcours métiers « coquilles vides » : description, missions,
// résultats, phases, formations rattachées et projet final transversal.
// Idempotent. Laisse volontairement le statut en DRAFT — la publication et le
// prix définitif sont une décision du porteur du projet.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { PrismaClient } = require("../generated/client");

const prisma = new PrismaClient({ datasourceUrl: process.env.ACADEMY_DATABASE_URL });
async function wake() {
  for (let i = 0; i < 20; i++) {
    try { await prisma.$queryRawUnsafe("SELECT 1"); return; } catch { await new Promise((r) => setTimeout(r, 3000)); }
  }
}

const APPLY_PRICE = process.argv.includes("--prix");
const paths = JSON.parse(readFileSync("scripts/content-parcours-metiers.json", "utf8"));

async function main() {
  await wake();

  // Garde-fou : tout slug de formation doit exister ET être publié.
  const allSlugs = [...new Set(paths.flatMap((p) => p.phases.flatMap((ph) => ph.courseSlugs)))];
  const courses = await prisma.course.findMany({
    where: { slug: { in: allSlugs } },
    select: { id: true, slug: true, title: true, price: true, status: true },
  });
  const bySlug = new Map(courses.map((c) => [c.slug, c]));
  const missing = allSlugs.filter((s) => !bySlug.has(s));
  const unpublished = courses.filter((c) => c.status !== "PUBLISHED").map((c) => c.slug);
  if (missing.length) throw new Error("Formations introuvables : " + missing.join(", "));
  if (unpublished.length) throw new Error("Formations non publiées : " + unpublished.join(", "));

  const report = [];
  for (const p of paths) {
    const path = await prisma.careerPath.findUnique({ where: { slug: p.slug }, select: { id: true, title: true, price: true } });
    if (!path) { console.warn("Parcours introuvable :", p.slug); continue; }

    // 1) Métadonnées éditoriales (le prix seulement si --prix).
    await prisma.careerPath.update({
      where: { id: path.id },
      data: {
        description: p.description,
        missions: p.missions,
        outcomes: p.outcomes,
        ...(APPLY_PRICE ? { price: p.suggestedPrice } : {}),
      },
    });

    // 2) Reconstruction phases + formations.
    await prisma.careerPathCourse.deleteMany({ where: { careerPathId: path.id } });
    await prisma.careerPathPhase.deleteMany({ where: { careerPathId: path.id } });

    const optional = new Set(p.optionalCourseSlugs ?? []);
    let position = 0;
    let phaseOrder = 0;
    for (const ph of p.phases) {
      phaseOrder += 1;
      const phase = await prisma.careerPathPhase.create({
        data: { careerPathId: path.id, title: ph.title, description: ph.description, order: phaseOrder },
        select: { id: true },
      });
      for (const slug of ph.courseSlugs) {
        const c = bySlug.get(slug);
        position += 1;
        await prisma.careerPathCourse.create({
          data: {
            careerPathId: path.id,
            courseId: c.id,
            phaseId: phase.id,
            position,
            isRequired: !optional.has(slug),
          },
        });
      }
    }

    // 3) Projet final transversal.
    await prisma.project.deleteMany({ where: { careerPathId: path.id } });
    await prisma.project.create({
      data: {
        careerPathId: path.id,
        title: p.project.title,
        context: p.project.context,
        objectives: [],
        deliverables: p.project.deliverables,
        minScore: 70,
        maxAttempts: 2,
        isRequired: true,
        order: 1,
        status: "PUBLISHED",
      },
    });

    report.push({
      parcours: path.title,
      formations: position,
      phases: phaseOrder,
      prixActuel: path.price,
      prixConseille: p.suggestedPrice,
      sommeFormations: p.sumOfCoursePrices,
    });
  }

  console.log(APPLY_PRICE ? "=== CONTENU + PRIX APPLIQUÉS ===" : "=== CONTENU APPLIQUÉ (prix inchangés) ===");
  console.table(report);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error("❌", e.message); await prisma.$disconnect(); process.exit(1); });
