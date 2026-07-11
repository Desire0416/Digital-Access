"use client";

import * as React from "react";
import { Copy, Check, Code2, User, Briefcase, Mail, Phone, Sparkles, Info } from "lucide-react";
import { Field, Input, Button, cn } from "@da/ui";
import {
  buildSignatureHtml,
  buildSignatureText,
  SIGNATURE_ROLES,
  type SignatureInput,
} from "@/lib/email-signature";

type Copied = null | "rich" | "html";

export function SignatureGenerator() {
  const [form, setForm] = React.useState<SignatureInput>({
    name: "",
    poste: "Commercial",
    email: "",
    phone: "",
  });
  const [copied, setCopied] = React.useState<Copied>(null);
  const [error, setError] = React.useState<string | null>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);

  const set = (k: keyof SignatureInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const html = buildSignatureHtml(form);

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  function copyDomSelection(node: HTMLElement | null): boolean {
    if (!node) return false;
    const sel = window.getSelection();
    if (!sel) return false;
    const range = document.createRange();
    range.selectNodeContents(node);
    sel.removeAllRanges();
    sel.addRange(range);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    sel.removeAllRanges();
    return ok;
  }

  async function copyRich() {
    setError(null);
    const richHtml = buildSignatureHtml(form);
    const text = buildSignatureText(form);
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": new Blob([richHtml], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" }),
          }),
        ]);
        setCopied("rich");
        return;
      }
      throw new Error("no-clipboard-write");
    } catch {
      // Repli : sélection du rendu + copie navigateur.
      if (copyDomSelection(previewRef.current)) {
        setCopied("rich");
      } else {
        setError(
          "La copie automatique a échoué. Sélectionnez la signature dans l'aperçu et copiez-la (Ctrl/Cmd + C).",
        );
      }
    }
  }

  async function copyHtmlSource() {
    setError(null);
    try {
      await navigator.clipboard.writeText(buildSignatureHtml(form));
      setCopied("html");
    } catch {
      setError("Impossible de copier le code. Réessayez.");
    }
  }

  const inputCls = "";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      {/* ── Formulaire ── */}
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-6">
          <h2 className="font-display text-base font-bold text-navy">Coordonnées du collaborateur</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Renseignez les informations : l'aperçu se met à jour en direct.
          </p>

          {/* Presets de poste */}
          <div className="mt-5">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-text-muted">
              Poste — raccourcis
            </span>
            <div className="flex flex-wrap gap-2">
              {SIGNATURE_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, poste: role }))}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    form.poste === role
                      ? "border-transparent bg-gradient-da text-white shadow-brand"
                      : "border-navy/[0.1] text-navy hover:border-brand-blue-vif/40 hover:text-brand-blue-royal",
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-5">
            <Field label="Nom complet" htmlFor="sig-name" required>
              <Input
                id="sig-name"
                value={form.name}
                onChange={set("name")}
                placeholder="Ex. Awa Traoré"
                maxLength={80}
                className={inputCls}
              />
            </Field>
            <Field label="Poste" htmlFor="sig-poste" required>
              <Input
                id="sig-poste"
                value={form.poste}
                onChange={set("poste")}
                placeholder="Ex. Responsable commercial"
                maxLength={80}
              />
            </Field>
            <Field label="Email" htmlFor="sig-email">
              <Input
                id="sig-email"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="prenom.nom@digitalaccess.ci"
                maxLength={160}
              />
            </Field>
            <Field label="Téléphone" htmlFor="sig-phone">
              <Input
                id="sig-phone"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+225 07 57 90 88 84"
                maxLength={40}
              />
            </Field>
          </div>
        </div>

        {/* Actions de copie */}
        <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={copyRich} className="flex-1">
              {copied === "rich" ? (
                <>
                  <Check size={16} /> Signature copiée
                </>
              ) : (
                <>
                  <Copy size={16} /> Copier la signature
                </>
              )}
            </Button>
            <button
              type="button"
              onClick={copyHtmlSource}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-navy/[0.12] px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal",
              )}
            >
              {copied === "html" ? (
                <>
                  <Check size={16} className="text-success" /> Code copié
                </>
              ) : (
                <>
                  <Code2 size={16} /> Copier le code HTML
                </>
              )}
            </button>
          </div>
          {error && <p className="mt-3 text-sm font-medium text-error">{error}</p>}

          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-surface-secondary/60 p-3.5 text-xs leading-relaxed text-text-secondary">
            <Info size={15} className="mt-0.5 shrink-0 text-brand-blue-royal" />
            <span>
              <strong className="font-semibold text-navy">« Copier la signature »</strong> copie la version
              mise en forme (avec le logo) : collez-la directement dans les réglages de signature de{" "}
              <strong>Gmail</strong> ou <strong>Outlook</strong>. Le bouton <strong>« Code HTML »</strong>{" "}
              copie le code source (pour un client mail qui demande du HTML).
            </span>
          </div>
        </div>
      </div>

      {/* ── Aperçu en direct ── */}
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-text-muted">
          <Sparkles size={14} className="text-brand-blue-vif" />
          Aperçu en direct
        </div>
        <div className="overflow-x-auto rounded-2xl border border-navy/[0.08] bg-white p-7 shadow-sm">
          {/* Le rendu utilise exactement le HTML qui sera copié. */}
          <div ref={previewRef} dangerouslySetInnerHTML={{ __html: html }} />
        </div>

        {/* Récapitulatif rapide des champs actifs */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          {[
            { icon: User, label: "Nom", value: form.name || "—" },
            { icon: Briefcase, label: "Poste", value: form.poste || "—" },
            { icon: Mail, label: "Email", value: form.email || "—" },
            { icon: Phone, label: "Téléphone", value: form.phone || "—" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2.5 rounded-xl border border-navy/[0.06] bg-surface-primary px-3.5 py-2.5">
              <f.icon size={15} className="shrink-0 text-text-muted" />
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-text-muted">{f.label}</span>
                <span className="block truncate text-navy">{f.value}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
