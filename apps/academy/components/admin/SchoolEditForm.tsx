"use client";

import * as React from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button, Input, Textarea, Field, cn } from "@da/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { AdminCard } from "@/components/admin/ui";
import { updateSchool } from "@/lib/admin-actions";
import type { AdminSchoolEdit } from "@/lib/admin-types";

const DEFAULT_COLOR = "#5B3FA8";

/* ══════════════════════════════════════════════════════════════════════════
   Formulaire d'édition d'une école — tous les champs modifiables.
   updateSchool → toast de succès brandé (portail, auto-dismiss).
   ══════════════════════════════════════════════════════════════════════════ */

export function SchoolEditForm({ school }: { school: AdminSchoolEdit }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  const [name, setName] = React.useState(school.name);
  const [shortDescription, setShortDescription] = React.useState(school.shortDescription ?? "");
  const [longDescription, setLongDescription] = React.useState(school.longDescription ?? "");
  const [icon, setIcon] = React.useState(school.icon ?? "");
  const [color, setColor] = React.useState(school.color ?? DEFAULT_COLOR);
  const [image, setImage] = React.useState<string | null>(school.image ?? null);
  const [order, setOrder] = React.useState(String(school.order ?? 0));

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateSchool(school.id, {
        name,
        shortDescription,
        longDescription: longDescription || undefined,
        icon: icon || undefined,
        color: color || undefined,
        image: image || undefined,
        order: Number(order),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setToast(true);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      {/* Colonne principale */}
      <div className="flex flex-col gap-6 lg:col-span-2">
        <AdminCard title="Informations">
          <div className="space-y-5">
            <Field label="Nom de l'école" htmlFor="name" required>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
            </Field>

            <Field label="Description courte" htmlFor="short" hint="Affichée dans les cartes du catalogue.">
              <Textarea
                id="short"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                maxLength={300}
                className="min-h-20"
              />
            </Field>

            <Field label="Description longue" htmlFor="long" hint="Présentation détaillée sur la page de l'école.">
              <Textarea
                id="long"
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
                maxLength={4000}
                className="min-h-40"
              />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Image de couverture">
          <ImageUpload
            value={image}
            onChange={setImage}
            folder="schools"
            aspect="16 / 9"
            hint="PNG, JPG ou WebP — 5 Mo max. Idéalement 1600 × 900."
          />
        </AdminCard>
      </div>

      {/* Colonne latérale */}
      <div className="flex flex-col gap-6">
        <AdminCard title="Apparence">
          <div className="space-y-5">
            <Field label="Icône" htmlFor="icon" hint="Nom d'icône (ex. code, palette…).">
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="graduation-cap"
                maxLength={40}
                className="font-mono"
              />
            </Field>

            <Field label="Couleur" htmlFor="color">
              <div className="flex items-center gap-2.5">
                <input
                  id="color"
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_COLOR}
                  onChange={(e) => setColor(e.target.value)}
                  aria-label="Sélecteur de couleur"
                  className="h-11 w-12 shrink-0 cursor-pointer rounded-lg border border-navy/15 bg-surface-primary p-1"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#5B3FA8"
                  maxLength={20}
                  className="font-mono uppercase"
                />
              </div>
            </Field>

            <Field label="Ordre d'affichage" htmlFor="order" hint="Position dans la liste (croissant).">
              <Input
                id="order"
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="font-mono"
              />
            </Field>
          </div>
        </AdminCard>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-error/20 bg-error/[0.06] px-3.5 py-2.5 text-sm text-error">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" loading={pending} className="w-full sm:w-auto">
            Enregistrer les modifications
          </Button>
          <Link
            href="/admin/ecoles"
            className={cn(
              "inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-text-secondary transition-colors hover:text-brand-blue-royal",
              pending && "pointer-events-none opacity-50",
            )}
          >
            <ArrowLeft size={15} />
            Retour aux écoles
          </Link>
        </div>
      </div>

      {/* Toast de succès */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 24, x: "-50%" }}
                animate={{ opacity: 1, y: 0, x: "-50%" }}
                exit={{ opacity: 0, y: 24, x: "-50%" }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                role="status"
                className="fixed bottom-6 left-1/2 z-[130] flex items-center gap-2.5 rounded-full border border-success/20 bg-surface-primary px-4 py-2.5 shadow-2xl"
              >
                <CheckCircle2 size={18} className="text-success" />
                <span className="text-sm font-semibold text-navy">École enregistrée</span>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </form>
  );
}
