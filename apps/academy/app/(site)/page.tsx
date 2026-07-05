import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Quote } from "lucide-react";
import {
  AnimatedCounter,
  Avatar,
  Badge,
  Card,
  Container,
  GradientText,
  IconBadge,
  Reveal,
  Section,
  SectionHeading,
  StaggerGroup,
  StaggerItem,
  StarRating,
  buttonClasses,
} from "@da/ui";
import { getCategories, getFeaturedCourses } from "@/lib/queries";
import { CourseCard } from "@/components/CourseCard";
import { Icon } from "@/components/Icon";
import { HeroAcademy } from "./HeroAcademy";
import { CtaAcademy } from "./CtaAcademy";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Accueil",
  description:
    "Access Academy — formations en ligne aux métiers du numérique en Côte d'Ivoire : développement web, design, marketing digital, bureautique. Certificats vérifiables, quiz interactifs et paiement Mobile Money.",
};

/* ──────────────────────────── Contenu statique ─────────────────────────────── */

const stats = [
  { value: 2500, suffix: "+", label: "Apprenants inscrits" },
  { value: 4, suffix: "+", label: "Cours complets — et ça continue" },
  { value: 98, suffix: " %", label: "d'apprenants satisfaits" },
  { value: 100, suffix: " %", label: "de certificats vérifiables" },
];

const steps = [
  {
    number: "01",
    title: "Créez votre compte",
    description:
      "Inscription gratuite en deux minutes, par email ou avec Google. Aucune carte bancaire demandée.",
  },
  {
    number: "02",
    title: "Choisissez un cours",
    description:
      "Parcourez le catalogue, comparez les avis des apprenants et lancez-vous — certains cours sont 100 % gratuits.",
  },
  {
    number: "03",
    title: "Apprenez à votre rythme",
    description:
      "Vidéos, leçons et quiz accessibles 24h/24, sur ordinateur comme sur mobile, même en 3G.",
  },
  {
    number: "04",
    title: "Obtenez votre certificat",
    description:
      "Validez les quiz, terminez les chapitres et téléchargez votre certificat vérifiable par QR code.",
  },
];

const advantages = [
  {
    icon: "smartphone",
    title: "À votre rythme, sur mobile",
    description:
      "Vos cours vous suivent partout : interface pensée mobile d'abord, optimisée pour les connexions 3G/4G.",
  },
  {
    icon: "brain",
    title: "Quiz interactifs",
    description:
      "Des QCM avec feedback immédiat et score en direct pour ancrer chaque notion, chapitre après chapitre.",
  },
  {
    icon: "award",
    title: "Certificats vérifiables",
    description:
      "Chaque certificat porte un QR code unique, vérifiable en ligne par les recruteurs et employeurs.",
  },
  {
    icon: "zap",
    title: "Paiement Mobile Money",
    description:
      "Payez en FCFA avec Orange Money, MTN MoMo ou Wave — sans carte bancaire, en quelques secondes.",
  },
];

const paymentPills = [
  "Orange Money",
  "MTN Mobile Money",
  "Wave",
  "Paiement 100 % FCFA",
];

const testimonials = [
  {
    name: "Aïcha Koné",
    role: "Community manager · Abidjan",
    course: "Marketing Digital",
    rating: 5,
    content:
      "J'ai suivi le cours de marketing digital entre deux missions. Les quiz m'ont obligée à vraiment retenir, et le certificat a fait la différence auprès de mon nouvel employeur.",
  },
  {
    name: "Jean-Marc Kouassi",
    role: "Étudiant en informatique · Yamoussoukro",
    course: "Développement Web",
    rating: 5,
    content:
      "Le cours de développement web est très concret : j'ai mis mon premier site en ligne avant même de finir le dernier module. Et j'ai tout payé avec Orange Money, sans carte bancaire.",
  },
  {
    name: "Mariam Traoré",
    role: "Assistante de direction · Bouaké",
    course: "Bureautique",
    rating: 4,
    content:
      "Je suivais les leçons le soir sur mon téléphone. Le format court des chapitres et le suivi de progression m'ont permis de tenir le rythme jusqu'au certificat.",
  },
];

