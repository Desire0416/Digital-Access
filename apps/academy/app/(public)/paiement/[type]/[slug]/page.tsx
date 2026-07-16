import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import {
  GraduationCap,
  Route,
  UsersRound,
  BadgeCheck,
  Clock,
  ShieldCheck,
  MailWarning,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Container } from "@da/ui";
import { requireUser } from "@/lib/guards";
import { getCheckoutInfo } from "@/lib/payments";
import { formatFCFA, LEVEL_LABEL } from "@/lib/site";
import { CheckoutTunnel } from "@/components/payment/CheckoutTunnel";

export const metadata: Metadata = {
  title: "Paiement Mobile Money",
  robots: { index: false, follow: false },
};

type CheckoutKind = "formation" | "parcours" | "cohorte";

const TYPE_LABEL: Record<CheckoutKind, string> = {
  formation: "Formation",
  parcours: "Parcours métier",
  cohorte: "Cohorte",
};

export default async function PaiementPage({
  params,
}: {
  params: Promise<{ type: string; slug: string }>;
}) {
  const { type, slug } = await params;
  if (type !== "formation" && type !== "parcours" && type !== "cohorte") notFound();
  const kind = type as CheckoutKind;

  const callbackUrl = `/paiement/${kind}/${slug}`;
  const user = await requireUser(callbackUrl);

  const info = await getCheckoutInfo(kind, slug);
  if (!info.ok) notFound();
  const data = info.data;

  // Déjà acquis → l'apprenant a déjà l'accès : on l'y renvoie.
  if (data.alreadyAcquired) {
    redirect(kind === "formation" ? "/espace/formations" : kind === "cohorte" ? "/espace/cohortes" : "/espace/parcours");
  }

  const levelLabel = data.level ? LEVEL_LABEL[data.level] ?? data.level : null;

  /* ─── En-tête récapitulatif (commun à tous les états) ───────────────────── */
  const recap = (
    <div className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary shadow-sm">
      <div className="relative aspect-[16/6] w-full">
        {data.coverImage ? (
          <Image src={data.coverImage} alt="" fill sizes="(max-width:768px) 100vw, 420px" className="object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-da" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />
        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-navy backdrop-blur-sm">
          {kind === "formation" ? <GraduationCap size={14} /> : kind === "cohorte" ? <UsersRound size={14} /> : <Route size={14} />}
          {TYPE_LABEL[kind]}
        </span>
      </div>
      <div className="p-5">
        <h1 className="font-display text-xl font-bold leading-tight text-navy">{data.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-secondary">
          {data.schoolName && (
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck size={15} className="text-brand-blue-vif" />
              {data.schoolName}
            </span>
          )}
          {levelLabel && (
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={15} className="text-accent" />
              {levelLabel}
            </span>
          )}
        </div>

        {/* Détail du prix — reconnaissance des acquis pour les parcours (§27.4) */}
        <div className="mt-5 rounded-xl bg-surface-secondary/70 p-4">
          {data.pricing && data.pricing.deduction > 0 ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-text-secondary">
                <span>Prix du parcours</span>
                <span className="line-through">{formatFCFA(data.pricing.fullPrice)}</span>
              </div>
              <div className="space-y-1 border-l-2 border-success/40 pl-3">
                <p className="text-xs font-semibold text-success">Formations déjà acquises déduites</p>
                {data.pricing.acquiredCourses.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs text-text-secondary">
                    <span className="truncate pr-2">{c.title}</span>
                    <span className="shrink-0 font-medium text-success">− {formatFCFA(c.price)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-navy/10 pt-2.5">
                <span className="font-semibold text-navy">À payer</span>
                <span className="bg-gradient-da bg-clip-text font-display text-2xl font-extrabold text-transparent">
                  {formatFCFA(data.amount)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-navy">Montant à régler</span>
              <span className="bg-gradient-da bg-clip-text font-display text-2xl font-extrabold text-transparent">
                {formatFCFA(data.amount)}
              </span>
            </div>
          )}
          <p className="mt-2.5 text-[11px] leading-snug text-text-muted">
            Un éventuel code promo se saisit à l&apos;étape de paiement ; le montant final est alors recalculé dans le tunnel.
          </p>
        </div>

        <ul className="mt-4 space-y-2 text-xs text-text-secondary">
          <li className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-success" />
            Accès à vie, sans frais récurrents.
          </li>
          <li className="flex items-center gap-2">
            <Clock size={14} className="text-brand-blue-vif" />
            Validation manuelle sous 24 h ouvrées.
          </li>
        </ul>
      </div>
    </div>
  );

  /* ─── Contenu de droite selon l'état ────────────────────────────────────── */
  let panel: React.ReactNode;

  if (!user.emailVerified) {
    // Email non confirmé : blocage amont (le serveur refuse aussi le dépôt).
    panel = (
      <div className="rounded-2xl border border-warning/30 bg-warning/[0.06] p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-warning/15 text-warning">
          <MailWarning size={28} />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-navy">Confirmez votre adresse email</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
          Pour des raisons de sécurité, un paiement ne peut être déposé qu'avec un compte vérifié. Consultez votre boîte
          mail (<span className="font-semibold text-navy">{user.email}</span>) puis revenez sur cette page.
        </p>
        <Link
          href="/verification-email"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-gradient-da px-6 text-[0.95rem] font-medium text-white shadow-brand transition-all hover:-translate-y-0.5"
        >
          Renvoyer le lien de confirmation
        </Link>
      </div>
    );
  } else if (data.amount <= 0) {
    // Parcours entièrement couvert par les acquis : inscription directe, sans paiement.
    panel = (
      <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-8 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-da text-white shadow-brand">
          <Sparkles size={28} />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-navy">C'est gratuit pour vous !</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
          {kind === "cohorte"
            ? "Cette cohorte est gratuite : lancez votre inscription directement depuis le bouton « Rejoindre » de la fiche."
            : "Vous possédez déjà toutes les formations facturables de ce parcours. Aucun paiement n'est nécessaire : lancez votre inscription directement depuis la fiche du parcours."}
        </p>
        <Link
          href={kind === "cohorte" ? "/espace/cohortes" : kind === "formation" ? `/formations/${slug}` : `/parcours-metiers/${slug}`}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-da px-6 text-[0.95rem] font-medium text-white shadow-brand transition-all hover:-translate-y-0.5"
        >
          {kind === "cohorte" ? "Voir mes cohortes" : "Aller à la fiche"}
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  } else if (data.pendingPayment) {
    // Une preuve est déjà en cours de vérification.
    panel = (
      <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-8 text-center shadow-sm">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-blue-vif/12 text-brand-blue-royal">
          <Clock size={28} />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-navy">Paiement en cours de vérification</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
          Nous avons déjà reçu une preuve de paiement pour cet achat. Notre équipe la vérifie sous 24 h ouvrées. Votre
          accès s'ouvrira automatiquement dès la validation — inutile de payer à nouveau.
        </p>
        <Link
          href={kind === "cohorte" ? "/espace/cohortes" : "/espace/formations"}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-gradient-da px-6 text-[0.95rem] font-medium text-white shadow-brand transition-all hover:-translate-y-0.5"
        >
          Suivre dans mon espace
        </Link>
      </div>
    );
  } else {
    panel = (
      <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-6 shadow-sm sm:p-8">
        <CheckoutTunnel type={kind} slug={slug} amount={data.amount} title={data.title} />
      </div>
    );
  }

  return (
    <div className="bg-surface-secondary/40 py-10 sm:py-14">
      <Container>
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold text-brand-blue-royal">Finaliser votre achat</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            Paiement sécurisé Mobile Money
          </h1>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
            <div className="lg:sticky lg:top-24 lg:self-start">{recap}</div>
            <div>{panel}</div>
          </div>
        </div>
      </Container>
    </div>
  );
}
