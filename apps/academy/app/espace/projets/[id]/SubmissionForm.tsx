"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Link2, ImagePlus, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Field, Input, Textarea } from "@da/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { submitProject } from "@/lib/learn-actions";

/* Formulaire de soumission d'un projet (§19.3) — texte + liens + captures,
   dépôt versionné via l'action serveur submitProject. */

interface FileEntry {
  name: string;
  url: string;
}

export function SubmissionForm({ projectId, nextAttempt }: { projectId: string; nextAttempt: number }) {
  const router = useRouter();
  const [content, setContent] = React.useState("");
  const [links, setLinks] = React.useState<string[]>([""]);
  const [files, setFiles] = React.useState<FileEntry[]>([]);
  const [uploadKey, setUploadKey] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  function updateLink(index: number, value: string) {
    setLinks((prev) => prev.map((l, i) => (i === index ? value : l)));
  }
  function addLink() {
    setLinks((prev) => [...prev, ""]);
  }
  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  function addFile(url: string | null) {
    if (!url) return;
    setFiles((prev) => [...prev, { name: `Capture ${prev.length + 1}`, url }]);
    setUploadKey((k) => k + 1); // remonte l'uploader pour un nouvel envoi
  }
  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const cleanLinks = links.map((l) => l.trim()).filter(Boolean);
    const res = await submitProject(projectId, {
      content: content.trim(),
      links: cleanLinks,
      files,
    });
    setPending(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-success/30 bg-success/5 p-6 text-center"
      >
        <CheckCircle2 size={36} className="mx-auto text-success" aria-hidden />
        <h3 className="mt-3 font-display text-lg font-bold text-navy">Livrable déposé</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Votre soumission (tentative {nextAttempt}) est en attente de correction. Vous serez notifié(e) du résultat.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2.5 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error"
            role="alert"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <Field label="Présentation de votre travail" htmlFor="content" required>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder="Expliquez votre démarche, vos choix, ce que vous avez réalisé…"
          required
        />
      </Field>

      {/* Liens */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-navy">
          Liens <span className="font-normal text-text-muted">(GitHub, démo, vidéo, portfolio…)</span>
        </label>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Link2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
                <Input
                  type="url"
                  value={link}
                  onChange={(e) => updateLink(i, e.target.value)}
                  placeholder="https://…"
                  className="pl-9"
                />
              </div>
              {links.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLink(i)}
                  aria-label="Retirer ce lien"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-navy/10 text-text-muted transition-colors hover:border-error/40 hover:text-error"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLink}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-royal hover:text-brand-violet"
        >
          <Plus size={14} aria-hidden />
          Ajouter un lien
        </button>
      </div>

      {/* Captures */}
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-navy">
          Captures d&apos;écran <span className="font-normal text-text-muted">(optionnel)</span>
        </label>
        {files.length > 0 && (
          <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {files.map((f, i) => (
              <div key={i} className="group relative overflow-hidden rounded-lg border border-navy/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={f.name} className="aspect-square w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  aria-label="Retirer la capture"
                  className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-navy/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <ImageUpload
          key={uploadKey}
          value={null}
          onChange={addFile}
          folder="submissions"
          aspect="16 / 6"
          hint="Ajoutez une capture — PNG, JPG ou WebP (5 Mo max)"
        />
        <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-text-muted">
          <ImagePlus size={12} aria-hidden />
          Chaque image envoyée s&apos;ajoute à la liste ci-dessus.
        </p>
      </div>

      <Button type="submit" size="lg" loading={pending} className="w-full sm:w-auto">
        <Send size={16} aria-hidden />
        Déposer ma soumission (tentative {nextAttempt})
      </Button>
    </form>
  );
}
