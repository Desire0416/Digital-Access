"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Palette, Link2, Search, Eye, BookOpen, Route, Star, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@da/ui";
import type { getSchoolAdmin } from "@/lib/admin-queries";
import { LEVEL_LABEL } from "@/lib/site";
import { ImageUpload } from "@/components/ImageUpload";
import {
  updateSchool,
  attachCourseToSchool,
  detachCourseFromSchool,
  attachCareerPathToSchool,
  detachCareerPathFromSchool,
} from "@/lib/admin-actions";
import { StatusPill, CONTENT_STATUS_LABEL, CONTENT_STATUS_TONE } from "./ui";
import { inputClass, textareaClass, FieldLabel } from "./forms";
import { useAdminAction, Feedback, SaveButton } from "./action-hooks";

/* ══════════════════════════════════════════════════════════════════════════
   Éditeur d'école (§14, §43). Identité (nom, couleur, icône, description,
   couverture) + rattachements aux formations et parcours EXISTANTS. Une école
   regroupe, ne duplique jamais : on ne fait qu'attacher/détacher.
   ══════════════════════════════════════════════════════════════════════════ */

type SchoolAdmin = NonNullable<Awaited<ReturnType<typeof getSchoolAdmin>>>;
type CatalogueCourse = { id: string; title: string; slug: string; level: string; status: string };
type CataloguePath = { id: string; title: string; slug: string; targetJob: string; status: string };

type Tab = "identite" | "rattachements";

export function SchoolEditor({
  school,
  courses,
  paths,
}: {
  school: SchoolAdmin;
  courses: CatalogueCourse[];
  paths: CataloguePath[];
}) {
  const [tab, setTab] = React.useState<Tab>("identite");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/ecoles" className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal">
          ← Toutes les écoles
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-sm" style={{ background: school.color }} aria-hidden>
              <Palette size={20} />
            </span>
            <h1 className="min-w-0 truncate font-display text-2xl font-extrabold tracking-tight text-navy sm:text-[1.7rem]">{school.name}</h1>
          </div>
          <Link href={`/ecoles/${school.slug}`} target="_blank" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-navy/10 px-3.5 py-2 text-sm font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal">
            <Eye size={15} /> Aperçu public
          </Link>
        </div>
      </div>

      <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-navy/[0.08] px-1">
        {([
          { id: "identite", label: "Identité", icon: Palette },
          { id: "rattachements", label: "Rattachements", icon: Link2 },
        ] as { id: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[]).map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className={cn("relative inline-flex shrink-0 items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors", active ? "text-brand-blue-royal" : "text-text-secondary hover:text-navy")}>
              <Icon size={16} />
              {t.label}
              {active && <motion.span layoutId="school-tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-da" />}
            </button>
          );
        })}
      </div>

      {tab === "identite" ? <IdentityTab school={school} /> : <AttachmentsTab school={school} courses={courses} paths={paths} />}
    </div>
  );
}

