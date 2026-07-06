"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Check, Loader2, Save } from "lucide-react";
import { cn, buttonClasses } from "@da/ui";
import type { NotificationPrefs } from "@/lib/notification-queries";
import { updateNotificationPrefs } from "@/lib/notification-actions";
import { NOTIF_TYPE_ORDER, notifMeta } from "./notification-meta";

/* ══════════════════════════════════════════════════════════════════════════
   Préférences de notification — deux interrupteurs par type (in-app / email).
   Par défaut activé si la préférence n'est pas explicitement à false.
   « Enregistrer » construit un payload complet et appelle l'action serveur.
   ══════════════════════════════════════════════════════════════════════════ */

type Channel = "inApp" | "email";
type State = Record<string, { inApp: boolean; email: boolean }>;

function buildInitialState(prefs: NotificationPrefs): State {
  const state: State = {};
  for (const type of NOTIF_TYPE_ORDER) {
    state[type] = {
      inApp: prefs?.inApp?.[type] !== false,
      email: prefs?.email?.[type] !== false,
    };
  }
  return state;
}

/* ── Interrupteur brandé (piste dégradée quand actif) ─────────────────────── */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-vif focus-visible:ring-offset-2",
        checked ? "bg-gradient-da" : "bg-navy/15",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn(
          "inline-block rounded-full bg-white shadow-sm",
          checked ? "ml-auto mr-[3px]" : "ml-[3px]",
        )}
        style={{ height: 18, width: 18 }}
      />
    </button>
  );
}

export function PreferencesForm({ prefs }: { prefs: NotificationPrefs }) {
  const router = useRouter();
  const [state, setState] = React.useState<State>(() =>
    buildInitialState(prefs),
  );
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const savedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  function set(type: string, channel: Channel, value: boolean) {
    setState((prev) => ({
      ...prev,
      [type]: { ...prev[type], [channel]: value },
    }));
    setSaved(false);
    setError(null);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);

    const inApp: Record<string, boolean> = {};
    const email: Record<string, boolean> = {};
    for (const type of NOTIF_TYPE_ORDER) {
      inApp[type] = state[type].inApp;
      email[type] = state[type].email;
    }

    const res = await updateNotificationPrefs({ inApp, email });
    setSaving(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSaved(true);
    router.refresh();
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 3500);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-navy/[0.08] bg-surface-primary">
      {/* En-tête de tableau — masqué sur mobile (les libellés de canal sont en ligne) */}
      <div className="hidden items-center gap-4 border-b border-navy/[0.06] px-6 py-3.5 sm:flex">
        <span className="flex-1 text-xs font-bold uppercase tracking-[0.14em] text-text-muted">
          Type de notification
        </span>
        <span className="w-16 text-center text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
          In-app
        </span>
        <span className="w-16 text-center text-xs font-bold uppercase tracking-[0.12em] text-text-muted">
          E-mail
        </span>
      </div>

      {/* Lignes */}
      <ul className="divide-y divide-navy/[0.06]">
        {NOTIF_TYPE_ORDER.map((type) => {
          const meta = notifMeta(type);
          const Icon = meta.Icon;
          const row = state[type];
          return (
            <li
              key={type}
              className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
            >
              {/* Libellé du type */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                    meta.tone,
                  )}
                >
                  <Icon size={16} aria-hidden />
                </span>
                <span className="truncate text-sm font-semibold text-navy">
                  {meta.label}
                </span>
              </div>

              {/* Interrupteurs — libellés inline sur mobile, alignés en colonnes sur desktop */}
              <div className="flex items-center gap-6 pl-12 sm:gap-0 sm:pl-0">
                <label className="flex items-center gap-2 sm:w-16 sm:justify-center">
                  <span className="text-xs font-semibold text-text-secondary sm:hidden">
                    In-app
                  </span>
                  <Toggle
                    checked={row.inApp}
                    onChange={(v) => set(type, "inApp", v)}
                    label={`Notifications in-app — ${meta.label}`}
                  />
                </label>
                <label className="flex items-center gap-2 sm:w-16 sm:justify-center">
                  <span className="text-xs font-semibold text-text-secondary sm:hidden">
                    E-mail
                  </span>
                  <Toggle
                    checked={row.email}
                    onChange={(v) => set(type, "email", v)}
                    label={`Notifications e-mail — ${meta.label}`}
                  />
                </label>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Pied — enregistrer + feedback */}
      <div className="flex flex-col gap-3 border-t border-navy/[0.06] bg-surface-secondary/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-h-[1.25rem] text-sm" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {error ? (
              <motion.span
                key="err"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5 font-medium text-error"
              >
                <AlertCircle size={15} aria-hidden />
                {error}
              </motion.span>
            ) : saved ? (
              <motion.span
                key="ok"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5 font-medium text-success"
              >
                <Check size={15} aria-hidden />
                Préférences enregistrées
              </motion.span>
            ) : (
              <span key="ph" className="text-text-muted">
                Vos choix s&apos;appliquent immédiatement après enregistrement.
              </span>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          type="button"
          onClick={handleSave}
          disabled={saving}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className={buttonClasses({
            variant: "primary",
            size: "md",
            className: "w-full sm:w-auto",
          })}
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" aria-hidden />
          ) : (
            <Save size={16} aria-hidden />
          )}
          Enregistrer
        </motion.button>
      </div>
    </div>
  );
}
