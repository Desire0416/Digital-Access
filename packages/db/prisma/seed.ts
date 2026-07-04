import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Seed de démonstration : super admin, instructeur, catégories, un cours
 * complet (modules + chapitres + quiz), témoignages, portfolio, blog.
 * Idempotent grâce aux upsert par clé unique.
 */
async function main() {
  console.log("🌱 Seed Digital Access…");

  const passwordHash = await bcrypt.hash("DigitalAccess2026!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@digitalaccess.ci" },
    update: {},
    create: {
      name: "Administrateur DA",
      email: "admin@digitalaccess.ci",
      password: passwordHash,
      roles: ["ADMIN", "SUPER_ADMIN"],
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const instructor = await prisma.user.upsert({
    where: { email: "koffi@digitalaccess.ci" },
    update: {},
    create: {
      name: "Koffi N'Guessan",
      email: "koffi@digitalaccess.ci",
      password: passwordHash,
      roles: ["INSTRUCTOR", "LEARNER"],
      bio: "Développeur web fullstack, formateur passionné.",
      emailVerified: new Date(),
      isActive: true,
    },
  });

  const webCat = await prisma.category.upsert({
    where: { slug: "developpement-web" },
    update: {},
    create: {
      name: "Développement Web",
      slug: "developpement-web",
      icon: "code",
      color: "#2B5CC6",
      description: "Créez des sites et applications web modernes.",
    },
  });

  await prisma.category.upsert({
    where: { slug: "design-ux-ui" },
    update: {},
    create: { name: "Design & UX/UI", slug: "design-ux-ui", icon: "palette", color: "#7C3AED" },
  });
  await prisma.category.upsert({
    where: { slug: "marketing-digital" },
    update: {},
    create: { name: "Marketing Digital", slug: "marketing-digital", icon: "megaphone", color: "#00BCD4" },
  });

  const course = await prisma.course.upsert({
    where: { slug: "site-web-nextjs" },
    update: {},
    create: {
      title: "Créer un site web moderne avec Next.js",
      slug: "site-web-nextjs",
      subtitle: "De zéro à la mise en ligne, sans prérequis",
      description:
        "Apprenez à construire un site web professionnel et rapide avec Next.js, de la conception au déploiement sur Vercel.",
      price: 45000,
      isFree: false,
      level: "BEGINNER",
      status: "PUBLISHED",
      rating: 4.9,
      ratingCount: 132,
      enrollmentCount: 540,
      durationMinutes: 720,
      objectives: [
        "Maîtriser les fondamentaux de Next.js",
        "Créer des interfaces avec Tailwind CSS",
        "Déployer un site en production",
      ],
      publishedAt: new Date(),
      instructorId: instructor.id,
      categoryId: webCat.id,
      modules: {
        create: [
          {
            title: "Introduction",
            position: 1,
            chapters: {
              create: [
                { title: "Bienvenue dans le cours", type: "VIDEO", position: 1, isPreview: true, videoDuration: 300 },
                { title: "Installer l'environnement", type: "TEXT", position: 2, content: "## Installation\nInstallez Node.js…" },
              ],
            },
          },
          {
            title: "Les bases de Next.js",
            position: 2,
            chapters: {
              create: [
                { title: "Le routage App Router", type: "VIDEO", position: 1, videoDuration: 600 },
                {
                  title: "Quiz — Les fondamentaux",
                  type: "QUIZ",
                  position: 2,
                  quiz: {
                    create: {
                      passingScore: 70,
                      questions: {
                        create: [
                          {
                            question: "Quel dossier contient les routes dans l'App Router ?",
                            options: ["pages/", "app/", "routes/", "src/"],
                            correctAnswers: [1],
                            explanation: "L'App Router utilise le dossier app/.",
                            position: 1,
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.chatRoom.upsert({
    where: { courseId: course.id },
    update: {},
    create: { courseId: course.id },
  });

  const testimonials = [
    { name: "Aïcha Koné", role: "Directrice", company: "Boutique Élégance", content: "Digital Access a transformé notre présence en ligne.", rating: 5, featured: true },
    { name: "Dr. Mamadou Traoré", role: "Fondateur", company: "Clinique La Providence", content: "Un travail sérieux et un vrai sens du détail.", rating: 5, featured: true },
  ];
  for (const t of testimonials) {
    await prisma.testimonial.create({ data: t }).catch(() => {});
  }

  await prisma.portfolioProject.upsert({
    where: { slug: "boutique-elegance" },
    update: {},
    create: {
      title: "Boutique Élégance — E-commerce mode",
      slug: "boutique-elegance",
      description: "Refonte complète et boutique en ligne.",
      client: "Boutique Élégance Abidjan",
      type: "Site E-commerce",
      technologies: ["Next.js", "Tailwind CSS", "CinetPay"],
      featured: true,
    },
  });

  await prisma.blogPost.upsert({
    where: { slug: "pourquoi-site-web-2026" },
    update: {},
    create: {
      title: "Pourquoi votre entreprise a besoin d'un site web en 2026",
      slug: "pourquoi-site-web-2026",
      excerpt: "Une présence en ligne n'est plus un luxe mais une nécessité.",
      content: "# Introduction\nÀ l'ère du digital…",
      category: "Stratégie digitale",
      status: "PUBLISHED",
      authorId: admin.id,
      publishedAt: new Date(),
    },
  });

  console.log("✅ Seed terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