/* ─────────────────────────────────── Page ──────────────────────────────────── */

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    getFeaturedCourses(4),
  ]);

  return (
    <>
      {/* 1 — Hero */}
      <HeroAcademy />

      {/* 2 — Bandeau stats */}
      <section className="relative overflow-hidden bg-surface-dark py-16">
        <div aria-hidden className="absolute inset-0 bg-gradient-da opacity-10" />
        <div aria-hidden className="absolute inset-0 bg-grid opacity-30" />
        <Container className="relative">
          <StaggerGroup className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <StaggerItem key={stat.label} className="text-center">
                <p className="font-display text-4xl font-extrabold sm:text-5xl">
                  <span className="text-gradient-da">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </span>
                </p>
                <p className="mt-2 text-sm font-medium text-white/60">
                  {stat.label}
                </p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </section>

      {/* 3 — Catégories */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Catégories"
            title={
              <>
                Explorez nos <GradientText>univers de formation</GradientText>
              </>
            }
            subtitle="Du code au marketing, chaque parcours est conçu pour vous mener d'un premier pas curieux à une compétence qui compte sur le marché."
          />
          <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((cat) => (
              <StaggerItem key={cat.id} className="h-full">
                <Link
                  href={`/courses?category=${cat.slug}`}
                  className="group block h-full"
                >
                  <Card interactive className="flex h-full flex-col">
                    <IconBadge tone="gradient">
                      <Icon name={cat.icon ?? "sparkles"} size={22} />
                    </IconBadge>
                    <h3 className="mt-4 font-display text-lg font-bold text-navy">
                      {cat.name}
                    </h3>
                    <p className="mt-1 text-sm text-text-secondary">
                      {cat.courseCount} cours{" "}
                      {cat.courseCount > 1 ? "disponibles" : "disponible"}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-brand-blue-royal">
                      Découvrir
                      <ArrowRight
                        size={15}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </span>
                  </Card>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* 4 — Cours populaires */}
      <Section>
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              align="left"
              eyebrow="Cours populaires"
              title={
                <>
                  Les formations <GradientText>préférées</GradientText> de nos
                  apprenants
                </>
              }
              className="max-w-xl"
            />
            <Reveal>
              <Link
                href="/courses"
                className={buttonClasses({ variant: "ghost", size: "md" })}
              >
                Tout le catalogue
                <ArrowRight size={17} />
              </Link>
            </Reveal>
          </div>
          <StaggerGroup className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {featured.map((course, i) => (
              <StaggerItem key={course.id} className="h-full">
                <CourseCard course={course} index={i} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* 5 — Comment ça marche */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Comment ça marche"
            title={
              <>
                Du premier clic au <GradientText>certificat</GradientText>
              </>
            }
            subtitle="Un parcours simple et motivant, pensé pour vous faire progresser sans pression."
          />
          <StaggerGroup className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {steps.map((step) => (
              <StaggerItem key={step.number} className="relative">
                <span className="font-display text-5xl font-extrabold text-gradient-da">
                  {step.number}
                </span>
                <h3 className="mt-3 font-display text-lg font-bold text-navy">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* 6 — Bandeau avantages */}
      <Section tone="dark" className="overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-dots opacity-20" />
        <div
          aria-hidden
          className="absolute -top-32 right-0 h-80 w-80 rounded-full bg-accent/20 blur-[120px]"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-brand-cyan/15 blur-[120px]"
        />
        <Container className="relative">
          <SectionHeading
            invert
            eyebrow="Pourquoi Academy"
            title={
              <>
                Une plateforme conçue pour apprendre{" "}
                <GradientText>ici, en Côte d'Ivoire</GradientText>
              </>
            }
            subtitle="Pas une plateforme importée : une expérience pensée pour nos réalités — mobile d'abord, FCFA, Mobile Money."
          />
          <StaggerGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {advantages.map((a) => (
              <StaggerItem
                key={a.title}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
              >
                <IconBadge tone="gradient">
                  <Icon name={a.icon} size={22} />
                </IconBadge>
                <h3 className="mt-4 font-display text-lg font-bold text-white">
                  {a.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  {a.description}
                </p>
              </StaggerItem>
            ))}
          </StaggerGroup>
          <Reveal delay={0.15} className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {paymentPills.map((p) => (
              <span
                key={p}
                className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-xs font-semibold text-white/80"
              >
                {p}
              </span>
            ))}
          </Reveal>
        </Container>
      </Section>

      {/* 7 — Témoignages */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Ils apprennent avec nous"
            title={
              <>
                Ce que disent <GradientText>nos apprenants</GradientText>
              </>
            }
            subtitle="Des parcours réels, des compétences qui changent des carrières."
          />
          <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <StaggerItem key={t.name} className="h-full">
                <Card interactive className="flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <Quote
                      size={32}
                      className="text-brand-blue-vif/25"
                      fill="currentColor"
                    />
                    <Badge variant="soft">{t.course}</Badge>
                  </div>
                  <StarRating rating={t.rating} className="mt-3" />
                  <p className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-navy/85">
                    «&nbsp;{t.content}&nbsp;»
                  </p>
                  <div className="mt-6 flex items-center gap-3 border-t border-navy/[0.06] pt-5">
                    <Avatar name={t.name} />
                    <div>
                      <p className="text-sm font-bold text-navy">{t.name}</p>
                      <p className="text-xs text-text-secondary">{t.role}</p>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* 8 — CTA final */}
      <CtaAcademy />
    </>
  );
}
