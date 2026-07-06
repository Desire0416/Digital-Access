import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock, MessagesSquare } from "lucide-react";
import {
  Badge,
  Container,
  Monogram,
  buttonClasses,
  cn,
} from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getChatInitial } from "@/lib/community-queries";
import { ChatRoom } from "./ChatRoom";

export const dynamic = "force-dynamic";

/* ─────────────────────────────── Metadata ──────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const user = await currentUser();
  const data = await getChatInitial(slug, user?.id ?? null);
  if (!data) return { title: "Discussion introuvable" };
  return {
    title: `Discussion — ${data.access.courseTitle}`,
    description: `Échangez en direct avec les apprenants et le formateur du cours « ${data.access.courseTitle} » sur Access Academy.`,
  };
}

/* ──────────────────────────────── Page ─────────────────────────────────── */

export default async function CourseChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await currentUser();
  const data = await getChatInitial(slug, user?.id ?? null);
  if (!data) notFound();

  const { access, messages, presence } = data;

  return (
    <section className="relative isolate flex min-h-[calc(100dvh-4.5rem)] flex-col overflow-hidden bg-surface-dark">
      {/* Halos décoratifs de fond (identité DA). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute inset-0 bg-grid opacity-[0.25]" />
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute -bottom-32 right-[-6%] h-80 w-80 rounded-full bg-brand-cyan/15 blur-[120px]" />
      </div>

      {/* ── En-tête de la salle ─────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-white/10 bg-white/[0.03] backdrop-blur-sm">
        <Container className="flex items-center gap-3 py-4 sm:gap-4">
          <Link
            href={`/courses/${slug}`}
            aria-label="Retour à la page du cours"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={18} aria-hidden />
          </Link>

          <span
            aria-hidden
            className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand sm:grid"
          >
            <MessagesSquare size={19} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-cyan/90">
              Discussion en direct
            </p>
            <h1 className="truncate font-display text-lg font-bold leading-tight text-white sm:text-xl">
              {access.courseTitle}
            </h1>
          </div>
        </Container>
      </header>

      {/* ── Corps ───────────────────────────────────────────────────────── */}
      {access.canView ? (
        <ChatRoom
          slug={slug}
          initialMessages={messages}
          initialPresence={presence}
          access={access}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center px-5 py-16">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-sm">
            <span
              aria-hidden
              className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-white/80 ring-1 ring-white/10"
            >
              <Lock size={24} />
            </span>
            <h2 className="mt-5 font-display text-xl font-bold text-white">
              Rejoignez le cours pour accéder à la communauté
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-white/60">
              La discussion en direct est réservée aux apprenants inscrits à
              « {access.courseTitle} ». Inscrivez-vous pour échanger avec le
              formateur et les autres membres.
            </p>
            <Link
              href={`/courses/${slug}`}
              className={cn(
                buttonClasses({ variant: "primary", size: "md" }),
                "mt-6 w-full",
              )}
            >
              <Monogram variant="white" size={18} />
              Découvrir le cours
            </Link>
            <Badge className="mt-5 border border-white/15 bg-white/5 text-white/70">
              Accès inclus dès l&apos;inscription
            </Badge>
          </div>
        </div>
      )}
    </section>
  );
}
