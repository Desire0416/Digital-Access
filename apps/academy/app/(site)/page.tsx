import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  Compass,
  Rocket,
  Target,
  FolderKanban,
  Award,
  Briefcase,
  BadgeCheck,
  Zap,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Section,
  Container,
  SectionHeading,
  GradientText,
  Reveal,
  StaggerGroup,
  StaggerItem,
  IconBadge,
  buttonClasses,
  cn,
} from "@da/ui";
import { getSchools, getCareerPaths, getShortCourses, getAcademyStats } from "@/lib/queries";
import { SchoolCardView } from "@/components/cards";
import { HomeSearch } from "@/components/HomeSearch";
import { PromoCarousel } from "@/components/PromoCarousel";
import { TrendingTabs, type TrendingTab } from "@/components/TrendingTabs";
import { HomeFaq, type HomeFaqItem } from "@/components/HomeFaq";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Apprenez un métier du numérique — Digital Access Academy",
  description:
    "Parcours métiers, projets concrets, portfolio, badges et certificats vérifiables. L'académie numérique qui transforme vos compétences en opportunités professionnelles en Côte d'Ivoire.",
  alternates: { canonical: "/" },
};

const method = [
  { icon: Compass, title: "Choisir un parcours métier", text: "Un objectif professionnel clair : Assistant IA, Développeur Front-End, Community Manager…" },
  { icon: Target, title: "Apprendre en pratiquant", text: "Des modules courts, des exercices et des quiz orientés savoir-faire, pas seulement des vidéos." },
  { icon: FolderKanban, title: "Réaliser des projets", text: "Des missions professionnelles concrètes qui alimentent votre portfolio et prouvent vos compétences." },
  { icon: Award, title: "Certifier & valoriser", text: "Badges par preuve, certificats vérifiables par QR code, et accès à des opportunités." },
];

const popularSearches = [
  "Intelligence artificielle",
  "Développement web",
  "Marketing digital",
  "Data",
  "Design",
  "Excel",
  "Canva",
  "Bureautique",
];

const faq: HomeFaqItem[] = [
  { q: "Les certificats sont-ils reconnus ?", a: "Chaque parcours délivre un certificat vérifiable publiquement par QR code, ainsi que des badges de compétences « par preuve » que vous pouvez partager à un employeur ou sur LinkedIn." },
  { q: "Faut-il payer pour se former ?", a: "De nombreuses formations courtes sont gratuites. Les parcours métiers complets ont un tarif clair et transparent, payable par Mobile Money (Orange, MTN, Wave), y compris en plusieurs fois." },
  { q: "Comment se déroule l'apprentissage ?", a: "Vous alternez modules courts, exercices et quiz, puis vous réalisez de vrais projets professionnels qui alimentent votre portfolio. On apprend en faisant, pas seulement en regardant des vidéos." },
  { q: "Ai-je besoin de prérequis ?", a: "La plupart des parcours démarrent au niveau débutant. Chaque fiche précise le niveau visé et les éventuels prérequis, pour que vous choisissiez en confiance." },
  { q: "Puis-je apprendre à mon rythme ?", a: "Oui. L'accès est flexible : vous avancez quand vous le souhaitez, sur mobile ou ordinateur, avec une expérience optimisée même en 3G/4G." },
  { q: "En quoi est-ce utile pour trouver un emploi ?", a: "Portfolio de projets, passeport de compétences, badges et certificats vérifiables : autant de preuves concrètes de votre savoir-faire, avec un accès à des opportunités et à la mise en relation avec des entreprises." },
];

