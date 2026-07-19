"use client";

import * as React from "react";
import { upload } from "@vercel/blob/client";
import { UploadCloud, Loader2, X, RefreshCw, FileText, Link2, FileUp } from "lucide-react";
import { cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Uploader d'asset de leçon (PDF, PPTX, audio…) → Vercel Blob en upload CÔTÉ
   CLIENT (multipart, pas de limite 4,5 Mo). Deux modes : envoyer un fichier,
   ou coller une URL existante (Drive, Slides, PDF hébergé…). Contrôlé :
   value = URL (ou null). Identité DA (dégradé, pas de dropzone générique).
   ══════════════════════════════════════════════════════════════════════════ */

function fileNameFromUrl(url: string): string {
  try {
    const p = new URL(url).pathname;
    const raw = decodeURIComponent(p.split("/").pop() || url);
    // Retire le suffixe aléatoire ajouté par Blob (…-a1b2c3d4).
    return raw.replace(/-[a-z0-9]{20,}(?=\.[a-z0-9]+$)/i, "");
  } catch {
    return url;
  }
}

function sanitizeName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "fichier"
  );
}

export function FileUpload({
  value,
  onChange,
  accept,
  hint = "PDF, PPTX, DOCX… — 100 Mo max",
  folder = "lessons",
  icon: Icon = FileText,
  className,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  /** Filtre du sélecteur natif (ex. ".pdf,.pptx" ou "audio/*"). */
  accept?: string;
  hint?: string;
  folder?: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  className?: string;
}) {
  const [mode, setMode] = React.useState<"upload" | "url">("upload");
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [urlDraft, setUrlDraft] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const doUpload = React.useCallback(
    async (file: File) => {
      setError(null);
      if (file.size > 100 * 1024 * 1024) {
        setError("Fichier trop lourd (100 Mo maximum).");
        return;
      }
      setUploading(true);
      setProgress(0);
      try {
        const blob = await upload(`academy/${folder}/${sanitizeName(file.name)}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload/asset",
          onUploadProgress: (e) => setProgress(Math.round(e.percentage)),
        });
        onChange(blob.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'envoi. Réessayez.");
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange],
  );

  /* ── Asset présent : carte compacte avec remplacer / retirer ── */
  if (value) {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doUpload(f);
            e.target.value = "";
          }}
        />
        <div className="flex items-center gap-3 rounded-xl border border-brand-blue-vif/25 bg-brand-blue-vif/[0.04] p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-da text-white shadow-brand">
            <Icon size={18} />
          </span>
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-sm font-semibold text-navy hover:text-brand-blue-royal"
            title={value}
          >
            {fileNameFromUrl(value)}
          </a>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-brand-blue-royal disabled:opacity-50"
            aria-label="Remplacer le fichier"
          >
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              onChange(null);
            }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-error/10 hover:text-error"
            aria-label="Retirer le fichier"
          >
            <X size={15} />
          </button>
        </div>
        {uploading && <ProgressBar progress={progress} />}
        {error && <p className="mt-1.5 text-xs font-medium text-error">{error}</p>}
      </div>
    );
  }

  /* ── Aucun asset : bascule Envoyer / Coller une URL ── */
  return (
    <div className={className}>
      <div className="mb-2 inline-flex gap-1 rounded-lg bg-navy/[0.04] p-0.5">
        {(["upload", "url"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
              mode === m ? "bg-surface-primary text-brand-blue-royal shadow-sm" : "text-text-secondary hover:text-navy",
            )}
          >
            {m === "upload" ? <FileUp size={12} /> : <Link2 size={12} />}
            {m === "upload" ? "Envoyer un fichier" : "Coller une URL"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void doUpload(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy/15 bg-surface-secondary/50 px-4 py-6 text-center transition-colors",
              "hover:border-brand-blue-vif/50 hover:bg-brand-blue-vif/[0.03] disabled:cursor-not-allowed disabled:opacity-70",
            )}
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-da text-white shadow-brand">
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
            </span>
            <span className="text-sm font-semibold text-navy">
              {uploading ? `Envoi en cours… ${progress}%` : "Cliquez pour choisir un fichier"}
            </span>
            <span className="text-xs text-text-muted">{hint}</span>
          </button>
          {uploading && <ProgressBar progress={progress} />}
        </>
      ) : (
        <div className="flex gap-2">
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://…"
            className="min-w-0 flex-1 rounded-lg border border-navy/12 bg-surface-primary px-3 py-2 text-sm text-navy outline-none transition-colors focus:border-brand-blue-vif focus:ring-2 focus:ring-brand-blue-vif/20"
          />
          <button
            type="button"
            disabled={!/^https?:\/\//i.test(urlDraft.trim())}
            onClick={() => {
              onChange(urlDraft.trim());
              setUrlDraft("");
            }}
            className="shrink-0 rounded-lg bg-gradient-da px-3.5 py-2 text-sm font-semibold text-white shadow-brand transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Valider
          </button>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs font-medium text-error">{error}</p>}
    </div>
  );
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-navy/[0.08]">
      <div
        className="h-full rounded-full bg-gradient-da transition-[width] duration-200"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
