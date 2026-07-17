import type { Metadata } from "next";
import Link from "next/link";
import { LifeBuoy, ChevronDown, MessageCircle, Mail, Ticket, HelpCircle } from "lucide-react";
import { Container } from "@da/ui";
import { getPublishedFaq } from "@/lib/support";
import { siteConfig } from "@/lib/site";
import { Markdown } from "@/components/Markdown";

export const metadata: Metadata = {
  title: "Centre d'aide — FAQ & support",
  description: "Trouvez des réponses aux questions fréquentes sur Access Academy : inscription, formations, paiement Mobile Money, certificats. Ou contactez notre équipe.",
  alternates: { canonical: `${siteConfig.url}/aide` },
};

export default async function AidePage() {
  const groups = await getPublishedFaq();
  const whatsappHref = `https://wa.me/${siteConfig.whatsapp.replace(/[^0-9]/g, "")}`;

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy text-white">
        <span className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand-violet/30 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-brand-cyan/20 blur-3xl" aria-hidden />
        <span className="pointer-events-none absolute inset-0 bg-grid opacity-[0.15]" aria-hidden />
        <Container className="relative py-14 text-center sm:py-16">
          <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-brand-cyan backdrop-blur-sm">
            <LifeBuoy size={28} aria-hidden />
          </span>
          <h1 className="mx-auto max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Comment pouvons-nous vous aider ?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70 sm:text-base">
            Parcourez les questions fréquentes. Vous ne trouvez pas votre réponse ? Ouvrez une demande
            de support ou écrivez-nous directement.
          </p>
        </Container>
      </section>

      <Container className="max-w-3xl">
        {/* Canaux de contact (§35.3) */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <Link
            href="/espace/support"
            className="group flex items-center gap-3 rounded-xl border border-navy/[0.08] bg-surface-primary p-4 transition-all hover:border-brand-blue-vif/40 hover:shadow-sm"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-da text-white" aria-hidden>
              <Ticket size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-navy">Ouvrir un ticket</span>
              <span className="block text-xs text-text-secondary">Suivi jusqu'à résolution</span>
            </span>
          </Link>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-navy/[0.08] bg-surface-primary p-4 transition-all hover:border-success/40 hover:shadow-sm"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-success/12 text-success" aria-hidden>
              <MessageCircle size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-navy">WhatsApp</span>
              <span className="block text-xs text-text-secondary">Réponse rapide</span>
            </span>
          </a>
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="group flex items-center gap-3 rounded-xl border border-navy/[0.08] bg-surface-primary p-4 transition-all hover:border-brand-blue-vif/40 hover:shadow-sm"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-blue-vif/12 text-brand-blue-royal" aria-hidden>
              <Mail size={18} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-navy">Email</span>
              <span className="block truncate text-xs text-text-secondary">{siteConfig.contactEmail}</span>
            </span>
          </a>
        </div>

        {/* FAQ */}
        {groups.length === 0 ? (
          <div className="mt-10 flex items-start gap-3 rounded-xl border border-navy/[0.08] bg-surface-secondary/50 p-5 text-sm text-text-secondary">
            <HelpCircle size={18} className="mt-0.5 shrink-0 text-brand-blue-royal" aria-hidden />
            <p>La foire aux questions sera bientôt disponible. En attendant, contactez-nous par l'un des canaux ci-dessus.</p>
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {groups.map((g) => (
              <section key={g.category}>
                <h2 className="mb-4 font-display text-lg font-bold text-navy">{g.category}</h2>
                <div className="space-y-2.5">
                  {g.items.map((item) => (
                    <details
                      key={item.id}
                      className="group rounded-xl border border-navy/[0.08] bg-surface-primary [&_summary::-webkit-details-marker]:hidden"
                    >
                      <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3.5 font-display text-sm font-bold text-navy">
                        {item.question}
                        <ChevronDown size={17} className="shrink-0 text-text-muted transition-transform group-open:rotate-180" aria-hidden />
                      </summary>
                      <div className="border-t border-navy/[0.06] px-4 py-3.5">
                        <Markdown className="prose-sm">{item.answer}</Markdown>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
