"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Mail, Send } from "lucide-react";
import { Container, Monogram } from "@da/ui";

/**
 * Bloc newsletter décoratif. Aucune requête réseau — simule un abonnement
 * réussi côté client (démo). Design signature : dégradé DA + Monogram filigrane.
 */
export function NewsletterSignup() {
  const [email, setEmail] = React.useState("");
  const [done, setDone] = React.useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setDone(true);
  }

  return (
    <section className="py-6">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-navy/[0.06] bg-surface-secondary px-8 py-12 sm:px-12 sm:py-14"
        >
          <Monogram
            size={200}
            className="pointer-events-none absolute -bottom-12 -right-8 opacity-[0.06]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-[-40%] h-72 w-72 rounded-full bg-brand-violet/10 blur-[90px]"
          />

          <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-blue-vif/20 bg-brand-blue-vif/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-blue-royal">
                <Mail size={13} />
                Newsletter
              </span>
              <h2 className="mt-4 font-display text-2xl font-extrabold leading-tight text-navy sm:text-3xl">
                Recevez nos conseils numériques
              </h2>
              <p className="mt-3 max-w-md leading-relaxed text-text-secondary">
                Un e-mail par mois, sans spam : nos meilleurs articles, astuces et
                actualités du web pour faire grandir votre activité en Côte d'Ivoire.
              </p>
            </div>

            <div>
              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 rounded-2xl border border-success/20 bg-success/10 px-5 py-5"
                  >
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success text-white">
                      <Check size={20} />
                    </span>
                    <div>
                      <p className="font-semibold text-navy">Inscription confirmée !</p>
                      <p className="text-sm text-text-secondary">
                        Merci, vous recevrez bientôt nos prochaines actualités.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-3 sm:flex-row"
                  >
                    <div className="relative flex-1">
                      <Mail
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
                      />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="votre@email.com"
                        aria-label="Adresse e-mail"
                        className="h-14 w-full rounded-lg border border-navy/[0.1] bg-surface-primary pl-11 pr-4 text-navy placeholder:text-text-muted focus:border-brand-blue-vif/60 focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/25"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!valid}
                      className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-lg bg-gradient-da px-6 text-base font-semibold text-white shadow-brand transition-all duration-200 hover:-translate-y-0.5 hover:shadow-brand-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                    >
                      S'abonner
                      <Send size={17} />
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
              <p className="mt-3 text-xs text-text-muted">
                En vous inscrivant, vous acceptez notre politique de confidentialité.
                Désabonnement en un clic.
              </p>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
