"use client";

import * as React from "react";
import { Copy, Check, Code2, Info, Monitor, Smartphone } from "lucide-react";
import { Field, Input, Button, cn } from "@da/ui";
import {
  buildSignatureHtml,
  buildSignatureText,
  suggestedEmailForPoste,
  SUGGESTED_EMAILS,
  SIGNATURE_ROLES,
  type SignatureInput,
} from "@/lib/email-signature";

type Copied = null | "rich" | "html";

export function SignatureGenerator() {
  const [form, setForm] = React.useState<SignatureInput>(() => ({
    name: "",
    poste: "Commercial",
    email: suggestedEmailForPoste("Commercial"),
    phone: "",
  }));
  // L'email reste « auto » tant que l'utilisateur ne saisit pas une adresse perso.
  const [emailAuto, setEmailAuto] = React.useState(true);
  const [copied, setCopied] = React.useState<Copied>(null);
  const [error, setError] = React.useState<string | null>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);

  const html = buildSignatureHtml(form);

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(null), 2200);
    return () => clearTimeout(t);
  }, [copied]);

  function pickPoste(role: string) {
    setForm((f) => ({
      ...f,
      poste: role,
      ...(emailAuto ? { email: suggestedEmailForPoste(role) } : {}),
    }));
  }

  function onEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    const t = v.trim();
    setEmailAuto(t === "" || SUGGESTED_EMAILS.includes(t));
    setForm((f) => ({ ...f, email: v }));
  }

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

  const set = (k: keyof SignatureInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,25rem)_minmax(0,1fr)]">
      {/* ── Formulaire ── */}
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-navy/[0.08] bg-surface-primary p-6">
          <h2 className="font-display text-base font-bold text-navy">Coordonnées du collaborateur</h2>
          <p className="mt-1 text-sm text-text-secondary">
            L'aperçu se met à jour en direct. L'email est proposé selon le poste — modifiable.
          </p>

          <div className="mt-5">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-text-muted">
              Poste — raccourcis
            </span>
            <div className="flex flex-wrap gap-2">
              {SIGNATURE_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => pickPoste(role)}
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
              <Input id="sig-name" value={form.name} onChange={set("name")} placeholder="Ex. Awa Traoré" maxLength={80} />
            </Field>
            <Field label="Poste" htmlFor="sig-poste" required>
              <Input id="sig-poste" value={form.poste} onChange={set("poste")} placeholder="Ex. Responsable commercial" maxLength={80} />
            </Field>
            <Field label="Email" htmlFor="sig-email" hint="Proposé selon le poste — remplacez par l'email personnel si besoin.">
              <Input id="sig-email" type="email" value={form.email} onChange={onEmailChange} placeholder="prenom.nom@digitalaccess.ci" maxLength={160} />
            </Field>
            <Field label="Téléphone" htmlFor="sig-phone">
              <Input id="sig-phone" value={form.phone} onChange={set("phone")} placeholder="+225 07 57 90 88 84" maxLength={40} />
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
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-navy/[0.12] px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal"
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
              mise en forme (logo compris) : collez-la directement dans les réglages de signature de{" "}
              <strong>Gmail</strong> ou <strong>Outlook</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* ── Aperçus ── */}
      <div className="flex flex-col gap-7">
        {/* Desktop */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-text-muted">
            <Monitor size={15} className="text-brand-blue-royal" />
            Aperçu Desktop
          </div>
          <div className="overflow-x-auto rounded-2xl border border-navy/[0.08] bg-white p-8 shadow-sm">
            <div ref={previewRef} dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>

        {/* Mobile */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-text-muted">
            <Smartphone size={15} className="text-brand-blue-royal" />
            Aperçu Mobile
          </div>
          <div className="mx-auto w-full max-w-[380px] rounded-[1.75rem] border-[6px] border-navy/80 bg-white p-4 shadow-lg">
            <div className="overflow-x-auto">
              <div dangerouslySetInnerHTML={{ __html: html }} />
            </div>
          </div>
          <p className="mx-auto mt-2 max-w-[380px] text-center text-xs text-text-muted">
            Sur petit écran, les clients mail ajustent la signature à la largeur disponible.
          </p>
        </div>
      </div>
    </div>
  );
}
