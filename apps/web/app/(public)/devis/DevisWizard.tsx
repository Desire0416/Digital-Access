"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Send,
  Sparkles,
} from "lucide-react";
import {
  Button,
  Field,
  Input,
  Textarea,
  Monogram,
  GradientText,
  buttonClasses,
  cn,
} from "@da/ui";
import {
  devisProjectTypes,
  devisBudgets,
  devisTimelines,
} from "@/lib/content";
import { Icon } from "@/components/Icon";
import { createLead, type CreateLeadResult } from "./actions";

/* ─── Types & état ─── */

interface FormState {
  projectType: string;
  projectTitle: string;
  message: string;
  existingUrl: string;
  budget: string;
  timeline: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

const initialForm: FormState = {
  projectType: "",
  projectTitle: "",
  message: "",
  existingUrl: "",
  budget: "",
  timeline: "",
  name: "",
  email: "",
  phone: "",
  company: "",
};

const STEPS = [
  { id: 1, label: "Projet", title: "Quel type de projet ?" },
  { id: 2, label: "Description", title: "Parlez-nous de votre projet" },
  { id: 3, label: "Budget & délai", title: "Budget et échéance" },
  { id: 4, label: "Coordonnées", title: "Comment vous joindre ?" },
] as const;

const TOTAL = STEPS.length;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── Composant principal ─── */

export function DevisWizard() {
  const [step, setStep] = React.useState(1);
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const [form, setForm] = React.useState<FormState>(initialForm);
  const [touched, setTouched] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [result, setResult] = React.useState<CreateLeadResult | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* Validation par étape */
  const stepValid = React.useMemo(() => {
    switch (step) {
      case 1:
        return form.projectType !== "";
      case 2:
        return form.projectTitle.trim().length >= 3 &&
          form.message.trim().length >= 10;
      case 3:
        return form.budget !== "" && form.timeline !== "";
      case 4:
        return (
          form.name.trim().length >= 2 && EMAIL_RE.test(form.email.trim())
        );
      default:
        return false;
    }
  }, [step, form]);

  const goNext = () => {
    if (!stepValid) {
      setTouched(true);
      return;
    }
    setTouched(false);
    setDirection(1);
    setStep((s) => Math.min(TOTAL, s + 1));
  };

  const goPrev = () => {
    setTouched(false);
    setDirection(-1);
    setStep((s) => Math.max(1, s - 1));
  };

  const submit = () => {
    if (!stepValid) {
      setTouched(true);
      return;
    }
    startTransition(async () => {
      const res = await createLead(form);
      setResult(res);
    });
  };

  const resetWizard = () => {
    setForm(initialForm);
    setStep(1);
    setResult(null);
    setTouched(false);
    setDirection(1);
  };

  const progress = result?.ok
    ? 100
    : Math.round(((step - 1) / TOTAL) * 100) + Math.round((stepValid ? 1 : 0) * (100 / TOTAL) * 0.35);

  /* ─── Écran de confirmation ─── */
  if (result?.ok) {
    return <Confirmation form={form} id={result.id} onReset={resetWizard} />;
  }

  return (
    <div className="relative">
      {/* Carte du wizard */}
      <div className="card-gradient-border overflow-hidden rounded-2xl bg-surface-primary shadow-[0_10px_40px_-12px_rgba(26,26,46,0.18)]">
        {/* En-tête : progression */}
        <div className="border-b border-navy/[0.06] bg-surface-secondary/60 px-6 pb-5 pt-6 sm:px-9">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-brand-blue-royal">
              Étape {step} / {TOTAL}
            </span>
            <span className="text-xs font-semibold text-text-muted">
              {STEPS[step - 1].label}
            </span>
          </div>

          {/* Barre de progression dégradée animée */}
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-navy/[0.07]">
            <motion.div
              className="h-full rounded-full bg-gradient-da"
              initial={false}
              animate={{ width: `${Math.max(6, progress)}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </div>

          {/* Pastilles d'étapes */}
          <ol className="mt-5 grid grid-cols-4 gap-2">
            {STEPS.map((s) => {
              const state =
                s.id < step ? "done" : s.id === step ? "current" : "todo";
              return (
                <li key={s.id} className="flex flex-col items-center gap-1.5">
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors",
                      state === "done" &&
                        "bg-gradient-da text-white shadow-brand",
                      state === "current" &&
                        "bg-white text-brand-blue-royal ring-2 ring-brand-blue-vif",
                      state === "todo" && "bg-navy/[0.06] text-text-muted",
                    )}
                  >
                    {state === "done" ? <Check size={15} /> : s.id}
                  </span>
                  <span
                    className={cn(
                      "hidden text-center text-[11px] font-medium leading-tight sm:block",
                      state === "todo" ? "text-text-muted" : "text-navy",
                    )}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Corps : étapes animées */}
        <div className="px-6 py-8 sm:px-9 sm:py-10">
          <h2 className="font-display text-xl font-bold text-navy sm:text-2xl">
            {STEPS[step - 1].title}
          </h2>

          <div className="relative mt-7 min-h-[18rem]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              >
                {step === 1 && (
                  <StepProject
                    value={form.projectType}
                    onSelect={(v) => {
                      update("projectType", v);
                      setTouched(false);
                    }}
                  />
                )}
                {step === 2 && (
                  <StepDescription
                    form={form}
                    update={update}
                    touched={touched}
                  />
                )}
                {step === 3 && (
                  <StepBudget
                    form={form}
                    update={update}
                  />
                )}
                {step === 4 && (
                  <StepContact
                    form={form}
                    update={update}
                    touched={touched}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Message d'erreur générique de l'étape */}
          <AnimatePresence>
            {touched && !stepValid && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 text-sm font-medium text-error"
              >
                Merci de compléter cette étape pour continuer.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Pied : navigation */}
        <div className="flex items-center justify-between gap-3 border-t border-navy/[0.06] bg-surface-secondary/40 px-6 py-5 sm:px-9">
          <button
            type="button"
            onClick={goPrev}
            disabled={step === 1 || isPending}
            className={cn(
              buttonClasses({ variant: "ghost", size: "md" }),
              "gap-2",
              step === 1 && "pointer-events-none opacity-0",
            )}
          >
            <ArrowLeft size={17} />
            Précédent
          </button>

          {step < TOTAL ? (
            <Button
              variant="primary"
              size="md"
              onClick={goNext}
              disabled={!stepValid}
              className="gap-2"
            >
              Suivant
              <ArrowRight size={17} />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={submit}
              loading={isPending}
              disabled={!stepValid || isPending}
              className="gap-2"
            >
              {!isPending && <Send size={16} />}
              Envoyer ma demande
            </Button>
          )}
        </div>
      </div>

      {/* Rassurance sous la carte */}
      <p className="mt-5 text-center text-sm text-text-muted">
        <Sparkles size={14} className="mr-1 inline text-brand-blue-vif" />
        Réponse sous 48h — devis gratuit et sans engagement.
      </p>
    </div>
  );
}

/* ─── Variants de transition (slide directionnel) ─── */

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
};

/* ─── Étape 1 — Type de projet ─── */

function StepProject({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-6 text-sm text-text-secondary">
        Sélectionnez ce qui correspond le mieux à votre besoin. Vous pourrez
        préciser juste après.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {devisProjectTypes.map((type) => {
          const selected = value === type.value;
          return (
            <motion.button
              key={type.value}
              type="button"
              onClick={() => onSelect(type.value)}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              aria-pressed={selected}
              className={cn(
                "group relative flex flex-col items-start gap-3 overflow-hidden rounded-xl border p-5 text-left transition-colors",
                selected
                  ? "border-transparent bg-gradient-da text-white shadow-brand"
                  : "border-navy/10 bg-surface-primary hover:border-brand-blue-vif/40",
              )}
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-lg transition-colors",
                  selected
                    ? "bg-white/15 text-white"
                    : "bg-brand-blue-vif/10 text-brand-blue-royal group-hover:bg-brand-blue-vif/15",
                )}
              >
                <Icon name={type.icon} size={22} />
              </span>
              <span
                className={cn(
                  "font-display text-base font-bold leading-tight",
                  selected ? "text-white" : "text-navy",
                )}
              >
                {type.label}
              </span>

              {/* Coche de sélection */}
              <AnimatePresence>
                {selected && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-brand-blue-royal"
                  >
                    <Check size={14} strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Étape 2 — Description ─── */

function StepDescription({
  form,
  update,
  touched,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  touched: boolean;
}) {
  const isRefonte = form.projectType === "REFONTE";
  const titleErr =
    touched && form.projectTitle.trim().length < 3
      ? "Donnez un titre à votre projet (3 caractères minimum)."
      : undefined;
  const msgErr =
    touched && form.message.trim().length < 10
      ? "Décrivez votre projet en quelques mots (10 caractères minimum)."
      : undefined;

  return (
    <div className="space-y-5">
      <Field
        label="Titre de votre projet"
        htmlFor="projectTitle"
        required
        error={titleErr}
        hint="Ex. « Site vitrine pour mon restaurant » ou « Boutique en ligne »"
      >
        <Input
          id="projectTitle"
          value={form.projectTitle}
          onChange={(e) => update("projectTitle", e.target.value)}
          placeholder="En une phrase, votre projet…"
          error={!!titleErr}
        />
      </Field>

      <Field
        label="Décrivez votre projet"
        htmlFor="message"
        required
        error={msgErr}
        hint="Objectifs, fonctionnalités souhaitées, public visé — tout ce qui nous aidera à vous conseiller."
      >
        <Textarea
          id="message"
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Parlez-nous de votre activité, de vos besoins et de vos attentes…"
          className="min-h-36"
          error={!!msgErr}
        />
      </Field>

      <Field
        label={
          isRefonte
            ? "Adresse de votre site actuel"
            : "Site ou page existante (optionnel)"
        }
        htmlFor="existingUrl"
        required={isRefonte}
        hint="Si vous avez déjà un site, une page réseau social ou une référence à nous montrer."
      >
        <Input
          id="existingUrl"
          type="url"
          inputMode="url"
          value={form.existingUrl}
          onChange={(e) => update("existingUrl", e.target.value)}
          placeholder="https://mon-site.ci"
        />
      </Field>
    </div>
  );
}

/* ─── Étape 3 — Budget & délai ─── */

function StepBudget({
  form,
  update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <div className="space-y-8">
      <PillGroup
        legend="Quel budget envisagez-vous ?"
        options={devisBudgets}
        value={form.budget}
        onSelect={(v) => update("budget", v)}
      />
      <PillGroup
        legend="Dans quel délai souhaitez-vous démarrer ?"
        options={devisTimelines}
        value={form.timeline}
        onSelect={(v) => update("timeline", v)}
      />
    </div>
  );
}

function PillGroup({
  legend,
  options,
  value,
  onSelect,
}: {
  legend: string;
  options: readonly string[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-navy">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <motion.button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              aria-pressed={selected}
              className={cn(
                "relative rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                selected
                  ? "border-transparent bg-gradient-da text-white shadow-brand"
                  : "border-navy/12 bg-surface-primary text-text-secondary hover:border-brand-blue-vif/50 hover:text-navy",
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                {selected && <Check size={14} strokeWidth={3} />}
                {opt}
              </span>
            </motion.button>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ─── Étape 4 — Coordonnées ─── */

function StepContact({
  form,
  update,
  touched,
}: {
  form: FormState;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  touched: boolean;
}) {
  const nameErr =
    touched && form.name.trim().length < 2 ? "Votre nom est requis." : undefined;
  const emailErr =
    touched && !EMAIL_RE.test(form.email.trim())
      ? "Adresse email invalide."
      : undefined;

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Nom complet"
          htmlFor="name"
          required
          error={nameErr}
        >
          <Input
            id="name"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Votre nom et prénom"
            autoComplete="name"
            error={!!nameErr}
          />
        </Field>

        <Field
          label="Adresse email"
          htmlFor="email"
          required
          error={emailErr}
        >
          <Input
            id="email"
            type="email"
            inputMode="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="vous@exemple.ci"
            autoComplete="email"
            error={!!emailErr}
          />
        </Field>

        <Field label="Téléphone / WhatsApp" htmlFor="phone" hint="Optionnel — pour un échange plus rapide.">
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+225 07 00 00 00 00"
            autoComplete="tel"
          />
        </Field>

        <Field label="Entreprise / Organisation" htmlFor="company" hint="Optionnel.">
          <Input
            id="company"
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Nom de votre structure"
            autoComplete="organization"
          />
        </Field>
      </div>

      <p className="rounded-lg bg-brand-blue-vif/[0.06] px-4 py-3 text-xs leading-relaxed text-text-secondary">
        En envoyant ce formulaire, vous acceptez d'être recontacté par
        l'équipe Digital Access au sujet de votre projet. Vos données ne sont
        jamais partagées.
      </p>
    </div>
  );
}

/* ─── Écran de confirmation ─── */

function Confirmation({
  form,
  id,
  onReset,
}: {
  form: FormState;
  id: string;
  onReset: () => void;
}) {
  const projectLabel =
    devisProjectTypes.find((t) => t.value === form.projectType)?.label ??
    "Projet";

  const recap: { label: string; value: string }[] = [
    { label: "Référence", value: id },
    { label: "Type de projet", value: projectLabel },
    { label: "Projet", value: form.projectTitle || "—" },
    { label: "Budget", value: form.budget || "À définir" },
    { label: "Délai", value: form.timeline || "À définir" },
    { label: "Contact", value: form.email },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <Confetti />

      <div className="card-gradient-border relative overflow-hidden rounded-2xl bg-surface-primary px-6 py-12 text-center shadow-[0_10px_40px_-12px_rgba(26,26,46,0.2)] sm:px-12 sm:py-16">
        <Monogram
          variant="gradient"
          size={200}
          className="absolute -bottom-14 -right-10 opacity-[0.06]"
        />

        {/* Coche dégradée animée */}
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.15 }}
          className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-da shadow-brand"
        >
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full bg-gradient-da"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 1.8 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            className="relative text-white"
          >
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeInOut" }}
            />
          </motion.svg>
        </motion.div>

        <h2 className="relative mt-7 font-display text-2xl font-extrabold text-navy sm:text-3xl">
          Demande <GradientText>envoyée</GradientText> !
        </h2>
        <p className="relative mx-auto mt-3 max-w-md text-text-secondary">
          Merci {form.name.split(" ")[0] || ""}. Nous avons bien reçu votre
          demande et reviendrons vers vous sous 48h avec un devis personnalisé.
        </p>

        {/* Récapitulatif */}
        <div className="relative mx-auto mt-8 max-w-md overflow-hidden rounded-xl border border-navy/[0.08] bg-surface-secondary/60 text-left">
          <dl className="divide-y divide-navy/[0.06]">
            {recap.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4 px-5 py-3"
              >
                <dt className="text-sm text-text-muted">{row.label}</dt>
                <dd className="text-right text-sm font-semibold text-navy">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className={buttonClasses({ variant: "primary", size: "md" })}
          >
            Retour à l'accueil
          </Link>
          <Link
            href="/portfolio"
            className={buttonClasses({ variant: "outline", size: "md" })}
          >
            Voir nos réalisations
            <ArrowRight size={17} />
          </Link>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="relative mt-5 text-sm font-medium text-text-muted underline-offset-4 transition-colors hover:text-brand-blue-royal hover:underline"
        >
          Envoyer une autre demande
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Confetti (simple, en pur CSS/JS) ─── */

function Confetti() {
  const pieces = React.useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => {
        const palette = ["#5B3FA8", "#2B5CC6", "#1E8FE1", "#00BCD4", "#7C3AED"];
        return {
          id: i,
          left: Math.random() * 100,
          color: palette[i % palette.length],
          delay: Math.random() * 0.5,
          duration: 2 + Math.random() * 1.5,
          size: 6 + Math.random() * 6,
          rotate: Math.random() * 360,
          drift: (Math.random() - 0.5) * 120,
        };
      }),
    [],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-6 z-10 h-40 overflow-hidden"
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.4,
            backgroundColor: p.color,
          }}
          initial={{ y: -30, opacity: 0, rotate: p.rotate }}
          animate={{
            y: 180,
            x: p.drift,
            opacity: [0, 1, 1, 0],
            rotate: p.rotate + 220,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}
