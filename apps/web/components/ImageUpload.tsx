"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, X, RefreshCw, ImageOff, Loader2 } from "lucide-react";
import { cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Uploader d'image drag-and-drop → Vercel Blob (via /api/upload).
   Glisser-déposer, clic pour parcourir, aperçu, remplacement, suppression.
   Contrôlé : value = URL de l'image (ou null), onChange renvoie la nouvelle URL.
   ══════════════════════════════════════════════════════════════════════════ */

export function ImageUpload({
  value,
  onChange,
  folder = "uploads",
  hint = "PNG, JPG ou WebP — 5 Mo max",
  aspect = "16 / 9",
  rounded = "rounded-2xl",
  className,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder?: string;
  hint?: string;
  aspect?: string;
  rounded?: string;
  className?: string;
}) {
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const upload = React.useCallback(
    async (file: File) => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Choisissez un fichier image.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image trop lourde (5 Mo maximum).");
        return;
      }
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok || !data.url) {
          setError(data.error ?? "Échec de l'envoi.");
          return;
        }
        onChange(data.url);
      } catch {
        setError("Échec de l'envoi. Vérifiez votre connexion.");
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />

      {value ? (
        /* ─── Aperçu avec actions ─── */
        <div
          className={cn("group relative overflow-hidden border border-navy/[0.08]", rounded)}
          style={{ aspectRatio: aspect }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Aperçu de l'image" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-navy/45 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-navy shadow-sm transition hover:bg-white"
            >
              <RefreshCw size={14} />
              Remplacer
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                onChange(null);
              }}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-error/90 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-error"
            >
              <X size={14} />
              Retirer
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 grid place-items-center bg-surface-primary/70">
              <Loader2 size={22} className="animate-spin text-brand-blue-royal" />
            </div>
          )}
        </div>
      ) : (
        /* ─── Zone de dépôt ─── */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 border-2 border-dashed p-8 text-center transition-colors",
            rounded,
            dragging
              ? "border-brand-blue-vif bg-brand-blue-vif/[0.06]"
              : "border-navy/15 bg-surface-secondary/50 hover:border-brand-blue-vif/50 hover:bg-brand-blue-vif/[0.03]",
          )}
          style={{ aspectRatio: aspect }}
        >
          <motion.span
            animate={dragging ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
            className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand"
          >
            {uploading ? (
              <Loader2 size={22} className="animate-spin" />
            ) : (
              <UploadCloud size={22} />
            )}
          </motion.span>
          <span className="text-sm font-semibold text-navy">
            {uploading
              ? "Envoi en cours…"
              : dragging
                ? "Déposez l'image ici"
                : "Glissez une image ou cliquez pour parcourir"}
          </span>
          <span className="text-xs text-text-muted">{hint}</span>
        </button>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-error"
          >
            <ImageOff size={13} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
