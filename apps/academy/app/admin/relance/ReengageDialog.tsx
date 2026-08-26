"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Sparkles, X, Mail, Bell, Send, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button, Field, Input, Textarea, cn } from "@da/ui";
import { generateReengagementDraft, sendReengagement, type DraftCourse } from "@/lib/reengagement-actions";

type Channel = "BOTH" | "EMAIL" | "IN_APP";

export function ReengageDialog({ userId, userName, userEmail }: { userId: string; userName: string; userEmail: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const [loading, setLoading] = React.useState(false);
  const [genError, setGenError] = React.useState<string | null>(null);
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [ctaLabel, setCtaLabel] = React.useState("Découvrir le catalogue");
  const [courses, setCourses] = React.useState<DraftCourse[]>([]);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [channel, setChannel] = React.useState<Channel>("BOTH");
  const [emailVerified, setEmailVerified] = React.useState(true);

  const [sending, setSending] = React.useState(false);
  const [result, setResult] = React.useState<{ ok: boolean; text: string } | null>(null);

  const generate = React.useCallback(async () => {
    setLoading(true);
    setGenError(null);
    setResult(null);
    const res = await generateReengagementDraft(userId);
    setLoading(false);
    if (!res.ok) {
      setGenError(res.error ?? "La génération a échoué.");
      return;
    }
    setSubject(res.subject ?? "");
    setMessage(res.message ?? "");
    setCtaLabel(res.ctaLabel ?? "Découvrir le catalogue");
    setCourses(res.courses ?? []);
    setSelected(new Set((res.courses ?? []).map((c) => c.slug)));
    setEmailVerified(res.emailVerified ?? true);
  }, [userId]);

  function openDialog() {
    setOpen(true);
    setResult(null);
    setGenError(null);
    if (!subject && !loading) void generate();
  }

  function toggleCourse(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function send() {
    setSending(true);
    setResult(null);
    const res = await sendReengagement({
      userId,
      subject,
      message,
      ctaLabel,
      courseSlugs: courses.filter((c) => selected.has(c.slug)).map((c) => c.slug),
      channel,
    });
    setSending(false);
    if (res.ok) {
      setResult({ ok: true, text: res.message ?? "Relance envoyée." });
      router.refresh();
    } else {
      setResult({ ok: false, text: res.error ?? "Échec de l'envoi." });
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-da px-3.5 py-2 text-xs font-semibold text-white shadow-brand transition-transform active:scale-[0.98]"
      >
        <Sparkles size={14} aria-hidden />
        Relancer
      </button>

      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-navy/50 p-4 backdrop-blur-sm sm:items-center">
            <div className="my-8 w-full max-w-xl rounded-2xl border border-navy/[0.08] bg-surface-primary shadow-2xl">
              {/* En-tête */}
              <div className="flex items-start justify-between gap-3 border-b border-navy/[0.06] p-5">
                <div className="min-w-0">
                  <h2 className="inline-flex items-center gap-2 font-display text-lg font-bold text-navy">
                    <Sparkles size={18} className="text-brand-violet" aria-hidden />
                    Relance de {userName}
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-text-muted">{userEmail}</p>
                </div>
                <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-text-muted transition-colors hover:bg-navy/[0.05] hover:text-navy">
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">
                {loading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
                    <Loader2 size={30} className="animate-spin text-brand-violet" aria-hidden />
                    <p className="text-sm font-medium text-navy">L'IA rédige un message personnalisé…</p>
                    <p className="text-xs text-text-muted">Analyse du profil et sélection des formations pertinentes.</p>
                  </div>
                ) : genError ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2.5 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden />
                      {genError}
                    </div>
                    <Button type="button" variant="outline" onClick={() => void generate()}>
                      <RefreshCw size={15} aria-hidden /> Réessayer
                    </Button>
                  </div>
                ) : (
                  <>
                    {!emailVerified && (
                      <p className="flex items-start gap-2 rounded-lg bg-warning/[0.08] px-3 py-2 text-xs text-[#b45309]">
                        <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden />
                        L'email de cet utilisateur n'est pas vérifié — l'envoi email peut ne pas aboutir. La notification in-app reste possible.
                      </p>
                    )}

                    <Field label="Objet de l'email" htmlFor="re-subject">
                      <Input id="re-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={160} />
                    </Field>

                    <Field label="Message" htmlFor="re-message" hint="Rédigé par l'IA — ajustez librement. Les cartes de formations et le bouton sont ajoutés automatiquement.">
                      <Textarea id="re-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={9} />
                    </Field>

                    {courses.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-semibold text-navy">Formations recommandées</p>
                        <div className="space-y-2">
                          {courses.map((c) => (
                            <label
                              key={c.slug}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                                selected.has(c.slug) ? "border-brand-blue-vif/40 bg-brand-blue-vif/[0.04]" : "border-navy/[0.08] hover:border-navy/20",
                              )}
                            >
                              <input type="checkbox" checked={selected.has(c.slug)} onChange={() => toggleCourse(c.slug)} className="mt-1 h-4 w-4 accent-brand-violet" />
                              <span className="min-w-0">
                                <span className="block text-sm font-semibold text-navy">{c.title}</span>
                                <span className="mt-0.5 block text-xs text-text-secondary">{c.pitch}</span>
                                <span className="mt-0.5 block text-[11px] font-medium text-text-muted">{c.priceLabel}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <Field label="Libellé du bouton principal" htmlFor="re-cta">
                      <Input id="re-cta" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} maxLength={60} />
                    </Field>

                    {/* Canal */}
                    <div>
                      <p className="mb-2 text-sm font-semibold text-navy">Canal d'envoi</p>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { v: "BOTH", label: "Email + notif.", icon: <><Mail size={13} /><Bell size={13} /></> },
                          { v: "EMAIL", label: "Email", icon: <Mail size={14} /> },
                          { v: "IN_APP", label: "Notification", icon: <Bell size={14} /> },
                        ] as const).map((opt) => (
                          <button
                            key={opt.v}
                            type="button"
                            onClick={() => setChannel(opt.v)}
                            className={cn(
                              "inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-semibold transition-colors",
                              channel === opt.v ? "border-transparent bg-gradient-da text-white" : "border-navy/10 text-navy/70 hover:border-brand-blue-vif/40",
                            )}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {result && (
                      <div className={cn("flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium", result.ok ? "border-success/30 bg-success/5 text-success" : "border-error/30 bg-error/5 text-error")}>
                        {result.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
                        {result.text}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Pied */}
              {!loading && !genError && (
                <div className="flex items-center justify-between gap-3 border-t border-navy/[0.06] p-5">
                  <button type="button" onClick={() => void generate()} disabled={sending} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet disabled:opacity-50">
                    <RefreshCw size={15} aria-hidden /> Régénérer
                  </button>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Fermer</Button>
                    <Button type="button" onClick={() => void send()} loading={sending} disabled={!subject || !message || (result?.ok ?? false)}>
                      <Send size={15} aria-hidden /> Envoyer
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
