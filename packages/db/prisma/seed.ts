import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { portfolio as realPortfolio } from "../src/mock";

const prisma = new PrismaClient();

/* ══════════════════════════════════════════════════════════════════════════
   Seed Digital Access Academy (refonte 2026) + amorçage web préservé.
   Contenu académique riche généré et stocké dans seed-academy.json.
   Idempotent : upsert par slug ; les blocs web sont protégés par des gardes.
   ══════════════════════════════════════════════════════════════════════════ */

type AnyRec = Record<string, unknown>;
interface SeedData {
  schools: AnyRec[];
  skills: AnyRec[];
  shortCourses: AnyRec[];
  badges: AnyRec[];
  companies: AnyRec[];
  opportunities: AnyRec[];
  careerPaths: AnyRec[];
}
const data = JSON.parse(
  readFileSync(fileURLToPath(new URL("./seed-academy.json", import.meta.url)), "utf8"),
) as SeedData;

const norm = (s: string) => s.trim().toLowerCase();

async function main() {
  console.log("🌱 Seed Digital Access Academy…");
  const passwordHash = await bcrypt.hash("DigitalAccess2026!", 12);

  /* ─────────────────────────── Utilisateurs ─────────────────────────── */
  const admin = await prisma.user.upsert({
    where: { email: "admin@digitalaccess.ci" },
    update: { roles: ["ADMIN", "SUPER_ADMIN"] },
    create: {
      name: "Administrateur DA", email: "admin@digitalaccess.ci", password: passwordHash,
      roles: ["ADMIN", "SUPER_ADMIN"], emailVerified: new Date(), isActive: true,
    },
  });
  const instructor = await prisma.user.upsert({
    where: { email: "koffi@digitalaccess.ci" },
    update: { roles: ["INSTRUCTOR", "LEARNER"] },
    create: {
      name: "Koffi N'Guessan", email: "koffi@digitalaccess.ci", password: passwordHash,
      roles: ["INSTRUCTOR", "LEARNER"], emailVerified: new Date(), isActive: true,
      bio: "Formateur fullstack, 8 ans d'expérience. Passionné par la transmission et les projets concrets.",
    },
  });
  await prisma.user.upsert({
    where: { email: "mentor@digitalaccess.ci" },
    update: { roles: ["MENTOR", "LEARNER"] },
    create: {
      name: "Awa Diomandé", email: "mentor@digitalaccess.ci", password: passwordHash,
      roles: ["MENTOR", "LEARNER"], emailVerified: new Date(), isActive: true,
      bio: "Mentore carrière — accompagnement portfolio, entretiens et insertion professionnelle.",
    },
  });
  const demoLearners: string[] = [];
  for (const l of [
    { email: "apprenant@digitalaccess.ci", name: "Aya Apprenante", streak: 4, xp: 120 },
    { email: "yann@digitalaccess.ci", name: "Yann Kouassi", streak: 2, xp: 60 },
    { email: "mariam@digitalaccess.ci", name: "Mariam Cissé", streak: 7, xp: 240 },
  ]) {
    const u = await prisma.user.upsert({
      where: { email: l.email },
      update: {},
      create: {
        name: l.name, email: l.email, password: passwordHash, roles: ["LEARNER"],
        emailVerified: new Date(), isActive: true, streak: l.streak, xp: l.xp,
        lastActiveAt: new Date(),
      },
    });
    demoLearners.push(u.id);
    await prisma.learnerProfile.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id, headline: "Apprenant Digital Access Academy", careerGoal: "Devenir un professionnel du numérique", city: "Abidjan", country: "Côte d'Ivoire" },
    });
  }
  const demoLearner = demoLearners[0];

  /* ─────────────────────── Écoles + compétences ─────────────────────── */
  const schoolIdBySlug: Record<string, string> = {};
  for (let i = 0; i < data.schools.length; i++) {
    const s = data.schools[i] as AnyRec;
    const row = await prisma.school.upsert({
      where: { slug: s.slug as string },
      update: {
        name: s.name as string, shortDescription: s.shortDescription as string,
        longDescription: (s.longDescription as string) ?? null, icon: (s.icon as string) ?? null,
        color: (s.color as string) ?? null, order: i, status: "PUBLISHED",
      },
      create: {
        name: s.name as string, slug: s.slug as string, shortDescription: s.shortDescription as string,
        longDescription: (s.longDescription as string) ?? null, icon: (s.icon as string) ?? null,
        color: (s.color as string) ?? null, order: i, status: "PUBLISHED",
      },
    });
    schoolIdBySlug[s.slug as string] = row.id;
  }

  const skillIdByName: Record<string, string> = {};
  for (const sk of data.skills) {
    const row = await prisma.skill.upsert({
      where: { slug: sk.slug as string },
      update: {},
      create: {
        name: sk.name as string, slug: sk.slug as string, description: (sk.description as string) ?? null,
        category: (sk.category as string) as never, level: (sk.level as string) as never,
        schoolId: schoolIdBySlug[sk.schoolSlug as string] ?? null,
      },
    });
    skillIdByName[norm(sk.name as string)] = row.id;
  }

  /* ─────────────────────────── Parcours métiers ─────────────────────── */
  for (const p of data.careerPaths) {
    if (!p || !p.slug) continue;
    const schoolId = schoolIdBySlug[p.schoolSlug as string];
    if (!schoolId) continue;
    const existing = await prisma.careerPath.findUnique({ where: { slug: p.slug as string }, select: { id: true } });
    const scalars = {
      title: p.title as string, shortDescription: p.shortDescription as string,
      longDescription: (p.longDescription as string) ?? null, targetJob: p.targetJob as string,
      level: (p.level as string) as never, duration: (p.duration as string) ?? null,
      estimatedHours: (p.estimatedHours as number) ?? null, price: (p.price as number) ?? 0,
      prerequisites: (p.prerequisites as string[]) ?? [], objectives: (p.objectives as string[]) ?? [],
      outcomes: (p.outcomes as string[]) ?? [], tools: (p.tools as string[]) ?? [],
      certificateTitle: (p.certificateTitle as string) ?? null, featured: true, status: "PUBLISHED" as const,
    };
    let pathId: string;
    let refreshCurriculum: boolean;
    if (existing) {
      await prisma.careerPath.update({ where: { id: existing.id }, data: scalars });
      pathId = existing.id;
      // Le curriculum n'est reconstruit QUE si aucun apprenant n'a de progression
      // sur ce parcours — sinon deleteMany effacerait LessonProgress/QuizAttempt par
      // cascade (données réelles). Forçable en dev via SEED_REFRESH_CURRICULUM=1.
      const learnerProgress = await prisma.lessonProgress.count({
        where: { lesson: { module: { careerPathId: existing.id } } },
      });
      refreshCurriculum = process.env.SEED_REFRESH_CURRICULUM === "1" || learnerProgress === 0;
      if (refreshCurriculum) await prisma.module.deleteMany({ where: { careerPathId: existing.id } });
    } else {
      const created = await prisma.careerPath.create({
        data: { ...scalars, slug: p.slug as string, schoolId },
      });
      pathId = created.id;
      refreshCurriculum = true;
    }
    // Compétences (join) — idempotent
    for (const name of (p.skillNames as string[]) ?? []) {
      const skillId = skillIdByName[norm(name)];
      if (skillId) {
        await prisma.careerPathSkill.upsert({
          where: { careerPathId_skillId: { careerPathId: pathId, skillId } },
          update: {}, create: { careerPathId: pathId, skillId },
        });
      }
    }
    // Modules + leçons (+ quiz éventuel), (re)créés uniquement si le curriculum doit être rafraîchi
    if (refreshCurriculum) {
      let mOrder = 0;
      for (const m of (p.modules as AnyRec[]) ?? []) {
        const mod = await prisma.module.create({
          data: {
            careerPathId: pathId, title: m.title as string, description: (m.description as string) ?? null,
            order: mOrder++, objectives: (m.objectives as string[]) ?? [], status: "PUBLISHED",
          },
        });
        let lOrder = 0;
        for (const l of (m.lessons as AnyRec[]) ?? []) {
          const lesson = await prisma.lesson.create({
            data: {
              moduleId: mod.id, title: l.title as string, slug: `${pathId.slice(0, 6)}-${mOrder}-${lOrder}`,
              content: (l.content as string) ?? (l.summary as string) ?? null,
              videoUrl: (l.videoUrl as string) ?? null,
              lessonType: (l.lessonType as string) as never,
              estimatedDuration: (l.estimatedDuration as number) ?? null, order: lOrder++,
              // Un seul aperçu gratuit par parcours : la 1re leçon du 1er module.
              isPreview: mOrder === 1 && lOrder === 1, status: "PUBLISHED",
            },
          });
          // Quiz rattaché à la leçon (si fourni par le contenu généré)
          const quiz = l.quiz as AnyRec | undefined;
          if (quiz && Array.isArray(quiz.questions) && quiz.questions.length) {
            const createdQuiz = await prisma.quiz.create({
              data: {
                lessonId: lesson.id, title: (quiz.title as string) ?? `Quiz — ${l.title as string}`,
                passingScore: (quiz.passingScore as number) ?? 70, status: "PUBLISHED",
              },
            });
            let qOrder = 0;
            for (const q of quiz.questions as AnyRec[]) {
              await prisma.quizQuestion.create({
                data: {
                  quizId: createdQuiz.id, question: q.question as string,
                  type: (q.type as string) as never,
                  options: (q.options as never) ?? undefined,
                  correctAnswer: (q.correctAnswer as never) ?? 0,
                  explanation: (q.explanation as string) ?? null,
                  points: (q.points as number) ?? 1, order: qOrder++,
                },
              });
            }
          }
        }
      }
    }
    // Projets + grilles — uniquement à la création initiale (évite les doublons au re-seed)
    if (!existing) {
      for (const pr of (p.projects as AnyRec[]) ?? []) {
        const criteria = ((pr.rubricCriteria as AnyRec[]) ?? []).map((c) => ({ label: c.label, points: c.points }));
        const rubric = await prisma.rubric.create({
          data: { title: `Grille — ${pr.title as string}`, totalPoints: 100, passingScore: 70, criteria },
        });
        await prisma.professionalProject.create({
          data: {
            schoolId, careerPathId: pathId, title: pr.title as string,
            slug: `${p.slug as string}-${norm(pr.title as string).replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`,
            projectType: (pr.projectType as string) as never, level: (pr.level as string) as never,
            context: (pr.context as string) ?? null, problem: (pr.problem as string) ?? null,
            mission: (pr.mission as string) ?? null, objectives: (pr.objectives as string[]) ?? [],
            deliverables: (pr.deliverables as string[]) ?? [], constraints: (pr.constraints as string[]) ?? [],
            estimatedDuration: (pr.estimatedHours as number) ?? null, rubricId: rubric.id,
            requiresSubmission: true, requiresDefense: (pr.projectType as string) === "FINAL_PROJECT",
            isPortfolioEligible: true, status: "PUBLISHED",
          },
        });
      }
    }
  }

  /* ─────────────────────────── Formations courtes ───────────────────── */
  for (const c of data.shortCourses) {
    const schoolId = schoolIdBySlug[c.schoolSlug as string];
    if (!schoolId) continue;
    await prisma.shortCourse.upsert({
      where: { slug: c.slug as string },
      update: {},
      create: {
        schoolId, title: c.title as string, slug: c.slug as string,
        shortDescription: c.shortDescription as string, longDescription: (c.longDescription as string) ?? null,
        level: (c.level as string) as never, duration: (c.duration as string) ?? null,
        price: (c.price as number) ?? 0, courseType: (c.courseType as string) ?? null,
        objectives: (c.objectives as string[]) ?? [], prerequisites: (c.prerequisites as string[]) ?? [],
        featured: (c.price as number) === 0, status: "PUBLISHED",
      },
    });
  }

  /* ─────────────────────────────── Badges ───────────────────────────── */
  for (const b of data.badges) {
    await prisma.badge.upsert({
      where: { slug: b.slug as string },
      update: {},
      create: {
        name: b.name as string, slug: b.slug as string, description: b.description as string,
        category: (b.category as string) as never, level: (b.level as string) as never,
        icon: (b.icon as string) ?? null, criteria: (b.criteria as string) ?? null,
        skillId: b.skillName ? skillIdByName[norm(b.skillName as string)] ?? null : null,
        status: "PUBLISHED",
      },
    });
  }

  /* ─────────────────────── Entreprises + opportunités ────────────────── */
  const companyIdBySlug: Record<string, string> = {};
  for (const co of data.companies) {
    const row = await prisma.company.upsert({
      where: { slug: co.slug as string },
      update: {},
      create: {
        name: co.name as string, slug: co.slug as string, description: (co.description as string) ?? null,
        sector: (co.sector as string) ?? null, website: (co.website as string) ?? null,
        location: (co.location as string) ?? null, verification: (co.verification as string) as never,
        status: "ACTIVE",
      },
    });
    companyIdBySlug[co.slug as string] = row.id;
  }
  for (const op of data.opportunities) {
    const companyId = companyIdBySlug[op.companySlug as string];
    if (!companyId) continue;
    const exists = await prisma.opportunity.findFirst({ where: { companyId, title: op.title as string }, select: { id: true } });
    if (exists) continue;
    await prisma.opportunity.create({
      data: {
        companyId, title: op.title as string, type: (op.type as string) as never,
        description: op.description as string, requiredSkills: (op.requiredSkills as string[]) ?? [],
        location: (op.location as string) ?? null, remote: (op.remote as boolean) ?? false,
        compensation: (op.compensation as string) ?? null, status: "PUBLISHED",
      },
    });
  }

  /* ─────────────── Apprenant démo : inscriptions, badge, certificat ─── */
  const frontPath = await prisma.careerPath.findUnique({ where: { slug: "developpeur-web-front-end" }, select: { id: true, certificateTitle: true } });
  const iaPath = await prisma.careerPath.findUnique({ where: { slug: "assistant-ia-professionnel" }, select: { id: true, title: true } });
  if (frontPath) {
    await prisma.enrollment.upsert({
      where: { id: `seed-enr-front-${demoLearner}` },
      update: {},
      create: { id: `seed-enr-front-${demoLearner}`, learnerId: demoLearner, careerPathId: frontPath.id, status: "ACTIVE", accessType: "FREE", progress: 45 },
    });
  }
  if (iaPath) {
    await prisma.enrollment.upsert({
      where: { id: `seed-enr-ia-${demoLearner}` },
      update: {},
      create: { id: `seed-enr-ia-${demoLearner}`, learnerId: demoLearner, careerPathId: iaPath.id, status: "COMPLETED", accessType: "FREE", progress: 100, completedAt: new Date() },
    });
    await prisma.certificate.upsert({
      where: { certificateNumber: "DA-CERT-DEMO001" },
      update: {},
      create: {
        learnerId: demoLearner, certificateType: "CAREER_PATH", title: iaPath.title,
        careerPathId: iaPath.id, mention: "VERY_GOOD", finalScore: 88,
        certificateNumber: "DA-CERT-DEMO001", verificationUrl: "https://academy.digitalaccess.ci/verify/DA-CERT-DEMO001",
        skillsValidated: ["Prompt Engineering", "Automatisation IA"], status: "ACTIVE",
      },
    });
  }
  const firstBadge = await prisma.badge.findFirst({ select: { id: true } });
  if (firstBadge) {
    await prisma.learnerBadge.upsert({
      where: { learnerId_badgeId: { learnerId: demoLearner, badgeId: firstBadge.id } },
      update: {}, create: { learnerId: demoLearner, badgeId: firstBadge.id, status: "ACTIVE" },
    });
  }

  // Progression réelle de l'apprenant démo (LessonProgress) alignée sur le % d'inscription,
  // + une vidéo de démonstration sur la 1re leçon (placeholder — à remplacer par la vraie vidéo).
  const seedProgress = async (pathSlug: string, ratio: number, enrollmentId: string) => {
    const path = await prisma.careerPath.findUnique({ where: { slug: pathSlug }, select: { id: true } });
    if (!path) return;
    const modules = await prisma.module.findMany({
      where: { careerPathId: path.id },
      orderBy: { order: "asc" },
      select: { lessons: { orderBy: { order: "asc" }, select: { id: true } } },
    });
    const ids = modules.flatMap((m) => m.lessons.map((l) => l.id));
    if (!ids.length) return;
    if (ids[0]) {
      await prisma.lesson.update({ where: { id: ids[0] }, data: { videoUrl: "https://www.youtube.com/watch?v=qz0aGYrrlhU" } });
    }
    const n = Math.round(ids.length * ratio);
    for (const lessonId of ids.slice(0, n)) {
      await prisma.lessonProgress.upsert({
        where: { learnerId_lessonId: { learnerId: demoLearner, lessonId } },
        update: {}, create: { learnerId: demoLearner, lessonId, enrollmentId },
      });
    }
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { progress: Math.round((n / ids.length) * 100) },
    });
  };
  await seedProgress("developpeur-web-front-end", 0.45, `seed-enr-front-${demoLearner}`);
  await seedProgress("assistant-ia-professionnel", 1, `seed-enr-ia-${demoLearner}`);

  /* ─────────────────── Web : témoignages, blog, leads ────────────────── */
  if ((await prisma.testimonial.count()) === 0) {
    await prisma.testimonial.createMany({
      data: [
        { name: "Aïcha Koné", role: "Directrice", company: "Boutique Élégance", content: "Digital Access a transformé notre présence en ligne.", rating: 5, featured: true },
        { name: "Dr. Mamadou Traoré", role: "Fondateur", company: "Clinique La Providence", content: "Un travail sérieux et un vrai sens du détail.", rating: 5, featured: true },
      ],
    });
  }
  await prisma.blogPost.upsert({
    where: { slug: "pourquoi-site-web-2026" }, update: {},
    create: {
      title: "Pourquoi votre entreprise a besoin d'un site web en 2026", slug: "pourquoi-site-web-2026",
      excerpt: "Une présence en ligne n'est plus un luxe mais une nécessité.", content: "# Introduction\nÀ l'ère du digital…",
      category: "Stratégie digitale", status: "PUBLISHED", authorId: admin.id, publishedAt: new Date(),
    },
  });
  if ((await prisma.lead.count()) === 0) {
    await prisma.lead.createMany({
      data: [
        { name: "Konan Yao", email: "konan.yao@lebaoule.ci", phone: "+225 07 11 22 33 44", company: "Restaurant Le Baoulé", projectType: "SITE_VITRINE", budget: "500 000 – 800 000 FCFA", timeline: "1 mois", message: "Site vitrine avec menu et réservation.", status: "NEW", source: "devis", assigneeId: admin.id },
        { name: "Mariam Bamba", email: "mariam@waxandco.ci", phone: "+225 01 23 45 67 89", company: "Boutique Wax & Co", projectType: "SITE_VITRINE", budget: "800 000 – 1 200 000 FCFA", timeline: "6 semaines", message: "Boutique en ligne avec paiement Mobile Money.", status: "CONTACTED", source: "devis", assigneeId: admin.id },
      ],
    });
  }

  /* ── Web : réalisations (source unique = mock portfolio) ── */
  await prisma.portfolioProject.deleteMany({ where: { slug: { in: ["boutique-elegance", "mtn-ci-refonte", "ecole-numerique-lms"] } } });
  for (const p of realPortfolio) {
    const d = { title: p.title, slug: p.slug, description: p.description, client: p.client, type: p.type, category: p.category, year: p.year, url: p.url ?? null, coverImage: p.coverImage ?? null, images: p.images, technologies: p.technologies, featured: p.featured };
    await prisma.portfolioProject.upsert({ where: { slug: p.slug }, update: d, create: d });
  }

  const [schoolsN, pathsN, coursesN, projectsN, badgesN] = await Promise.all([
    prisma.school.count(), prisma.careerPath.count(), prisma.shortCourse.count(),
    prisma.professionalProject.count(), prisma.badge.count(),
  ]);
  console.log(`✅ Seed OK — ${schoolsN} écoles · ${pathsN} parcours · ${coursesN} formations · ${projectsN} projets · ${badgesN} badges`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
