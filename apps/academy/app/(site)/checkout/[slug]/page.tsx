import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Clock3, BookOpen, ShieldCheck, BadgeCheck, Hourglass } from "lucide-react";
import {
  Container,
  Badge,
  GradientText,
  Monogram,
  buttonClasses,
  formatFCFA,
  formatDuration,
} from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getCheckoutData } from "@/lib/payment-queries";
import { paymentConfig } from "@/lib/site";
import { CheckoutForm } from "./CheckoutForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paiement Mobile Money",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await currentUser();
  if (!user) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/checkout/${slug}`)}`);
  }
  // Cahier AC04 : pas d'achat sans email vérifié.
  if (!user.emailVerified) {
    redirect(`/auth/verify-email?email=${encodeURIComponent(user.email ?? "")}`);
  }

  const data = await getCheckoutData(user.id, slug);
  if (!data) notFound();
  if (data.enrolled) redirect(`/courses/${slug}`);

  const { course } = data;

  return (
    <section className="relative isolate overflow-hidden pb-20 pt-24">
      {/* Décor */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-brand-violet/12 blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-brand-cyan/12 blur-[120px]" />
      </div>

      <Container size="lg">
        {/* En-tête */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue-vif/20 bg-brand-blue-vif/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-blue-royal">
            <ShieldCheck size={14} />
            Paiement sécurisé · vérification humaine
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            Finalisez votre achat par <GradientText>Mobile Money</GradientText>
          </h1>
          <p className="mt-3 text-text-secondary">
            Envoyez le montant exact depuis votre téléphone, puis transmettez la
            preuve ci-dessous. Notre équipe vérifie et ouvre votre accès{" "}
            {paymentConfig.reviewDelay}.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          {/* Colonne principale : paiement en attente OU formulaire */}
          <div className="min-w-0">
            {data.pendingReference ? (
              <div className="rounded-2xl border border-warning/30 bg-warning/[0.06] p-8 text-center sm:p-10">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-warning/15 text-[#B45309]">
                  <Hourglass size={28} />
                </span>
                <h2 className="mt-5 font-display text-xl font-bold text-navy">
                  Votre paiement est en cours de vérification
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
                  Référence <span className="font-mono font-bold text-navy">{data.pendingReference}</span>.
                  Notre équipe compare votre preuve avec nos relevés Mobile Money —
                  vous recevrez un email dès l'ouverture de votre accès (
                  {paymentConfig.reviewDelay}).
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link href="/dashboard" className={buttonClasses({ variant: "primary", size: "md" })}>
                    Aller à mon dashboard
                  </Link>
                  <Link href={`/courses/${slug}`} className={buttonClasses({ variant: "outline", size: "md" })}>
                    Revoir le cours
                  </Link>
                </div>
              </div>
            ) : (
              <CheckoutForm
                courseSlug={course.slug}
                amountLabel={formatFCFA(course.price)}
                lastRejection={data.lastRejection}
              />
            )}
          </div>

          {/* Récapitulatif de commande (sticky) */}
          <aside className="min-w-0 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary">
              <div className="relative flex aspect-[16/7] items-center justify-center bg-gradient-da">
                <div className="absolute inset-0 bg-dots opacity-25" />
                <Monogram variant="white" size={72} className="opacity-90" />
              </div>
              <div className="p-6">
                <Badge variant="soft">{course.category}</Badge>
                <h2 className="mt-3 font-display text-lg font-bold leading-snug text-navy">
                  {course.title}
                </h2>
                {course.subtitle && (
                  <p className="mt-1 text-sm text-text-secondary">{course.subtitle}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <BookOpen size={13} /> {course.chapterCount} chapitres
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock3 size={13} /> {formatDuration(course.durationMinutes)}
                  </span>
                  <span className="flex items-center gap-1">
                    <BadgeCheck size={13} /> Certificat inclus
                  </span>
                </div>

                <div className="mt-5 space-y-2 border-t border-navy/[0.07] pt-5 text-sm">
                  <div className="flex items-center justify-between text-text-secondary">
                    <span>Formateur</span>
                    <span className="font-medium text-navy">{course.instructor}</span>
                  </div>
                  <div className="flex items-center justify-between text-text-secondary">
                    <span>Accès</span>
                    <span className="font-medium text-navy">À vie</span>
                  </div>
                </div>

                <div className="mt-5 flex items-end justify-between border-t border-navy/[0.07] pt-5">
                  <span className="text-sm font-medium text-text-secondary">
                    Total à payer
                  </span>
                  <span className="font-display text-2xl font-extrabold">
                    <GradientText>{formatFCFA(course.price)}</GradientText>
                  </span>
                </div>
              </div>
            </div>

            <p className="mt-4 flex items-start gap-2 px-1 text-xs leading-relaxed text-text-muted">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-success" />
              Chaque preuve est vérifiée manuellement par notre équipe avant
              l'ouverture de l'accès. Aucune donnée bancaire ne transite par la
              plateforme.
            </p>
          </aside>
        </div>
      </Container>
    </section>
  );
}
