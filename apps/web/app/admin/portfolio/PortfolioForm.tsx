"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  Save,
  Send,
  AlertCircle,
  X,
  Layers,
  ImageIcon,
  Link2,
  Building2,
  Star,
  Quote,
  Settings2,
  Trash2,
  Eye,
  Images,
  FolderKanban,
} from "lucide-react";
import {
  cn,
  buttonClasses,
  Field,
  Input,
  Textarea,
} from "@da/ui";
import {
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
} from "@/lib/admin-actions";
import { PROJECT_TYPE } from "@/components/admin/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Formulaire de réalisation portfolio — création & édition.
   Deux colonnes en lg : contenu à gauche (titre, description, client, type,
   liens), réglages à droite (couverture, technologies, mise en vedette,
   témoignage, aperçu, actions). Création → createPortfolioItem puis redirection
   vers l'édition. Édition → updatePortfolioItem puis router.refresh().
   Suppression (édition) → deletePortfolioItem puis retour à la liste.
   ══════════════════════════════════════════════════════════════════════════ */

type ProjectType = keyof typeof PROJECT_TYPE;

const TYPE_ORDER = Object.keys(PROJECT_TYPE) as ProjectType[];

export type PortfolioFormItem = {
  id: string;
  title: string;
  slug: string;
  description: string;
  client: string;
  type: string;
  url: string | null;
  coverImage: string | null;
  images: string[];
  technologies: string[];
  featured: boolean;
  testimonial: string | null;
};

