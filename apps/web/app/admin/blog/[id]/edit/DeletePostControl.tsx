"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Trash2, Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { deleteBlogPost } from "@/lib/admin-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Suppression définitive d'un article (confirmation en deux temps).
   Succès → router.push('/admin/blog'). Échec → affiche res.error.
   ══════════════════════════════════════════════════════════════════════════ */

export function DeletePostControl({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [confirming, setConfirming] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const remove = () => {
    setError(null);
    setDeleting(true);
    startTransition(async () => {
      const res = await deleteBlogPost({ id });
      if (res.ok) {
        router.push("/admin/blog");
      } else {
        setDeleting(false);
        setConfirming(false);
        setError(res.error);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-error/20 bg-error/[0.03] p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-sm font-bold text-navy">Zone dangereuse</h2>
        <p className="text-xs text-text-secondary">
          La suppression d’un article est définitive et irréversible.
        </p>
      </div>

      <div className="mt-4">
        <AnimatePresence mode="wait" initial={false}>
          {confirming ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-navy">
                <AlertTriangle className="h-4 w-4 shrink-0 text-error" />
                Supprimer définitivement « {title} » ?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={remove}
                  disabled={pending}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-error px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Oui, supprimer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={pending}
                  className="rounded-lg border border-navy/[0.12] px-3.5 py-2 text-sm font-semibold text-navy transition-colors hover:bg-navy/[0.04] disabled:opacity-50"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="trigger"
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-error/30 px-3.5 py-2 text-sm font-semibold text-error transition-colors hover:bg-error/10"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer cet article
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 flex items-start gap-1.5 text-xs font-medium text-error"
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
