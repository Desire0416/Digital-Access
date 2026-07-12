"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BadgeCheck, Undo2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@da/ui";
import { publishProjectToPortfolio, unpublishProjectFromPortfolio } from "@/lib/portfolio-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Bouton « Publier au portfolio » / « Retirer du portfolio » (§19.5).
   Publie une soumission VALIDÉE (idempotent côté serveur) puis rafraîchit.
   ══════════════════════════════════════════════════════════════════════════ */

export function PublishProjectButton({
  submissionId,
  isPublished,
}: {
  submissionId: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function toggle() {
    setError(null);
    setPending(true);
    const res = isPublished
      ? await unpublishProjectFromPortfolio(submissionId)
      : await publishProjectToPortfolio(submissionId);
    setPending(false);
    if (res && res.ok === false) {
      setError(res.error ?? "Action impossible pour le moment.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-transform active:scale-95 disabled:opacity-60",
          isPublished
            ? "border border-navy/10 bg-surface-primary text-navy hover:bg-navy/[0.04]"
            : "bg-gradient-da text-white shadow-brand hover:scale-[1.02]",
        )}
      >
        {pending ? (
          <Loader2 size={15} className="animate-spin" aria-hidden />
        ) : isPublished ? (
          <Undo2 size={15} aria-hidden />
        ) : (
          <BadgeCheck size={15} aria-hidden />
        )}
        {isPublished ? "Retirer du portfolio" : "Publier au portfolio"}
      </button>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-error"
            role="alert"
          >
            <AlertCircle size={13} aria-hidden />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {!error && (
        <p className="mt-2 text-center text-[11px] text-text-muted">
          {isPublished ? "Ce projet apparaît sur votre portfolio public." : "Valorisez ce projet réussi sur votre portfolio."}
        </p>
      )}
    </div>
  );
}
