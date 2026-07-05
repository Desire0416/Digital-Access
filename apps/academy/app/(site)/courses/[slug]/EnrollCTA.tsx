"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { PlayCircle, Smartphone, Sparkles } from "lucide-react";
import { Button, buttonClasses, formatFCFA } from "@da/ui";
import { enrollInCourse } from "@/lib/actions";
import { academyConfig } from "@/lib/site";

/** Icône WhatsApp inline — lucide v1 n'embarque pas les icônes de marque. */
function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.668-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export interface EnrollCTAProps {
  slug: string;
  isFree: boolean;
  price: number;
  enrolled: boolean;
  /** Cible du bouton « Continuer le cours » (premier chapitre non complété). */
  continueHref?: string;
  /** Titre du cours — personnalise le message WhatsApp pré-rempli. */
  title?: string;
}

/**
 * CTA d'inscription de la carte sticky :
 * gratuit → inscription immédiate + redirection vers le player ;
 * payant → info « Mobile Money bientôt » + réservation WhatsApp ;
 * non connecté → renvoi vers la connexion avec callback.
 */
export function EnrollCTA({
  slug,
  isFree,
  price,
  enrolled,
  continueHref,
  title,
}: EnrollCTAProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [paidInfo, setPaidInfo] = useState(false);

  /* ── Déjà inscrit : reprise de lecture ─────────────────────────────────── */
  if (enrolled) {
    return (
      <Link
        href={continueHref ?? `/courses/${slug}`}
        className={buttonClasses({
          variant: "primary",
          size: "lg",
          className: "w-full",
        })}
      >
        <PlayCircle size={19} aria-hidden />
        Continuer le cours
      </Link>
    );
  }

  const whatsappHref = `https://wa.me/${academyConfig.contact.whatsapp}?text=${encodeURIComponent(
    `Bonjour Digital Access ! Je souhaite réserver ma place pour la formation « ${
      title ?? slug
    } » (${formatFCFA(price)}) sur Access Academy.`,
  )}`;

  const handleEnroll = () => {
    setError(null);
    startTransition(async () => {
      const res = await enrollInCourse(slug);
      if (res.ok) {
        router.push(res.redirect);
        return;
      }
      if (res.reason === "auth") {
        router.push(
          `/auth/login?callbackUrl=${encodeURIComponent(`/courses/${slug}`)}`,
        );
        return;
      }
      if (res.reason === "paid") {
        setPaidInfo(true);
        return;
      }
      setError(res.error);
    });
  };

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {paidInfo ? (
          /* ── Paiement Mobile Money : bientôt disponible ─────────────────── */
          <motion.div
            key="paid-info"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-xl border border-brand-blue-vif/25 bg-brand-blue-vif/[0.06] p-4"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-da text-white shadow-brand">
                <Smartphone size={19} aria-hidden />
              </span>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-bold text-navy">
                  Paiement Mobile Money bientôt disponible
                  <Sparkles size={14} className="text-brand-blue-royal" aria-hidden />
                </p>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  Orange Money, MTN MoMo et Wave arrivent très bientôt. En
                  attendant, réservez votre place — notre équipe vous inscrit
                  manuellement.
                </p>
              </div>
            </div>
            <motion.a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.97 }}
              className="mt-3.5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-6 text-[0.95rem] font-medium tracking-tight text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
            >
              <WhatsAppIcon />
              Réserver ma place
            </motion.a>
          </motion.div>
        ) : (
          /* ── CTA principal ──────────────────────────────────────────────── */
          <motion.div
            key="cta"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              loading={pending}
              onClick={handleEnroll}
            >
              {isFree
                ? "Commencer gratuitement"
                : `S'inscrire · ${formatFCFA(price)}`}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Erreur animée ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{
              opacity: 1,
              height: "auto",
              y: 0,
              x: [0, -6, 6, -3, 3, 0],
            }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-3 text-sm font-medium text-error"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