function IdentityTab({ school }: { school: SchoolAdmin }) {
  const { pending, msg, run } = useAdminAction();
  const [name, setName] = React.useState(school.name);
  const [tagline, setTagline] = React.useState(school.tagline ?? "");
  const [description, setDescription] = React.useState(school.description ?? "");
  const [color, setColor] = React.useState(school.color);
  const [icon, setIcon] = React.useState(school.icon);
  const [cover, setCover] = React.useState<string | null>(school.coverImage ?? null);
  const [order, setOrder] = React.useState(school.order.toString());

  function save() {
    run(() => updateSchool(school.id, { name, tagline, description, color, icon, coverImage: cover ?? "", order: Number(order) || 0 }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
        <h2 className="mb-4 font-display text-base font-bold text-navy">Identité de l'école</h2>
        <div className="space-y-4">
          <FieldLabel label="Nom" required>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </FieldLabel>
          <FieldLabel label="Accroche">
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputClass} placeholder="Une phrase qui résume l'école" />
          </FieldLabel>
          <FieldLabel label="Description" hint="Markdown accepté.">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={cn(textareaClass, "min-h-[130px]")} />
          </FieldLabel>
          <div className="grid grid-cols-2 gap-4">
            <FieldLabel label="Couleur" hint="Teinte signature de l'école.">
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-navy/10 bg-surface-primary p-1" aria-label="Choisir une couleur" />
                <input value={color} onChange={(e) => setColor(e.target.value)} className={inputClass} />
              </div>
            </FieldLabel>
            <FieldLabel label="Icône" hint="Nom d'icône Lucide (ex. graduation-cap).">
              <input value={icon} onChange={(e) => setIcon(e.target.value)} className={inputClass} />
            </FieldLabel>
          </div>
          <FieldLabel label="Ordre d'affichage" hint="Plus petit = affiché en premier.">
            <input type="number" min={0} value={order} onChange={(e) => setOrder(e.target.value)} className={cn(inputClass, "max-w-[140px]")} />
          </FieldLabel>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-4 font-display text-base font-bold text-navy">Couverture</h2>
          <ImageUpload value={cover} onChange={setCover} folder="schools" aspect="16 / 9" />
        </div>
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-3 font-display text-base font-bold text-navy">Aperçu</h2>
          <div className="overflow-hidden rounded-xl border border-navy/[0.08]">
            <div className="h-2" style={{ background: color }} />
            <div className="flex items-center gap-3 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: color }}><Palette size={18} /></span>
              <div className="min-w-0">
                <p className="truncate font-display font-bold text-navy">{name || "Nom de l'école"}</p>
                {tagline && <p className="truncate text-xs text-text-secondary">{tagline}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-xl border border-navy/[0.07] bg-surface-primary/95 px-4 py-3 shadow-lg backdrop-blur">
          <Feedback msg={msg} />
          <SaveButton pending={pending} onClick={save}>Enregistrer l'identité</SaveButton>
        </div>
      </div>
    </div>
  );
}

function AttachmentsTab({ school, courses, paths }: { school: SchoolAdmin; courses: CatalogueCourse[]; paths: CataloguePath[] }) {
  const { pending, msg, run } = useAdminAction();
  const [cq, setCq] = React.useState("");
  const [pq, setPq] = React.useState("");

  const attachedCourses = new Map(school.courses.map((sc) => [sc.course.id, sc]));
  const attachedPaths = new Map(school.careerPaths.map((sp) => [sp.careerPath.id, sp]));

  const filteredCourses = courses.filter((c) => c.title.toLowerCase().includes(cq.trim().toLowerCase()));
  const filteredPaths = paths.filter((p) => p.title.toLowerCase().includes(pq.trim().toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end"><Feedback msg={msg} /></div>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formations */}
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-navy"><BookOpen size={17} className="text-brand-blue-royal" /> Formations</h2>
          <p className="mb-3 text-sm text-text-secondary">Cochez pour rattacher. Marquez l'école <strong>principale</strong> (unique) et mettez en <strong>vedette</strong>.</p>
          <div className="relative mb-3">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
            <input value={cq} onChange={(e) => setCq(e.target.value)} placeholder="Rechercher une formation…" className={cn(inputClass, "pl-9")} />
          </div>
          <div className="max-h-[480px] space-y-2 overflow-y-auto">
            {filteredCourses.length === 0 && <p className="py-4 text-center text-sm text-text-muted">Aucune formation.</p>}
            {filteredCourses.map((c) => {
              const link = attachedCourses.get(c.id);
              const isAttached = !!link;
              return (
                <div key={c.id} className={cn("rounded-xl border p-3 transition-colors", isAttached ? "border-brand-blue-vif/30 bg-brand-blue-vif/[0.04]" : "border-navy/[0.08]")}>
                  <div className="flex items-center gap-2.5">
                    <button type="button" disabled={pending} onClick={() => run(() => (isAttached ? detachCourseFromSchool(school.id, c.id) : attachCourseToSchool({ schoolId: school.id, courseId: c.id })))} aria-label={isAttached ? "Détacher" : "Rattacher"} className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors", isAttached ? "border-transparent bg-gradient-da text-white" : "border-navy/20 text-transparent")}>
                      <CheckCircle2 size={14} />
                    </button>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">{c.title}</span>
                    <StatusPill label={CONTENT_STATUS_LABEL[c.status as keyof typeof CONTENT_STATUS_LABEL] ?? c.status} tone={CONTENT_STATUS_TONE[c.status as keyof typeof CONTENT_STATUS_TONE] ?? "neutral"} />
                  </div>
                  {isAttached && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 pl-8">
                      <button type="button" disabled={pending || link?.isPrimary} onClick={() => run(() => attachCourseToSchool({ schoolId: school.id, courseId: c.id, isPrimary: true }))} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors", link?.isPrimary ? "bg-gradient-da text-white" : "border border-navy/10 text-text-secondary hover:border-brand-blue-vif/40 hover:text-brand-blue-royal")}>
                        <Star size={11} className={link?.isPrimary ? "fill-white" : ""} /> {link?.isPrimary ? "Principale" : "Définir principale"}
                      </button>
                      <button type="button" disabled={pending} onClick={() => run(() => attachCourseToSchool({ schoolId: school.id, courseId: c.id, isFeatured: !link?.isFeatured }))} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors", link?.isFeatured ? "bg-accent/15 text-accent" : "border border-navy/10 text-text-secondary hover:border-accent/40 hover:text-accent")}>
                        <Sparkles size={11} /> {link?.isFeatured ? "En vedette" : "Mettre en vedette"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Parcours */}
        <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
          <h2 className="mb-1 flex items-center gap-2 font-display text-base font-bold text-navy"><Route size={17} className="text-brand-violet" /> Parcours métiers</h2>
          <p className="mb-3 text-sm text-text-secondary">Cochez pour rattacher. Une école <strong>principale</strong> peut être désignée.</p>
          <div className="relative mb-3">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
            <input value={pq} onChange={(e) => setPq(e.target.value)} placeholder="Rechercher un parcours…" className={cn(inputClass, "pl-9")} />
          </div>
          <div className="max-h-[480px] space-y-2 overflow-y-auto">
            {filteredPaths.length === 0 && <p className="py-4 text-center text-sm text-text-muted">Aucun parcours.</p>}
            {filteredPaths.map((p) => {
              const link = attachedPaths.get(p.id);
              const isAttached = !!link;
              return (
                <div key={p.id} className={cn("rounded-xl border p-3 transition-colors", isAttached ? "border-brand-violet/30 bg-brand-violet/[0.04]" : "border-navy/[0.08]")}>
                  <div className="flex items-center gap-2.5">
                    <button type="button" disabled={pending} onClick={() => run(() => (isAttached ? detachCareerPathFromSchool(school.id, p.id) : attachCareerPathToSchool({ schoolId: school.id, careerPathId: p.id })))} aria-label={isAttached ? "Détacher" : "Rattacher"} className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors", isAttached ? "border-transparent bg-gradient-da text-white" : "border-navy/20 text-transparent")}>
                      <CheckCircle2 size={14} />
                    </button>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-navy">{p.title}</span>
                      <span className="block truncate text-xs text-text-muted">{p.targetJob}</span>
                    </span>
                  </div>
                  {isAttached && (
                    <div className="mt-2 pl-8">
                      <button type="button" disabled={pending || link?.isPrimary} onClick={() => run(() => attachCareerPathToSchool({ schoolId: school.id, careerPathId: p.id, isPrimary: true }))} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors", link?.isPrimary ? "bg-gradient-da text-white" : "border border-navy/10 text-text-secondary hover:border-brand-violet/40 hover:text-brand-violet")}>
                        <Star size={11} className={link?.isPrimary ? "fill-white" : ""} /> {link?.isPrimary ? "École principale" : "Définir principale"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
