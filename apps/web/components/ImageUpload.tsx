"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, X, RefreshCw, ImageOff, Loader2, Camera } from "lucide-react";
import { cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Uploader d'image drag-and-drop → Vercel Blob (via /api/upload).
   Deux variantes : "dropzone" (couvertures larges) et "avatar" (cercle compact
   avec initiales par défaut). Contrôlé : value = URL (ou null).
   ══════════════════════════════════════════════════════════════════════════ */

function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function ImageUpload({
  value,
  onChange,
  folder = "uploads",
  hint = "PNG, JPG ou WebP — 5 Mo max",
  aspect = "16 / 9",
  rounded = "rounded-2xl",
  className,
  variant = "dropzone",
  fallback,
  size = 132,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder?: string;
  hint?: string;
  aspect?: string;
  rounded?: string;
  className?: string;
  variant?: "dropzone" | "avatar";
  fallback?: string;
  size?: number;
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

  const openPicker = () => inputRef.current?.click();

  const fileInput = (
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
  );

  const errorNode = (
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
  );

  /* ══════════════════════════ Variante AVATAR ══════════════════════════ */
  if (variant === "avatar") {
    return (
      <div className={cn("flex flex-col items-center", className)}>
        {fileInput}
        <button
          type="button"
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={uploading}
          aria-label="Changer la photo de profil"
          className={cn(
            "group relative shrink-0 overflow-hidden rounded-full ring-2 ring-offset-2 ring-offset-surface-primary transition-all",
            dragging ? "ring-brand-blue-vif" : "ring-navy/10 hover:ring-brand-blue-vif/50",
          )}
          style={{ width: size, height: size }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Photo de profil" className="h-full w-full object-cover" />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center bg-gradient-da font-display font-extrabold text-white"
              style={{ fontSize: size * 0.34 }}
            >
              {initials(fallback)}
            </span>
          )}
          <span
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center gap-1 bg-navy/45 text-white transition-opacity",
              uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            {uploading ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <>
                <Camera size={20} />
                <span className="text-[11px] font-semibold">Modifier</span>
              </>
            )}
          </span>
        </button>

        <div className="mt-3 flex flex-col items-center gap-0.5 text-center">
          <button
            type="button"
            onClick={openPicker}
            disabled={uploading}
            className="text-xs font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
          >
            {value ? "Changer la photo" : "Ajouter une photo"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                setError(null);
                onChange(null);
              }}
              className="text-[11px] font-medium text-text-muted transition-colors hover:text-error"
            >
              Retirer
            </button>
          )}
          {!error && <span className="text-[11px] text-text-muted">{hint}</span>}
        </div>
        {errorNode}
      </div>
    );
  }

  /* ═════════════════════════ Variante DROPZONE ═════════════════════════ */
  return (
    <div className={className}>
      {fileInput}

      {value ? (
        <div
          className={cn("group relative overflow-hidden border border-navy/[0.08]", rounded)}
          style={{ aspectRatio: aspect }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Aperçu de l'image" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-navy/45 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={openPicker}
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
        <button
          type="button"
          onClick={openPicker}
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
            {uploading ? <Loader2 size={22} className="animate-spin" /> : <UploadCloud size={22} />}
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
      {errorNode}
    </div>
  );
}
