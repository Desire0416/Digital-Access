"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  Save,
  Send,
  AlertCircle,
  Star,
  Quote,
  Settings2,
  Trash2,
  UserRound,
  Building2,
  BadgeCheck,
  ImageIcon,
} from "lucide-react";
import { cn, buttonClasses, Field, Input, Textarea } from "@da/ui";
import {
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "@/lib/admin-actions";
import { ImageUpload } from "@/components/ImageUpload";

/* ══════════════════════════════════════════════════════════════════════════
   Formulaire de témoignage client — création & édition.
   Deux colonnes en lg : contenu à gauche (auteur, rôle, société, citation),
   réglages à droite (photo, note en étoiles, mise à la une, aperçu, actions).
   Création → createTestimonial puis redirection vers l'édition.
   Édition → updateTestimonial puis router.refresh().
   Suppression (édition) → deleteTestimonial puis retour à la liste.
   ══════════════════════════════════════════════════════════════════════════ */

export type TestimonialFormItem = {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  content: string;
  avatar: string | null;
  rating: number;
  featured: boolean;
};

export function TestimonialForm({
  mode = "create",
  item,
}: {
  mode?: "create" | "edit";
  item?: TestimonialFormItem;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [deleting, startDelete] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const [name, setName] = React.useState(item?.name ?? "");
  const [role, setRole] = React.useState(item?.role ?? "");
  const [company, setCompany] = React.useState(item?.company ?? "");
  const [content, setContent] = React.useState(item?.content ?? "");
  const [avatar, setAvatar] = React.useState(item?.avatar ?? "");
  const [rating, setRating] = React.useState<number>(item?.rating ?? 5);
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);
  const [featured, setFeatured] = React.useState(item?.featured ?? false);

  const canSubmit = name.trim().length >= 2 && content.trim().length >= 10;

  const submit = () => {
    setError(null);
    setSaved(false);

    if (name.trim().length < 2) return setError("Le nom est requis (2 caractères minimum).");
    if (content.trim().length < 10)
      return setError("Le témoignage est trop court (10 caractères minimum).");

    const payload = {
      name: name.trim(),
      role: role.trim() || undefined,
      company: company.trim() || undefined,
      content: content.trim(),
      avatar: avatar.trim() || undefined,
      rating,
      featured,
    };

    startTransition(async () => {
      if (mode === "create") {
        const res = await createTestimonial(payload);
        if (res.ok) {
          router.push(`/admin/temoignages/${res.id}/edit`);
        } else {
          setError(res.error);
        }
      } else {
        const res = await updateTestimonial({ id: item!.id, ...payload });
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
      const res = await deleteTestimonial({ id: item!.id });
      if (res.ok) {
        router.push("/admin/temoignages");
        router.refresh();
      } else {
        setError(res.error);
        setConfirmDelete(false);
      }
    });
  };

  const busy = pending || deleting;
  const displayedRating = hoverRating ?? rating;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* ─────────────── Colonne principale ─────────────── */}
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-da text-white">
              <Quote className="h-4 w-4" />
            </span>
            Contenu du témoignage
          </h2>

          <div className="mt-5 flex flex-col gap-5">
            <Field label="Nom du client" htmlFor="ts-name" required>
              <div className="relative">
                <Input
                  id="ts-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aïcha Koné"
                  disabled={busy}
                  className="pl-10 font-display text-base font-semibold"
                />
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                label="Rôle / fonction"
                htmlFor="ts-role"
                hint="Ex. Fondatrice, Directeur marketing. Optionnel."
              >
                <div className="relative">
                  <Input
                    id="ts-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Fondatrice"
                    disabled={busy}
                    className="pl-10"
                  />
                  <BadgeCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                </div>
              </Field>

              <Field label="Société" htmlFor="ts-company" hint="Optionnel.">
                <div className="relative">
                  <Input
                    id="ts-company"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Boutique Élégance"
                    disabled={busy}
                    className="pl-10"
                  />
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                </div>
              </Field>
            </div>

            <Field
              label="Témoignage"
              htmlFor="ts-content"
              required
              hint="Le retour du client sur sa collaboration avec Digital Access."
            >
              <Textarea
                id="ts-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="« Digital Access a transformé notre présence en ligne. Une équipe à l'écoute, réactive et créative… »"
                disabled={busy}
                className="min-h-[180px]"
              />
            </Field>
          </div>
        </section>

        {/* Aperçu de la carte témoignage */}
        <section className="overflow-hidden rounded-2xl border border-navy/[0.07] bg-surface-secondary/40">
          <div className="flex items-center gap-2 border-b border-navy/[0.06] px-5 py-3">
            <Quote className="h-4 w-4 text-brand-blue-royal" />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Aperçu public
            </span>
          </div>
          <div className="p-5 sm:p-6">
            <figure className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < rating ? "fill-warning text-warning" : "text-navy/15",
                    )}
                  />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-text-secondary">
                “{content.trim() || "Votre témoignage apparaîtra ici…"}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                {avatar.trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt={name.trim() || "Photo du client"}
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-da font-display text-sm font-extrabold text-white">
                    {initials(name)}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold text-navy">
                    {name.trim() || "Nom du client"}
                  </p>
                  {(role.trim() || company.trim()) && (
                    <p className="truncate text-xs text-text-secondary">
                      {[role.trim(), company.trim()].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              </figcaption>
            </figure>
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

            {/* Toggle à la une */}
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
                    Témoignage à la une
                  </span>
                  <span className="block text-[11px] text-text-muted">
                    Mis en avant sur la page d’accueil
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
                  Créer le témoignage
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
                Activez « à la une » pour l’afficher sur la page d’accueil.
              </p>
            )}
          </div>
        </section>

        {/* Note */}
        <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
            <Star className="h-4 w-4 text-brand-blue-royal" />
            Note attribuée
          </h2>

          <div className="mt-4 flex items-center gap-1.5" onMouseLeave={() => setHoverRating(null)}>
            {Array.from({ length: 5 }).map((_, i) => {
              const value = i + 1;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={busy}
                  aria-label={`${value} étoile${value > 1 ? "s" : ""}`}
                  aria-pressed={rating === value}
                  onMouseEnter={() => setHoverRating(value)}
                  onFocus={() => setHoverRating(value)}
                  onBlur={() => setHoverRating(null)}
                  onClick={() => setRating(value)}
                  className="rounded-md p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif/40 disabled:opacity-60"
                >
                  <Star
                    className={cn(
                      "h-7 w-7 transition-colors",
                      value <= displayedRating ? "fill-warning text-warning" : "text-navy/20",
                    )}
                  />
                </button>
              );
            })}
            <span className="ml-2 font-display text-sm font-bold tabular-nums text-navy">
              {rating}/5
            </span>
          </div>
        </section>

        {/* Photo */}
        <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
            <ImageIcon className="h-4 w-4 text-brand-blue-royal" />
            Photo du client
          </h2>

          <div className="mt-4 flex justify-center">
            <ImageUpload
              variant="avatar"
              value={avatar || null}
              onChange={(url) => setAvatar(url ?? "")}
              folder="testimonials"
              fallback={name}
              hint="PNG, JPG ou WebP — 5 Mo max. Optionnel."
            />
          </div>
        </section>

        {/* Zone de suppression (édition uniquement) */}
        {mode === "edit" && (
          <section className="rounded-2xl border border-error/20 bg-error/[0.03] p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-error">
              <Trash2 className="h-4 w-4" />
              Supprimer le témoignage
            </h2>
            <p className="mt-1.5 text-xs text-text-secondary">
              Cette action est définitive. Le témoignage disparaîtra du site public.
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
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-error/30 bg-surface-primary px-4 py-2 text-sm font-semibold text-error transition-colors hover:bg-error/[0.06] disabled:opacity-50"
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}
