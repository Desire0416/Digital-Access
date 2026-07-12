"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  Link2,
  Briefcase,
  BadgeCheck,
  Undo2,
  Loader2,
  Wrench,
  Contact,
  Code2,
} from "lucide-react";
import { Button, Field, Input, Textarea, cn } from "@da/ui";
import { Select } from "@/components/Select";
import { ImageUpload } from "@/components/ImageUpload";
import type { MyPortfolioEditor } from "@/lib/portfolio-queries";
import {
  updatePortfolioPresentation,
  setPortfolioVisibility,
  publishProjectToPortfolio,
  unpublishProjectFromPortfolio,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
} from "@/lib/portfolio-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Éditeur de portfolio (§16.7 / §19.5) — présentation, visibilité, projets
   validés à publier/dépublier, expériences & liens manuels.
   ══════════════════════════════════════════════════════════════════════════ */

export type ManualItemType = "EXPERIENCE" | "LINK";
type PortfolioMeta = NonNullable<MyPortfolioEditor["portfolio"]>;
type PortfolioItem = MyPortfolioEditor["items"][number];
type PublishableProject = MyPortfolioEditor["publishableProjects"][number];

type Feedback = { ok: boolean; message: string } | null;

function FeedbackNote({ state }: { state: Feedback }) {
  return (
    <AnimatePresence>
      {state && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={cn(
            "flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium",
            state.ok ? "border-success/30 bg-success/5 text-success" : "border-error/30 bg-error/5 text-error",
          )}
          role="status"
        >
          {state.ok ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden />
          ) : (
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
          )}
          {state.message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Carte de section (client, calquée sur Panel) ─────────────────────────── */
function Card({
  title,
  icon,
  action,
  children,
}: {
  title: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 font-display text-base font-bold text-navy sm:text-lg">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function toLines(values: string[]): string {
  return values.join("\n");
}
function parseList(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function PortfolioEditor({
  portfolio,
  items,
  publishableProjects,
}: {
  portfolio: PortfolioMeta;
  items: PortfolioItem[];
  publishableProjects: PublishableProject[];
}) {
  const router = useRouter();

  /* ── Visibilité ── */
  const [isPublic, setIsPublic] = React.useState(portfolio.isPublic);
  const [visPending, setVisPending] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function toggleVisibility() {
    const next = !isPublic;
    setVisPending(true);
    const res = await setPortfolioVisibility(next);
    setVisPending(false);
    if (res.ok) {
      setIsPublic(next);
      router.refresh();
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/portfolio/${portfolio.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  /* ── Présentation ── */
  const [headline, setHeadline] = React.useState(portfolio.headline ?? "");
  const [about, setAbout] = React.useState(portfolio.about ?? "");
  const [tools, setTools] = React.useState(toLines(portfolio.tools));
  const [github, setGithub] = React.useState(portfolio.links.github ?? "");
  const [linkedin, setLinkedin] = React.useState(portfolio.links.linkedin ?? "");
  const [website, setWebsite] = React.useState(portfolio.links.website ?? "");
  const [presPending, setPresPending] = React.useState(false);
  const [presState, setPresState] = React.useState<Feedback>(null);

  async function savePresentation(e: React.FormEvent) {
    e.preventDefault();
    setPresPending(true);
    setPresState(null);
    const res = await updatePortfolioPresentation({
      headline: headline.trim(),
      about: about.trim(),
      tools: parseList(tools),
      github: github.trim(),
      linkedin: linkedin.trim(),
      website: website.trim(),
    });
    setPresPending(false);
    if (res.ok) {
      setPresState({ ok: true, message: res.message ?? "Présentation enregistrée." });
      router.refresh();
    } else {
      setPresState({ ok: false, message: res.error });
    }
  }

  /* ── Projets validés ── */
  const [projectBusy, setProjectBusy] = React.useState<string | null>(null);

  async function toggleProject(submissionId: string, published: boolean) {
    setProjectBusy(submissionId);
    const res = published
      ? await unpublishProjectFromPortfolio(submissionId)
      : await publishProjectToPortfolio(submissionId);
    setProjectBusy(null);
    if (res.ok) router.refresh();
  }

  const manualItems = items.filter((i) => i.type !== "PROJECT");

  return (
    <div className="space-y-6">
      {/* ══════════ Visibilité ══════════ */}
      <Card
        icon={
          isPublic ? (
            <Eye size={17} className="text-brand-blue-royal" aria-hidden />
          ) : (
            <EyeOff size={17} className="text-text-muted" aria-hidden />
          )
        }
        title="Visibilité"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-navy">
              {isPublic ? "Votre portfolio est public." : "Votre portfolio est privé."}
            </p>
            <p className="mt-0.5 text-xs text-text-secondary">
              {isPublic
                ? "Toute personne disposant du lien peut le consulter et il est indexable."
                : "Activez la visibilité publique pour partager votre lien."}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleVisibility}
            disabled={visPending}
            role="switch"
            aria-checked={isPublic}
            aria-label="Basculer la visibilité publique"
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-60",
              isPublic ? "bg-gradient-da" : "bg-navy/15",
            )}
          >
            <span
              className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
                isPublic ? "translate-x-6" : "translate-x-1",
              )}
            />
          </button>
        </div>

        {isPublic && (
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-navy/[0.07] bg-surface-secondary/50 p-3 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-surface-primary px-3 py-2 font-mono text-xs text-navy/80">
              /portfolio/{portfolio.slug}
            </code>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-navy/10 px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-navy/[0.04]"
            >
              {copied ? <CheckCircle2 size={14} className="text-success" aria-hidden /> : <Link2 size={14} aria-hidden />}
              {copied ? "Copié" : "Copier le lien"}
            </button>
          </div>
        )}
      </Card>

      {/* ══════════ Présentation ══════════ */}
      <Card icon={<Globe size={17} className="text-brand-blue-royal" aria-hidden />} title="Présentation">
        <form onSubmit={savePresentation} className="space-y-5">
          <FeedbackNote state={presState} />

          <Field label="Intitulé professionnel" htmlFor="headline" hint="Ex. « Analyste de données junior »">
            <Input
              id="headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="Votre titre en une ligne"
              maxLength={120}
            />
          </Field>

          <Field label="À propos" htmlFor="about" hint="Markdown accepté (titres, listes, gras…).">
            <Textarea
              id="about"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={6}
              placeholder="Présentez votre parcours, vos ambitions, vos points forts…"
            />
          </Field>

          <Field label="Outils & technologies" htmlFor="tools" hint="Un par ligne (ou séparés par des virgules).">
            <Textarea
              id="tools"
              value={tools}
              onChange={(e) => setTools(e.target.value)}
              rows={3}
              placeholder={"SQL\nPython\nExcel"}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="GitHub" htmlFor="github">
              <div className="relative">
                <Code2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
                <Input id="github" type="url" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/…" className="pl-9" />
              </div>
            </Field>
            <Field label="LinkedIn" htmlFor="linkedin">
              <div className="relative">
                <Contact size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
                <Input id="linkedin" type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" className="pl-9" />
              </div>
            </Field>
            <Field label="Site web" htmlFor="website">
              <div className="relative">
                <Globe size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
                <Input id="website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" className="pl-9" />
              </div>
            </Field>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={presPending}>
              <Save size={16} aria-hidden />
              Enregistrer la présentation
            </Button>
          </div>
        </form>
      </Card>

      {/* ══════════ Projets validés ══════════ */}
      <Card icon={<BadgeCheck size={17} className="text-brand-blue-royal" aria-hidden />} title="Projets validés">
        {publishableProjects.length === 0 ? (
          <p className="rounded-xl border border-dashed border-navy/[0.12] bg-surface-secondary/40 px-4 py-6 text-center text-sm text-text-secondary">
            Aucun projet validé pour l&apos;instant. Réussissez le projet d&apos;une formation pour pouvoir le publier ici.
          </p>
        ) : (
          <ul className="space-y-3">
            {publishableProjects.map((proj) => {
              const busy = projectBusy === proj.submissionId;
              return (
                <li
                  key={proj.submissionId}
                  className="flex flex-col gap-3 rounded-xl border border-navy/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-sm font-bold text-navy">{proj.projectTitle}</p>
                      {proj.isPublished && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                          <BadgeCheck size={11} aria-hidden />
                          Publié
                        </span>
                      )}
                    </div>
                    {proj.source && <p className="mt-0.5 text-xs text-text-secondary">{proj.source}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleProject(proj.submissionId, proj.isPublished)}
                    disabled={busy}
                    className={cn(
                      "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-transform active:scale-95 disabled:opacity-60",
                      proj.isPublished
                        ? "border border-navy/10 bg-surface-primary text-navy hover:bg-navy/[0.04]"
                        : "bg-gradient-da text-white shadow-brand hover:scale-[1.02]",
                    )}
                  >
                    {busy ? (
                      <Loader2 size={14} className="animate-spin" aria-hidden />
                    ) : proj.isPublished ? (
                      <Undo2 size={14} aria-hidden />
                    ) : (
                      <Plus size={14} aria-hidden />
                    )}
                    {proj.isPublished ? "Retirer" : "Publier"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* ══════════ Expériences & liens ══════════ */}
      <ManualItemsSection items={manualItems} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Section des items manuels (EXPERIENCE / LINK) — ajout / édition / suppression
   ══════════════════════════════════════════════════════════════════════════ */

const TYPE_OPTIONS = [
  { value: "EXPERIENCE", label: "Expérience" },
  { value: "LINK", label: "Lien / réalisation externe" },
];

function ManualItemsSection({ items }: { items: PortfolioItem[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<string | null>(null); // id | "new" | null

  return (
    <Card
      icon={<Briefcase size={17} className="text-brand-blue-royal" aria-hidden />}
      title="Expériences & liens"
      action={
        editing !== "new" ? (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy/10 px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-navy/[0.04]"
          >
            <Plus size={14} aria-hidden />
            Ajouter
          </button>
        ) : null
      }
    >
      <div className="space-y-3">
        {editing === "new" && (
          <ItemForm
            onDone={() => {
              setEditing(null);
              router.refresh();
            }}
            onCancel={() => setEditing(null)}
          />
        )}

        {items.length === 0 && editing !== "new" && (
          <p className="rounded-xl border border-dashed border-navy/[0.12] bg-surface-secondary/40 px-4 py-6 text-center text-sm text-text-secondary">
            Ajoutez une expérience professionnelle ou un lien vers une réalisation externe.
          </p>
        )}

        {items.map((item) =>
          editing === item.id ? (
            <ItemForm
              key={item.id}
              item={item}
              onDone={() => {
                setEditing(null);
                router.refresh();
              }}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <ManualItemRow key={item.id} item={item} onEdit={() => setEditing(item.id)} />
          ),
        )}
      </div>
    </Card>
  );
}

function ManualItemRow({ item, onEdit }: { item: PortfolioItem; onEdit: () => void }) {
  const router = useRouter();
  const [deleting, setDeleting] = React.useState(false);

  async function remove() {
    setDeleting(true);
    const res = await deletePortfolioItem(item.id);
    setDeleting(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex gap-3 rounded-xl border border-navy/[0.07] p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-navy/[0.04] text-brand-blue-royal" aria-hidden>
        {item.type === "LINK" ? <Link2 size={18} /> : <Briefcase size={18} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-bold text-navy">{item.title}</p>
        {item.description && <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{item.description}</p>}
        {item.url && <p className="mt-1 truncate text-xs font-medium text-brand-blue-royal">{item.url}</p>}
      </div>
      <div className="flex shrink-0 items-start gap-1.5">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Modifier"
          className="grid h-8 w-8 place-items-center rounded-lg border border-navy/10 text-text-secondary transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={deleting}
          aria-label="Supprimer"
          className="grid h-8 w-8 place-items-center rounded-lg border border-navy/10 text-text-secondary transition-colors hover:border-error/40 hover:text-error disabled:opacity-60"
        >
          {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}

function ItemForm({
  item,
  onDone,
  onCancel,
}: {
  item?: PortfolioItem;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [type, setType] = React.useState<ManualItemType>(item ? (item.type === "LINK" ? "LINK" : "EXPERIENCE") : "EXPERIENCE");
  const [title, setTitle] = React.useState(item?.title ?? "");
  const [description, setDescription] = React.useState(item?.description ?? "");
  const [url, setUrl] = React.useState(item?.url ?? "");
  const [image, setImage] = React.useState<string | null>(item?.image ?? null);
  const [skills, setSkills] = React.useState((item?.skills ?? []).join(", "));
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Le titre est requis.");
      return;
    }
    setError(null);
    setPending(true);
    const res = item
      ? await updatePortfolioItem(item.id, {
          title: title.trim(),
          description: description.trim(),
          url: url.trim(),
          image: image ?? "",
          skills: parseList(skills),
        })
      : await addPortfolioItem({
          type,
          title: title.trim(),
          description: description.trim(),
          url: url.trim(),
          image: image ?? "",
          skills: parseList(skills),
        });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onDone();
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={submit}
      className="space-y-4 rounded-xl border border-brand-blue-vif/25 bg-brand-blue-vif/[0.03] p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-display text-sm font-bold text-navy">{item ? "Modifier l'élément" : "Nouvel élément"}</p>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Annuler"
          className="grid h-7 w-7 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-navy"
        >
          <X size={15} />
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-error"
            role="alert"
          >
            <AlertCircle size={13} aria-hidden />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="grid gap-4 sm:grid-cols-2">
        {!item && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-navy">Type</label>
            <Select
              value={type}
              onChange={(v) => setType(v as ManualItemType)}
              options={TYPE_OPTIONS}
              ariaLabel="Type d'élément"
            />
          </div>
        )}
        <Field label="Titre" htmlFor="item-title" required>
          <Input id="item-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Stage analyste — Société X" required />
        </Field>
      </div>

      <Field label="Description" htmlFor="item-desc">
        <Textarea id="item-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Décrivez le contexte, votre rôle, les résultats…" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Lien" htmlFor="item-url" hint="URL de la réalisation (optionnel).">
          <div className="relative">
            <Link2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
            <Input id="item-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="pl-9" />
          </div>
        </Field>
        <Field label="Compétences" htmlFor="item-skills" hint="Séparées par des virgules.">
          <div className="relative">
            <Wrench size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
            <Input id="item-skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="SQL, Reporting…" className="pl-9" />
          </div>
        </Field>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-navy">Illustration (optionnel)</label>
        <ImageUpload value={image} onChange={setImage} folder="portfolio" aspect="16 / 7" hint="PNG, JPG ou WebP — 5 Mo max" />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={pending}>
          <Save size={16} aria-hidden />
          {item ? "Enregistrer" : "Ajouter"}
        </Button>
      </div>
    </motion.form>
  );
}
