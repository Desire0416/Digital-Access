import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Home,
  ChevronRight,
  Sparkles,
  Target,
  FolderKanban,
  Award,
  Briefcase,
  Link2,
  ExternalLink,
  Wrench,
  ShieldCheck,
  Code2,
  Contact,
  Globe,
} from "lucide-react";
import { Container, Avatar, StaggerGroup, StaggerItem, Reveal } from "@da/ui";
import { getPublicPortfolio } from "@/lib/portfolio-queries";
import { siteConfig } from "@/lib/site";
import { Markdown } from "@/components/Markdown";

/* ══════════════════════════════════════════════════════════════════════════
   Portfolio public (§16.7 / §19.5) — « pas d'employabilité sans preuve ».
   Page destinée au partage : présentation, compétences, projets validés,
   certificats vérifiables, expériences & réalisations, outils. Indexable.
   ══════════════════════════════════════════════════════════════════════════ */

const CERT_TYPE_LABEL: Record<string, string> = {
  COURSE: "Formation",
  CAREER_PATH: "Parcours métier",
  PROGRAM: "Programme",
};

function asLinks(value: unknown): { github?: string; linkedin?: string; website?: string } {
  if (!value || typeof value !== "object") return {};
  const v = value as Record<string, unknown>;
  const pick = (k: string) => (typeof v[k] === "string" && v[k] ? (v[k] as string) : undefined);
  return { github: pick("github"), linkedin: pick("linkedin"), website: pick("website") };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublicPortfolio(slug);
  if (!p) return { title: "Portfolio introuvable", robots: { index: false, follow: false } };
  const title = `${p.owner.name} — Portfolio`;
  const description =
    p.owner.headline ?? (p.about ? p.about.replace(/[#*_>`\-]/g, "").slice(0, 160) : `Portfolio de ${p.owner.name} sur ${siteConfig.name}.`);
  const url = `${siteConfig.url}/portfolio/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      ...(p.owner.avatar ? { images: [{ url: p.owner.avatar }] } : {}),
    },
  };
}

/* ─── En-tête de section ───────────────────────────────────────────────────── */
function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-5 flex items-center gap-2.5 font-display text-xl font-bold tracking-tight text-navy sm:text-2xl">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-da text-white shadow-brand" aria-hidden>
          <Icon size={18} />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function PublicPortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublicPortfolio(slug);
  if (!p) notFound();

  const links = asLinks(p.links);
  const hasLinks = !!(links.github || links.linkedin || links.website);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.owner.name,
    ...(p.owner.headline ? { jobTitle: p.owner.headline } : {}),
    ...(p.owner.avatar ? { image: p.owner.avatar } : {}),
    url: `${siteConfig.url}/portfolio/${slug}`,
    knowsAbout: p.skills,
    sameAs: [links.github, links.linkedin, links.website].filter(Boolean),
  };

  return (
    <div className="pb-24">
      <script
        type="application/ld+json"
        // Échappe < > & pour empêcher une évasion de balise </script> via le nom /
        // headline (texte libre utilisateur) → pas de XSS stocké sur page publique.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026"),
        }}
      />

      {/* ══════════════ En-tête navy ══════════════ */}
      <section className="relative overflow-hidden bg-navy text-white">
        <span className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-violet/30 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-brand-cyan/20 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.15]" aria-hidden />
        <Container className="relative py-10 sm:py-14">
          <nav aria-label="Fil d'Ariane" className="mb-8 flex items-center gap-1.5 text-xs text-white/60">
            <Link href="/" className="inline-flex items-center gap-1 transition-colors hover:text-white">
              <Home size={13} aria-hidden />
              Accueil
            </Link>
            <ChevronRight size={13} aria-hidden />
            <span className="truncate text-white/80">Portfolio</span>
          </nav>

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <Avatar
              name={p.owner.name}
              src={p.owner.avatar ?? undefined}
              className="h-24 w-24 shrink-0 ring-4 ring-white/10 sm:h-28 sm:w-28"
            />
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
                <ShieldCheck size={12} className="text-brand-cyan" aria-hidden />
                Portfolio vérifié · {siteConfig.name}
              </span>
              <h1 className="mt-3 font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
                {p.owner.name}
              </h1>
              {p.owner.headline && (
                <p className="mt-3 max-w-2xl text-base font-medium text-white/75 sm:text-lg">{p.owner.headline}</p>
              )}

              {hasLinks && (
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {links.github && (
                    <a
                      href={links.github}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/85 transition-colors hover:border-white/30 hover:text-white"
                    >
                      <Code2 size={13} aria-hidden />
                      GitHub
                    </a>
                  )}
                  {links.linkedin && (
                    <a
                      href={links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/85 transition-colors hover:border-white/30 hover:text-white"
                    >
                      <Contact size={13} aria-hidden />
                      LinkedIn
                    </a>
                  )}
                  {links.website && (
                    <a
                      href={links.website}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/85 transition-colors hover:border-white/30 hover:text-white"
                    >
                      <Globe size={13} aria-hidden />
                      Site web
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ══════════════ Corps ══════════════ */}
      <Container className="space-y-14 py-12 sm:py-16">
        {/* À propos */}
        {p.about && (
          <Block icon={Sparkles} title="À propos">
            <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6 sm:p-7">
              <Markdown className="prose-sm sm:prose-base">{p.about}</Markdown>
            </div>
          </Block>
        )}

        {/* Compétences */}
        {p.skills.length > 0 && (
          <Block icon={Target} title="Compétences">
            <div className="flex flex-wrap gap-2">
              {p.skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-full border border-navy/10 bg-surface-primary px-3.5 py-1.5 text-xs font-semibold text-navy"
                >
                  {s}
                </span>
              ))}
            </div>
          </Block>
        )}

        {/* Projets */}
        {p.projects.length > 0 && (
          <Block icon={FolderKanban} title="Projets réalisés">
            <StaggerGroup className="grid gap-5 sm:grid-cols-2">
              {p.projects.map((proj) => (
                <StaggerItem key={proj.id}>
                  <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary">
                    {proj.image ? (
                      <div className="aspect-[16/9] overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={proj.image}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      </div>
                    ) : (
                      <div
                        className="relative aspect-[16/9]"
                        style={{ background: "linear-gradient(125deg,#5b3fa8,#2b5cc6 45%,#1e8fe1 72%,#00bcd4)" }}
                        aria-hidden
                      >
                        <span className="absolute inset-0 bg-grid opacity-30" />
                        <FolderKanban size={30} className="absolute bottom-4 right-4 text-white/40" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-base font-bold leading-snug text-navy">{proj.title}</h3>
                      {proj.description && (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-secondary">{proj.description}</p>
                      )}
                      {proj.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {proj.skills.slice(0, 5).map((s) => (
                            <span key={s} className="rounded-full bg-navy/[0.05] px-2 py-0.5 text-[11px] font-medium text-navy/75">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {proj.url && (
                        <a
                          href={proj.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
                        >
                          <ExternalLink size={14} aria-hidden />
                          Voir le projet
                        </a>
                      )}
                    </div>
                  </article>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </Block>
        )}

        {/* Certificats */}
        {p.certificates.length > 0 && (
          <Block icon={Award} title="Certificats">
            <StaggerGroup className="grid gap-5 sm:grid-cols-2">
              {p.certificates.map((cert) => (
                <StaggerItem key={cert.verifyCode}>
                  <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-brand-violet/20 bg-surface-primary">
                    <span className="h-1 w-full bg-gradient-da" aria-hidden />
                    <span className="pointer-events-none absolute -right-10 -top-6 h-32 w-32 rounded-full bg-gradient-da opacity-[0.07] blur-2xl" aria-hidden />
                    <div className="relative flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-violet/15 to-brand-cyan/15 text-brand-violet"
                          aria-hidden
                        >
                          <Award size={22} />
                        </span>
                        <span className="rounded-full bg-navy/[0.05] px-2.5 py-1 text-[11px] font-semibold text-navy/70">
                          {CERT_TYPE_LABEL[cert.type] ?? cert.type}
                        </span>
                      </div>
                      <h3 className="mt-3.5 font-display text-base font-bold leading-snug text-navy">{cert.title}</h3>
                      <p className="mt-1 font-mono text-xs font-semibold text-text-secondary">{cert.number}</p>
                      <Link
                        href={`/certificats/verifier?code=${cert.verifyCode}`}
                        className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
                      >
                        <ShieldCheck size={15} aria-hidden />
                        Vérifier ce certificat
                      </Link>
                    </div>
                  </article>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </Block>
        )}

        {/* Expériences & réalisations */}
        {p.experiences.length > 0 && (
          <Block icon={Briefcase} title="Expériences & réalisations">
            <div className="space-y-4">
              {p.experiences.map((item) => (
                <Reveal key={item.id}>
                  <div className="flex gap-4 rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy/[0.04] text-brand-blue-royal"
                      aria-hidden
                    >
                      {item.type === "LINK" ? <Link2 size={20} /> : <Briefcase size={20} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-base font-bold text-navy">{item.title}</h3>
                      {item.description && (
                        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">{item.description}</p>
                      )}
                      {item.skills.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {item.skills.map((s) => (
                            <span key={s} className="rounded-full bg-navy/[0.05] px-2 py-0.5 text-[11px] font-medium text-navy/75">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
                        >
                          <ExternalLink size={14} aria-hidden />
                          Ouvrir le lien
                        </a>
                      )}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Block>
        )}

        {/* Outils */}
        {p.tools.length > 0 && (
          <Block icon={Wrench} title="Outils & technologies">
            <div className="flex flex-wrap gap-2">
              {p.tools.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full bg-navy/[0.04] px-3.5 py-1.5 text-xs font-semibold text-navy/80"
                >
                  {t}
                </span>
              ))}
            </div>
          </Block>
        )}

        {/* État vide global (portfolio public mais sans contenu) */}
        {!p.about &&
          p.skills.length === 0 &&
          p.projects.length === 0 &&
          p.certificates.length === 0 &&
          p.experiences.length === 0 &&
          p.tools.length === 0 && (
            <div className="rounded-2xl border border-dashed border-navy/[0.12] bg-surface-secondary/50 px-6 py-14 text-center">
              <FolderKanban size={40} className="mx-auto text-brand-violet/30" aria-hidden />
              <h3 className="mt-4 font-display text-lg font-bold text-navy">Portfolio en construction</h3>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-text-secondary">
                {p.owner.name} n&apos;a pas encore publié de réalisation.
              </p>
            </div>
          )}
      </Container>
    </div>
  );
}