export default async function HomePage() {
  const [schools, allPaths, shortCourses, stats] = await Promise.all([
    getSchools(),
    getCareerPaths(),
    getShortCourses(),
    getAcademyStats(),
  ]);

  const popularPaths = allPaths.slice(0, 6);
  const iaPaths = allPaths
    .filter((p) => /\bia\b|intelligence|\bdata\b|prompt|automat|analyt/i.test(`${p.title} ${p.targetJob} ${p.schoolName}`))
    .slice(0, 6);
  const featuredShort = shortCourses.slice(0, 8);

  const trendingTabs: TrendingTab[] = [
    { key: "populaires", label: "Les plus populaires", paths: popularPaths },
    ...(iaPaths.length >= 2 ? [{ key: "ia", label: "Compétences IA & Data", paths: iaPaths } satisfies TrendingTab] : []),
    ...(featuredShort.length ? [{ key: "courtes", label: "Formations rapides", shorts: featuredShort } satisfies TrendingTab] : []),
  ].filter((t) => (t.paths?.length ?? 0) + (t.shorts?.length ?? 0) > 0);

  const heroChips = schools.slice(0, 6);

  const statItems = [
    { value: stats.schools, label: "Écoles" },
    { value: stats.careerPaths, label: "Parcours métiers" },
    { value: stats.shortCourses, label: "Formations courtes" },
    { value: stats.projects, label: "Projets professionnels" },
  ].filter((s) => s.value > 0);

  return (
    <>
      {/* ── Hero recherche ── */}
      <section className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-gradient-da opacity-[0.1] blur-3xl" />
          <div className="absolute -left-40 top-40 h-[28rem] w-[28rem] rounded-full bg-brand-violet/10 blur-3xl" />
          <div className="absolute inset-0 bg-grid opacity-[0.5]" />
        </div>
        <Container className="relative pb-14 pt-12 text-center sm:pt-16">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue-vif/20 bg-brand-blue-vif/[0.06] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-blue-royal">
              <GraduationCap size={15} />
              Académie numérique · Côte d'Ivoire
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl font-extrabold leading-[1.07] tracking-tight text-navy sm:text-5xl lg:text-[3.4rem]">
              Apprenez un métier. Prouvez vos compétences.{" "}
              <GradientText>Décrochez l'emploi.</GradientText>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-text-secondary">
              Des parcours métiers concrets en IA, développement, marketing, design et data —
              avec de vrais projets, un portfolio, des badges et des certificats vérifiables.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex justify-center">
              <HomeSearch variant="hero" />
            </div>
          </Reveal>

          {heroChips.length > 0 && (
            <Reveal delay={0.2}>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="text-sm font-medium text-text-muted">Explorez :</span>
                {heroChips.map((s) => (
                  <Link
                    key={s.id}
                    href={`/schools/${s.slug}`}
                    className="rounded-full border border-navy/[0.1] bg-surface-primary px-3.5 py-1.5 text-sm font-medium text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </Reveal>
          )}

          {statItems.length > 0 && (
            <Reveal delay={0.25}>
              <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
                {statItems.map((s) => (
                  <div key={s.label}>
                    <dt className="font-display text-3xl font-extrabold text-navy">{s.value}</dt>
                    <dd className="mt-0.5 text-xs font-medium text-text-secondary">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          )}
        </Container>
      </section>

      {/* ── Carrousel promotionnel ── */}
      <Container className="pb-6">
        <PromoCarousel />
      </Container>

      {/* ── Nouveautés & populaires (onglets) ── */}
      {trendingTabs.length > 0 && (
        <Section>
          <Container>
            <SectionHeading
              eyebrow="Catalogue"
              title={<>Nouveautés &amp; <GradientText>populaires</GradientText></>}
              subtitle="Les parcours et formations les plus demandés du moment, prêts à booster votre carrière."
            />
            <div className="mt-10">
              <TrendingTabs tabs={trendingTabs} />
            </div>
            <div className="mt-10 text-center">
              <Link href="/career-paths" className={buttonClasses({ variant: "ghost", size: "md" })}>
                Voir tout le catalogue
                <ArrowRight size={16} />
              </Link>
            </div>
          </Container>
        </Section>
      )}

      {/* ── Écoles / domaines ── */}
      <Section tone="muted">
        <Container>
          <SectionHeading
            eyebrow="Nos écoles"
            title={<>Explorez par <GradientText>domaine de compétences</GradientText></>}
            subtitle="Chaque école regroupe des parcours métiers et des formations courtes autour d'un grand domaine du numérique."
          />
          {schools.length > 0 ? (
            <StaggerGroup className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {schools.map((s) => (
                <StaggerItem key={s.id}>
                  <SchoolCardView school={s} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          ) : (
            <p className="mt-12 text-center text-text-muted">Les écoles arrivent très bientôt.</p>
          )}
        </Container>
      </Section>

      {/* ── Résultats / employabilité (3 cartes, façon « Launch a career ») ── */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Pourquoi l'académie"
            title={<>Transformez vos compétences en <GradientText>opportunités</GradientText></>}
            subtitle="Nous ne délivrons pas que des cours : nous produisons des preuves de savoir-faire qui ouvrent des portes."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { icon: FolderKanban, title: "Un portfolio de projets", text: "Chaque projet validé enrichit votre portfolio professionnel — votre meilleure preuve de savoir-faire auprès d'un recruteur." },
              { icon: BadgeCheck, title: "Badges & certificats vérifiables", text: "Des badges par preuve et des certificats à QR code, vérifiables publiquement par n'importe quel employeur." },
              { icon: Briefcase, title: "Un pont vers l'emploi", text: "Passeport de compétences, opportunités, missions freelance et mise en relation avec les entreprises qui recrutent." },
            ].map((c) => (
              <Reveal key={c.title} className="group rounded-2xl border border-navy/[0.07] bg-surface-secondary/40 p-7 transition-all hover:-translate-y-1 hover:border-brand-blue-vif/30 hover:shadow-xl">
                <IconBadge tone="gradient">
                  <c.icon size={22} />
                </IconBadge>
                <h3 className="mt-4 font-display text-lg font-bold text-navy">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{c.text}</p>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Recherches populaires ── */}
      <Section tone="muted" spacing="sm">
        <Container>
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-text-muted">
            <TrendingUp size={16} className="text-brand-blue-royal" />
            Recherches populaires
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {popularSearches.map((tag) => (
              <Link
                key={tag}
                href={`/career-paths?search=${encodeURIComponent(tag)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-navy/[0.1] bg-surface-primary px-4 py-2 text-sm font-medium text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal"
              >
                <Sparkles size={14} className="text-brand-blue-vif" />
                {tag}
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* ── Méthode ── */}
      <Section>
        <Container>
          <SectionHeading
            eyebrow="Notre méthode"
            title={<>Apprendre <GradientText>en faisant</GradientText></>}
            subtitle="Pas de compétence sans pratique. Pas de certification sans projet. Pas d'employabilité sans preuve."
          />
          <StaggerGroup className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {method.map((m, i) => (
              <StaggerItem
                key={m.title}
                className="relative rounded-2xl border border-navy/[0.07] bg-surface-primary p-6"
              >
                <span className="absolute right-5 top-5 font-display text-4xl font-extrabold text-navy/[0.06]">
                  0{i + 1}
                </span>
                <IconBadge tone="gradient">
                  <m.icon size={22} />
                </IconBadge>
                <h3 className="mt-4 font-display text-lg font-bold text-navy">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{m.text}</p>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </Container>
      </Section>

      {/* ── FAQ ── */}
      <Section tone="muted">
        <Container size="lg">
          <SectionHeading
            eyebrow="Questions fréquentes"
            title={<>Tout ce qu'il faut savoir <GradientText>avant de commencer</GradientText></>}
            subtitle="Une question ? Voici les réponses les plus demandées sur l'académie."
          />
          <div className="mt-12">
            <HomeFaq items={faq} />
          </div>
        </Container>
      </Section>

      {/* ── CTA ── */}
      <Section>
        <Container size="lg">
          <div className="relative overflow-hidden rounded-3xl bg-navy px-7 py-14 text-center sm:px-12">
            <div aria-hidden className="absolute inset-0 overflow-hidden">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-da opacity-30 blur-3xl" />
              <div className="absolute inset-0 bg-grid opacity-[0.08]" />
            </div>
            <div className="relative">
              <Rocket size={34} className="mx-auto text-brand-cyan" />
              <h2 className="mt-5 font-display text-3xl font-extrabold text-white sm:text-4xl">
                Prêt à construire des compétences <GradientText>visibles et utiles</GradientText> ?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-white/70">
                Créez votre compte gratuitement, choisissez votre parcours et commencez à produire dès aujourd'hui.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/auth/register" className={cn(buttonClasses({ variant: "primary", size: "lg" }))}>
                  Créer un compte gratuit
                  <ArrowRight size={18} />
                </Link>
                <Link href="/career-paths" className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/20 px-6 text-[0.95rem] font-semibold text-white transition-colors hover:bg-white/10">
                  <Zap size={17} /> Explorer les parcours
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
