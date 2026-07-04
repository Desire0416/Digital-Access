import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FolderKanban,
  FileText,
  LifeBuoy,
  GraduationCap,
  MailWarning,
  ArrowRight,
} from "lucide-react";
import {
  Container,
  Section,
  Badge,
  Avatar,
  IconBadge,
  GradientText,
  buttonClasses,
} from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { LogoutButton } from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "Mon espace",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = {
  CLIENT: "Client",
  LEARNER: "Apprenant",
  INSTRUCTOR: "Instructeur",
  ADMIN: "Administrateur",
  SUPER_ADMIN: "Super admin",
};

const modules = [
  { icon: FolderKanban, title: "Mes projets", desc: "Suivi, timeline et livrables", soon: true },
  { icon: FileText, title: "Factures", desc: "Historique et téléchargement PDF", soon: true },
  { icon: LifeBuoy, title: "Support", desc: "Vos tickets d'assistance", soon: true },
  { icon: GraduationCap, title: "Academy", desc: "Vos formations en ligne", href: "/academy", soon: false },
];

export default async function MonEspacePage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login");

  const verified = Boolean(user.emailVerified);
  const firstName = (user.name ?? "").split(" ")[0] || "vous";

  return (
    <Section spacing="md" className="min-h-[70vh] pt-28">
      <Container>
        {/* En-tête */}
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar name={user.name ?? user.email ?? "Vous"} className="h-14 w-14 text-lg" />
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
                Bonjour <GradientText>{firstName}</GradientText>
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {user.roles.length > 0 ? (
                  user.roles.map((r) => (
                    <Badge key={r} variant="soft">
                      {roleLabels[r] ?? r}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="soft">Membre</Badge>
                )}
              </div>
            </div>
          </div>
          <LogoutButton variant="outline" size="md" />
        </div>

        {/* Bannière de vérification */}
        {!verified && (
          <div className="mt-8 flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <IconBadge tone="soft" size="sm" className="bg-warning/15 text-[#B45309]">
                <MailWarning size={18} />
              </IconBadge>
              <div>
                <p className="font-semibold text-navy">Confirmez votre adresse email</p>
                <p className="text-sm text-text-secondary">
                  Vérifiez votre boîte de réception pour débloquer toutes les
                  fonctionnalités de votre espace.
                </p>
              </div>
            </div>
            <Link
              href={`/auth/verify-email?email=${encodeURIComponent(user.email ?? "")}`}
              className={buttonClasses({ variant: "outline", size: "sm" })}
            >
              Renvoyer l'email
            </Link>
          </div>
        )}

        {/* Modules */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => {
            const inner = (
              <>
                <div className="flex items-center justify-between">
                  <IconBadge tone={m.soon ? "soft" : "gradient"}>
                    <m.icon size={22} />
                  </IconBadge>
                  {m.soon && <Badge>Bientôt</Badge>}
                </div>
                <h2 className="mt-4 font-display text-lg font-bold text-navy">{m.title}</h2>
                <p className="mt-1 text-sm text-text-secondary">{m.desc}</p>
                {!m.soon && (
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal">
                    Ouvrir <ArrowRight size={15} />
                  </span>
                )}
              </>
            );
            return m.href ? (
              <Link
                key={m.title}
                href={m.href}
                className="rounded-xl border border-navy/[0.07] bg-surface-primary p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={m.title}
                className="rounded-xl border border-navy/[0.07] bg-surface-secondary/50 p-6 opacity-90"
              >
                {inner}
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-sm text-text-muted">
          Votre espace client complet (projets, factures, maintenance, support)
          arrive dans les prochains sprints. Merci de votre confiance.
        </p>
      </Container>
    </Section>
  );
}
