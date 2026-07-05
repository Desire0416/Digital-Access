import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LifeBuoy,
  MessageCircleQuestion,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Container, Section, IconBadge } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import {
  getClientTickets,
  getClientProjectOptions,
} from "@/lib/portal-queries";
import { PageHero } from "@/components/PageHero";
import { NewTicketDialog } from "./NewTicketDialog";
import { TicketList } from "./TicketList";

export const metadata: Metadata = {
  title: "Support",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/support");

  const [tickets, projectOptions] = await Promise.all([
    getClientTickets(user.id),
    getClientProjectOptions(user.id),
  ]);

  const hasTickets = tickets.length > 0;

  return (
    <>
      <PageHero
        eyebrow="Espace client"
        title={
          <>
            Centre de <span className="text-gradient-da">support</span>
          </>
        }
        description="Une question, un imprévu, une amélioration à demander ? Ouvrez un ticket et suivez nos échanges au même endroit."
      >
        <NewTicketDialog projects={projectOptions} />
      </PageHero>

      <Section spacing="md" className="pt-0">
        <Container>
          {hasTickets ? (
            <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
              {/* Liste des tickets */}
              <div>
                <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-navy">
                  <LifeBuoy size={18} className="text-brand-blue-royal" />
                  Mes tickets
                  <span className="text-sm font-medium text-text-muted">
                    ({tickets.length})
                  </span>
                </h2>
                <TicketList tickets={tickets} />
              </div>

              {/* Encart d'aide */}
              <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
                <div className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary">
                  <div className="relative bg-grid px-5 py-5">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-da" />
                    <div className="flex items-start gap-3">
                      <IconBadge tone="gradient" size="sm">
                        <MessageCircleQuestion size={18} />
                      </IconBadge>
                      <div>
                        <h3 className="font-display text-base font-bold text-navy">
                          Besoin d'aide&nbsp;?
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                          Ouvrez un ticket dédié pour chaque demande. Vous
                          recevrez nos réponses directement dans le fil.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <NewTicketDialog
                        projects={projectOptions}
                        variant="outline"
                        label="Nouveau ticket"
                      />
                    </div>
                  </div>
                  <ul className="divide-y divide-navy/[0.06] px-5 py-2 text-sm">
                    <li className="flex items-center gap-3 py-3">
                      <Clock size={16} className="shrink-0 text-brand-blue-vif" />
                      <span className="text-text-secondary">
                        Réponse sous <span className="font-semibold text-navy">24&nbsp;h ouvrées</span>.
                      </span>
                    </li>
                    <li className="flex items-center gap-3 py-3">
                      <ShieldCheck size={16} className="shrink-0 text-brand-blue-vif" />
                      <span className="text-text-secondary">
                        Suivi centralisé et historique conservé.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-dashed border-navy/15 bg-surface-secondary/50 p-5 text-sm">
                  <p className="font-semibold text-navy">Urgence critique ?</p>
                  <p className="mt-1 text-text-secondary">
                    Ouvrez un ticket en priorité <span className="font-semibold text-error">Urgente</span> ou
                    contactez-nous directement.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
                  >
                    Nous contacter
                  </Link>
                </div>
              </aside>
            </div>
          ) : (
            <EmptyState projects={projectOptions} />
          )}
        </Container>
      </Section>
    </>
  );
}

function EmptyState({
  projects,
}: {
  projects: { id: string; title: string }[];
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-navy/[0.08] bg-surface-primary">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-da" />
      <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
        <div>
          <IconBadge tone="gradient" size="lg">
            <LifeBuoy size={26} />
          </IconBadge>
          <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-navy">
            Aucun ticket pour le moment
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
            Vous n'avez ouvert aucune demande de support. Dès que vous avez une
            question sur un projet, un bug à signaler ou une évolution à
            demander, ouvrez un ticket : notre équipe vous répond et vous suivez
            l'échange ici.
          </p>
          <div className="mt-7">
            <NewTicketDialog projects={projects} label="Ouvrir mon premier ticket" />
          </div>
        </div>

        {/* Aperçu illustré des étapes */}
        <ul className="space-y-3">
          {[
            {
              n: "1",
              title: "Décrivez votre demande",
              text: "Sujet, description et priorité en quelques secondes.",
            },
            {
              n: "2",
              title: "L'équipe DA prend le relais",
              text: "Nous vous répondons dans le fil de discussion du ticket.",
            },
            {
              n: "3",
              title: "Suivez jusqu'à résolution",
              text: "Échangez, joignez du contexte, marquez comme résolu.",
            },
          ].map((s) => (
            <li
              key={s.n}
              className="flex items-start gap-4 rounded-2xl border border-navy/[0.07] bg-surface-secondary/40 p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-da font-display text-sm font-extrabold text-white shadow-brand">
                {s.n}
              </span>
              <div>
                <p className="font-display text-sm font-bold text-navy">{s.title}</p>
                <p className="mt-0.5 text-sm text-text-secondary">{s.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
