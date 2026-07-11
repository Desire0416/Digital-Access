import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, GraduationCap, ShieldCheck, BadgeCheck, Clock3, PlayCircle } from "lucide-react";
import { Container, Badge, formatFCFA } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getCheckoutInfo, getFormationPaymentState } from "@/lib/payment-queries";
import { paymentConfig } from "@/lib/site";
import { LEVEL_LABEL } from "@/lib/types";
import { CheckoutForm } from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const info = await getCheckoutInfo(slug);
  return {
    title: info ? `Paiement — ${info.title} — Digital Access Academy` : "Paiement",
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const user = await currentUser();
  if (!user) redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/checkout/${slug}`)}`);

  const info = await getCheckoutInfo(slug);
  if (!info) notFound();

  const state = await getFormationPaymentState(slug, user.id);
  // Déjà inscrit → inutile de payer : on renvoie vers la formation (CTA « Continuer »).
  if (state.enrolled) redirect(`/career-paths/${slug}`);

  return (
    <div className="bg-surface-secondary/40">
      {/* En-tête */}
      <section className="border-b border-navy/[0.07] bg-white">
        <Container className="py-8">
          <Link href={`/career-paths/${slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-navy">
            <ArrowLeft size={16} /> Retour à la formation
          </Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="soft">{info.school}</Badge>
                <span className="rounded-full bg-navy/[0.06] px-3 py-1 text-xs font-semibold text-text-secondary">{LEVEL_LABEL[info.level as keyof typeof LEVEL_LABEL] ?? info.level}</span>
              </div>
              <h1 className="mt-3 font-display text-2xl font-extrabold text-navy sm:text-3xl">{info.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-text-secondary">
                <span className="inline-flex items-center gap-1.5"><GraduationCap size={15} />{info.targetJob}</span>
                {info.duration && <span className="inline-flex items-center gap-1.5"><Clock size={15} />{info.duration}</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Montant</p>
              <p className="font-display text-3xl font-extrabold text-navy">{formatFCFA(info.price)}</p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="grid gap-8 py-10 lg:grid-cols-[1fr_320px]">
        {/* Colonne principale */}
        <div className="min-w-0 order-2 lg:order-1">
          {state.pending ? (
            <div className="rounded-3xl border border-warning/30 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-warning/12 text-warning">
                <Clock3 size={32} />
              </div>
              <h2 className="mt-5 font-display text-2xl font-extrabold text-navy">Paiement en cours de validation</h2>
              <p className="mx-auto mt-3 max-w-md text-[0.95rem] leading-relaxed text-text-secondary">
                Vous avez déjà soumis une preuve de paiement pour cette formation. Notre équipe la vérifie {paymentConfig.reviewDelay}.
                Vous recevrez une notification dès l'ouverture de votre accès.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link href="/dashboard/mes-cours" className="inline-flex h-12 items-center gap-2 rounded-lg bg-gradient-da px-6 text-[0.95rem] font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5">
                  Mon tableau de bord
                </Link>
                <Link href={`/career-paths/${slug}`} className="inline-flex h-12 items-center gap-2 rounded-lg border border-navy/15 px-6 text-[0.95rem] font-semibold text-navy transition-colors hover:bg-navy/[0.04]">
                  <PlayCircle size={17} /> Revoir la formation
                </Link>
              </div>
            </div>
          ) : (
            <CheckoutForm
              slug={slug}
              title={info.title}
              price={info.price}
              operators={paymentConfig.operators as unknown as { id: string; name: string; number: string; color: string; instructions: string }[]}
              holderName={paymentConfig.holderName}
              reviewDelay={paymentConfig.reviewDelay}
            />
          )}
        </div>

        {/* Récapitulatif / réassurance */}
        <aside className="order-1 lg:order-2">
          <div className="sticky top-24 flex flex-col gap-4">
            <div className="rounded-2xl border border-navy/[0.08] bg-white p-6 shadow-sm">
              <h3 className="font-display text-base font-bold text-navy">Récapitulatif</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-text-secondary">Formation</dt>
                  <dd className="text-right font-semibold text-navy">{info.title}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-secondary">Niveau</dt>
                  <dd className="font-semibold text-navy">{LEVEL_LABEL[info.level as keyof typeof LEVEL_LABEL] ?? info.level}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-navy/[0.07] pt-3">
                  <dt className="font-semibold text-navy">Total à payer</dt>
                  <dd className="font-display text-lg font-extrabold text-navy">{formatFCFA(info.price)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-brand-violet/20 bg-brand-violet/[0.04] p-6">
              <ul className="space-y-3 text-sm text-navy/80">
                <li className="flex items-start gap-2.5"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-brand-violet" /> Paiement vérifié manuellement par notre équipe.</li>
                <li className="flex items-start gap-2.5"><BadgeCheck size={17} className="mt-0.5 shrink-0 text-brand-violet" /> Accès à vie + certificat vérifiable à la clé.</li>
                <li className="flex items-start gap-2.5"><Clock3 size={17} className="mt-0.5 shrink-0 text-brand-violet" /> Activation {paymentConfig.reviewDelay} après validation.</li>
              </ul>
            </div>
          </div>
        </aside>
      </Container>
    </div>
  );
}