export function PortfolioForm({
  mode = "create",
  item,
}: {
  mode?: "create" | "edit";
  item?: PortfolioFormItem;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [deleting, startDelete] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const [title, setTitle] = React.useState(item?.title ?? "");
  const [description, setDescription] = React.useState(item?.description ?? "");
  const [client, setClient] = React.useState(item?.client ?? "");
  const [type, setType] = React.useState<ProjectType>(
    (item?.type as ProjectType) ?? "SITE_VITRINE",
  );
  const [url, setUrl] = React.useState(item?.url ?? "");
  const [coverImage, setCoverImage] = React.useState(item?.coverImage ?? "");
  const [technologies, setTechnologies] = React.useState<string[]>(
    item?.technologies ?? [],
  );
  const [techDraft, setTechDraft] = React.useState("");
  const [featured, setFeatured] = React.useState(item?.featured ?? false);
  const [testimonial, setTestimonial] = React.useState(item?.testimonial ?? "");

  /* ── Gestion des technologies (découpage sur virgule / Entrée) ── */
  const commitTechs = (raw: string) => {
    const parts = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setTechnologies((prev) => {
      const next = [...prev];
      for (const p of parts) {
        if (!next.some((t) => t.toLowerCase() === p.toLowerCase())) next.push(p);
      }
      return next;
    });
    setTechDraft("");
  };

  const onTechKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTechs(techDraft);
    } else if (e.key === "Backspace" && techDraft === "" && technologies.length > 0) {
      setTechnologies((prev) => prev.slice(0, -1));
    }
  };

  const onTechChange = (value: string) => {
    if (value.includes(",")) {
      commitTechs(value);
    } else {
      setTechDraft(value);
    }
  };

  const removeTech = (tech: string) =>
    setTechnologies((prev) => prev.filter((t) => t !== tech));

  const canSubmit =
    title.trim() !== "" && description.trim() !== "" && client.trim() !== "";

  const submit = () => {
    setError(null);
    setSaved(false);

    if (title.trim() === "") return setError("Le titre est requis.");
    if (description.trim() === "") return setError("La description est requise.");
    if (client.trim() === "") return setError("Le nom du client est requis.");

    // On intègre une éventuelle techno en cours de saisie.
    const pendingTechs = techDraft.trim()
      ? Array.from(
          new Set(
            [...technologies, techDraft.trim()].map((t) => t.trim()).filter(Boolean),
          ),
        )
      : technologies;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      client: client.trim(),
      type,
      url: url.trim() || undefined,
      coverImage: coverImage.trim() || undefined,
      technologies: pendingTechs,
      featured,
      testimonial: testimonial.trim() || undefined,
    };

    startTransition(async () => {
      if (mode === "create") {
        const res = await createPortfolioItem(payload);
        if (res.ok) {
          router.push(`/admin/portfolio/${res.id}/edit`);
        } else {
          setError(res.error);
        }
      } else {
        const res = await updatePortfolioItem({ id: item!.id, ...payload });
        if (res.ok) {
          setSaved(true);
          router.refresh();
          setTimeout(() => setSaved(false), 2500);
        } else {
          setError(res.error);
        }
      }
    });
  };

  const onDelete = () => {
    setError(null);
    startDelete(async () => {
      const res = await deletePortfolioItem({ id: item!.id });
      if (res.ok) {
        router.push("/admin/portfolio");
        router.refresh();
      } else {
        setError(res.error);
        setConfirmDelete(false);
      }
    });
  };

  const busy = pending || deleting;

  const selectClasses = cn(
    "h-11 w-full appearance-none rounded-lg border border-navy/15 bg-surface-primary px-4 pr-10 text-sm font-medium text-navy",
    "transition-all focus:border-brand-blue-vif focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/25 disabled:opacity-60",
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* ─────────────── Colonne principale ─────────────── */}
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-da text-white">
              <FolderKanban className="h-4 w-4" />
            </span>
            Détails du projet
          </h2>

          <div className="mt-5 flex flex-col gap-5">
            <Field label="Titre du projet" htmlFor="pf-title" required>
              <Input
                id="pf-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Boutique Élégance — site e-commerce"
                disabled={busy}
                className="font-display text-base font-semibold"
              />
            </Field>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Client" htmlFor="pf-client" required>
                <div className="relative">
                  <Input
                    id="pf-client"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="Nom de l’entreprise"
                    disabled={busy}
                    className="pl-10"
                  />
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                </div>
              </Field>

              <Field label="Type de projet" htmlFor="pf-type">
                <div className="relative">
                  <select
                    id="pf-type"
                    value={type}
                    disabled={busy}
                    onChange={(e) => setType(e.target.value as ProjectType)}
                    className={selectClasses}
                  >
                    {!(TYPE_ORDER as readonly string[]).includes(type) && (
                      <option value={type}>{type}</option>
                    )}
                    {TYPE_ORDER.map((t) => (
                      <option key={t} value={t}>
                        {PROJECT_TYPE[t]}
                      </option>
                    ))}
                  </select>
                  <Chevron />
                </div>
              </Field>
            </div>

            <Field
              label="Description"
              htmlFor="pf-description"
              required
              hint="Le contexte, les enjeux et la solution apportée."
            >
              <Textarea
                id="pf-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Présentez le projet : objectifs du client, ce que Digital Access a conçu et livré, les résultats obtenus…"
                disabled={busy}
                className="min-h-[200px]"
              />
            </Field>

            <Field
              label="Lien du projet"
              htmlFor="pf-url"
              hint="URL du site en ligne. Optionnel."
            >
              <div className="relative">
                <Input
                  id="pf-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                  disabled={busy}
                  className="pl-10"
                />
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              </div>
            </Field>
          </div>
        </section>

        {/* Aperçu de la carte portfolio */}
        <section className="overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-secondary/40">
          <div className="flex items-center gap-2 border-b border-navy/[0.06] px-5 py-3">
            <Eye className="h-4 w-4 text-brand-blue-royal" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Aperçu de la carte
            </span>
          </div>
          <div className="p-5 sm:p-6">
            <div className="overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary">
              {coverImage.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverImage}
                  alt="Aperçu de l'image de couverture du projet"
                  className="aspect-[16/9] w-full border-b border-navy/[0.06] object-cover"
                />
              ) : (
                <div className="flex aspect-[16/9] w-full items-center justify-center border-b border-navy/[0.06] bg-gradient-da/[0.06]">
                  <Images className="h-8 w-8 text-brand-violet/40" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-brand-violet/[0.08] px-2.5 py-0.5 text-[11px] font-semibold text-brand-violet">
                    {PROJECT_TYPE[type] ?? type}
                  </span>
                  {featured && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B45309]">
                      <Star className="h-3 w-3 fill-current" />
                      Vedette
                    </span>
                  )}
                </div>
                <h3 className="mt-3 font-display text-lg font-extrabold tracking-tight text-navy">
                  {title.trim() || "Titre du projet"}
                </h3>
                <p className="mt-1 text-sm font-medium text-text-secondary">
                  {client.trim() || "Nom du client"}
                </p>
                {technologies.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {technologies.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-navy/[0.05] px-2 py-0.5 text-[11px] font-medium text-text-secondary"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ─────────────── Colonne latérale : réglages + actions ─────────────── */}
      <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
        {/* Publication / actions */}
        <section className="overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-primary">
          <div className="h-1 bg-gradient-da" />
          <div className="p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
              <Settings2 className="h-4 w-4 text-brand-blue-royal" />
              Mise en avant
            </h2>

            {/* Toggle vedette */}
            <button
              type="button"
              role="switch"
              aria-checked={featured}
              disabled={busy}
              onClick={() => setFeatured((v) => !v)}
              className={cn(
                "mt-4 flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors disabled:opacity-60",
                featured
                  ? "border-brand-violet/25 bg-brand-violet/[0.06]"
                  : "border-navy/[0.1] bg-surface-secondary/40 hover:bg-surface-secondary/70",
              )}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                    featured
                      ? "bg-gradient-da text-white"
                      : "bg-navy/[0.06] text-text-muted",
                  )}
                >
                  <Star className={cn("h-4 w-4", featured && "fill-current")} />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-navy">
                    Projet vedette
                  </span>
                  <span className="block text-[11px] text-text-muted">
                    Mis en avant sur le site
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  featured ? "bg-gradient-da" : "bg-navy/15",
                )}
              >
                <motion.span
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                  className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm",
                    featured ? "right-0.5" : "left-0.5",
                  )}
                />
              </span>
            </button>

            <button
              type="button"
              onClick={submit}
              disabled={busy || !canSubmit}
              className={cn(
                buttonClasses({ variant: "primary", size: "md" }),
                "mt-5 w-full disabled:opacity-50",
              )}
            >
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === "create" ? "Création…" : "Enregistrement…"}
                </>
              ) : mode === "create" ? (
                <>
                  <Send className="h-4 w-4" />
                  Créer la réalisation
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer les modifications
                </>
              )}
            </button>

            <AnimatePresence mode="wait">
              {error ? (
                <motion.p
                  key="err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 flex items-start gap-1.5 text-xs font-medium text-error"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </motion.p>
              ) : saved ? (
                <motion.p
                  key="ok"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success"
                >
                  <Save className="h-3.5 w-3.5" /> Modifications enregistrées
                </motion.p>
              ) : null}
            </AnimatePresence>

            {mode === "create" && (
              <p className="mt-3 text-center text-[11px] text-text-muted">
                La réalisation sera immédiatement visible dans le portfolio public.
              </p>
            )}
          </div>
        </section>

        {/* Visuel */}
        <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
            <ImageIcon className="h-4 w-4 text-brand-blue-royal" />
            Visuel
          </h2>

          <div className="mt-4">
            <Field
              label="Image de couverture"
              htmlFor="pf-cover"
              hint="URL d’une image (WebP/JPG). Optionnel."
            >
              <div className="relative">
                <Input
                  id="pf-cover"
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://…"
                  disabled={busy}
                  className="pl-10"
                />
                <ImageIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              </div>
            </Field>
          </div>
        </section>

        {/* Technologies */}
        <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
            <Layers className="h-4 w-4 text-brand-blue-royal" />
            Technologies
          </h2>

          <div className="mt-4">
            <Field
              label="Stack technique"
              htmlFor="pf-tech"
              hint="Séparez par une virgule ou la touche Entrée."
            >
              <div className="relative">
                <Input
                  id="pf-tech"
                  value={techDraft}
                  onChange={(e) => onTechChange(e.target.value)}
                  onKeyDown={onTechKeyDown}
                  onBlur={() => techDraft.trim() && commitTechs(techDraft)}
                  placeholder="Next.js, Tailwind, Prisma…"
                  disabled={busy}
                  className="pl-10"
                />
                <Layers className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              </div>
              {technologies.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <AnimatePresence initial={false}>
                    {technologies.map((tech) => (
                      <motion.span
                        key={tech}
                        layout
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        className="inline-flex items-center gap-1 rounded-full bg-brand-violet/10 py-1 pl-2.5 pr-1 text-xs font-semibold text-brand-violet"
                      >
                        {tech}
                        <button
                          type="button"
                          onClick={() => removeTech(tech)}
                          disabled={busy}
                          aria-label={`Retirer ${tech}`}
                          className="grid h-4 w-4 place-items-center rounded-full text-brand-violet/70 transition-colors hover:bg-brand-violet/20 hover:text-brand-violet"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </Field>
          </div>
        </section>

        {/* Témoignage */}
        <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
            <Quote className="h-4 w-4 text-brand-blue-royal" />
            Témoignage client
          </h2>

          <div className="mt-4">
            <Field
              label="Citation"
              htmlFor="pf-testimonial"
              hint="Un retour du client sur le projet. Optionnel."
            >
              <Textarea
                id="pf-testimonial"
                value={testimonial}
                onChange={(e) => setTestimonial(e.target.value)}
                placeholder="« Digital Access a transformé notre présence en ligne… »"
                disabled={busy}
                className="min-h-24"
              />
            </Field>
          </div>
        </section>

        {/* Zone de suppression (édition uniquement) */}
        {mode === "edit" && (
          <section className="rounded-2xl border border-error/20 bg-error/[0.03] p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-error">
              <Trash2 className="h-4 w-4" />
              Supprimer la réalisation
            </h2>
            <p className="mt-1.5 text-xs text-text-secondary">
              Cette action est définitive. La réalisation disparaîtra du portfolio public.
            </p>

            <AnimatePresence mode="wait" initial={false}>
              {confirmDelete ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <p className="mt-4 text-sm font-semibold text-navy">
                    Confirmer la suppression&nbsp;?
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={onDelete}
                      disabled={deleting}
                      className={cn(
                        buttonClasses({ variant: "primary", size: "sm" }),
                        "flex-1 !bg-error !bg-none hover:!bg-error/90 disabled:opacity-50",
                      )}
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Suppression…
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Oui, supprimer
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className={cn(
                        buttonClasses({ variant: "outline", size: "sm" }),
                        "flex-1",
                      )}
                    >
                      Annuler
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="trigger"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={busy}
                  className={cn(
                    "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-error/30 bg-surface-primary px-4 py-2 text-sm font-semibold text-error transition-colors hover:bg-error/[0.06] disabled:opacity-50",
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </motion.button>
              )}
            </AnimatePresence>
          </section>
        )}
      </aside>
    </div>
  );
}

/* Chevron décoratif pour les <select> personnalisés. */
function Chevron() {
  return (
    <svg
      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 8l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
