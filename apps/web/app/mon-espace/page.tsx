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
  ArrowUpRight,
  CalendarClock,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import {
  Container,
  Section,
  Badge,
  Avatar,
  IconBadge,
  GradientText,
  buttonClasses,
  cn,
  formatFCFA,
  formatDate,
} from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getClientDashboard } from "@/lib/portal-queries";
import { LogoutButton } from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: "Tableau de bord",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const statusLabels: Record<string, { label: string; variant: "info" | "success" | "warning" | "default" }> = {
  PENDING: { label: "En attente", variant: "warning" },
  IN_PROGRESS: { label: "En cours", variant: "info" },
  REVIEW: { label: "En révision", variant: "warning" },
  DELIVERED: { label: "Livré", variant: "success" },
  MAINTENANCE: { label: "Maintenance", variant: "success" },
  ARCHIVED: { label: "Archivé", variant: "default" },
};

const invoiceStatus: Record<string, { label: string; variant: "warning" | "success" | "default" }> = {
  SENT: { label: "À payer", variant: "warning" },
  OVERDUE: { label: "En retard", variant: "warning" },
  PAID: { label: "Payée", variant: "success" },
  DRAFT: { label: "Brouillon", variant: "default" },
  CANCELLED: { label: "Annulée", variant: "default" },
};

export default async function MonEspacePage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/mon-espace");

  const data = await getClientDashboard(user.id);
  const verified = Boolean(user.emailVerified);
  const firstName = (user.name ?? "").split(" ")[0] || "vous";
  const hasProjects = (data?.projects.length ?? 0) > 0;

  return (
    <Section spacing="md" className="min-h-[80vh] pt-28">
      <Container size="full">
        {/* En-tête */}
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar name={user.name ?? user.email ?? "Vous"} className="h-14 w-14 text-lg" />
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
                Bonjour <GradientText>{firstName}</GradientText>
              </h1>
              <p className="mt-0.5 text-sm text-text-secondary">
                Voici l'état de vos projets avec Digital Access.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/profil" className={buttonClasses({ variant: "ghost", size: "md" })}>
              Mon profil
            </Link>
            <LogoutButton variant="outline" size="md" />
          </div>
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
                  Vérifiez votre boîte de réception pour sécuriser votre compte.
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

        {/* Stats */}
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-xl border border-navy/[0.07] bg-surface-primary p-6">
            <div className="flex items-center justify-between">
              <IconBadge tone="gradient"><FolderKanban size={20} /></IconBadge>
              <span className="font-display text-3xl font-extrabold text-navy">
                {data?.stats.activeProjects ?? 0}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-text-secondary">Projets actifs</p>
          </div>
          <div className="rounded-xl border border-navy/[0.07] bg-surface-primary p-6">
            <div className="flex items-center justify-between">
              <IconBadge tone="soft"><FileText size={20} /></IconBadge>
              <span className="font-display text-2xl font-extrabold text-navy">
                {formatFCFA(data?.stats.unpaidTotal ?? 0)}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-text-secondary">Factures à régler</p>
          </div>
          <div className="rounded-xl border border-navy/[0.07] bg-surface-primary p-6">
            <div className="flex items-center justify-between">
              <IconBadge tone="soft"><LifeBuoy size={20} /></IconBadge>
              <span className="font-display text-3xl font-extrabold text-navy">
                {data?.stats.openTickets ?? 0}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-text-secondary">Tickets ouverts</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Projets */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-navy">Mes projets</h2>
              {hasProjects && (
                <Link href="/mes-projets" className="text-sm font-semibold text-brand-blue-royal hover:text-brand-violet">
                  Tout voir
                </Link>
              )}
            </div>

            {hasProjects ? (
              <div className="mt-4 grid grid-cols-1 gap-4">
                {data!.projects.slice(0, 3).map((p) => {
                  const st = statusLabels[p.status] ?? statusLabels.PENDING!;
                  return (
                    <Link
                      key={p.id}
                      href={`/mes-projets/${p.id}`}
                      className="group block rounded-xl border border-navy/[0.07] bg-surface-primary p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-base font-bold text-navy group-hover:text-brand-blue-royal">
                            {p.title}
                          </h3>
                          {p.currentStage && (
                            <p className="mt-0.5 text-sm text-text-secondary">
                              Étape en cours : {p.currentStage}
                            </p>
                          )}
                        </div>
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-text-secondary">
                            {p.completedStages}/{p.totalStages} étapes
                          </span>
                          <span className="font-bold text-navy">{p.progress}%</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy/[0.08]">
                          <div
                            className="h-full rounded-full bg-gradient-da"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-navy/15 bg-surface-secondary/50 p-10 text-center">
                <IconBadge tone="gradient" size="lg" className="mx-auto"><Sparkles size={24} /></IconBadge>
                <p className="mt-4 font-display text-lg font-bold text-navy">
                  Votre premier projet commence ici
                </p>
                <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">
                  Vous n'avez pas encore de projet en cours. Demandez un devis gratuit
                  et suivez son avancement en temps réel depuis cet espace.
                </p>
                <Link href="/devis" className={cn(buttonClasses({ variant: "primary", size: "md" }), "mt-6")}>
                  Demander un devis
                  <ArrowRight size={17} />
                </Link>
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Prochaine facture */}
            {data?.upcomingInvoice && (
              <div className="rounded-xl border border-navy/[0.07] bg-surface-primary p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-navy">
                  <CalendarClock size={16} className="text-brand-blue-royal" />
                  Prochaine échéance
                </div>
                <p className="mt-3 font-display text-2xl font-extrabold text-navy">
                  {formatFCFA(data.upcomingInvoice.total)}
                </p>
                <p className="text-sm text-text-secondary">
                  Facture {data.upcomingInvoice.number}
                  {data.upcomingInvoice.dueDate && ` · échéance ${formatDate(data.upcomingInvoice.dueDate)}`}
                </p>
                <Link
                  href={`/factures/${data.upcomingInvoice.id}`}
                  className={cn(buttonClasses({ variant: "outline", size: "sm" }), "mt-4 w-full")}
                >
                  Voir la facture
                </Link>
              </div>
            )}

            {/* Activité récente */}
            <div className="rounded-xl border border-navy/[0.07] bg-surface-primary p-5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-navy">
                <MessageSquare size={16} className="text-brand-blue-royal" />
                Activité récente
              </h3>
              {data && data.recentMessages.length > 0 ? (
                <ul className="mt-3 space-y-3">
                  {data.recentMessages.map((m) => (
                    <li key={m.id} className="text-sm">
                      <p className="line-clamp-2 text-text-secondary">
                        <span className="font-semibold text-navy">
                          {m.author.isTeam ? "Équipe DA" : "Vous"} :
                        </span>{" "}
                        {m.content}
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {m.projectTitle} · {formatDate(m.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-text-muted">Aucune activité pour le moment.</p>
              )}
            </div>

            {/* Liens rapides */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: FileText, label: "Factures", href: "/factures" },
                { icon: LifeBuoy, label: "Support", href: "/support" },
                { icon: FolderKanban, label: "Maintenance", href: "/maintenance" },
                { icon: GraduationCap, label: "Academy", href: "/academy" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between rounded-xl border border-navy/[0.07] bg-surface-primary p-4 text-sm font-semibold text-navy transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="flex items-center gap-2">
                    <l.icon size={17} className="text-brand-blue-royal" />
                    {l.label}
                  </span>
                  <ArrowUpRight size={15} className="text-text-muted" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
