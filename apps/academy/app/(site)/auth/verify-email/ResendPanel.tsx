"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, RefreshCw } from "lucide-react";
import { Button } from "@da/ui";
import { resendVerification } from "@/app/auth/actions";

const COUNTDOWN = 120; // secondes (rate-limit : 1 renvoi / 2 min)

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ResendPanel({ email }: { email: string }) {
  const [seconds, setSeconds] = React.useState(COUNTDOWN);
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const ready = seconds <= 0;
  const progress = ((COUNTDOWN - seconds) / COUNTDOWN) * 100;

  async function handleResend() {
    if (!ready || pending || !email) return;
    setPending(true);
    setError(null);
    setSent(false);
    const result = await resendVerification(email);
    setPending(false);
    if (result.ok) {
      setSent(true);
      setSeconds(COUNTDOWN);
      setTimeout(() => setSent(false), 4000);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="mt-8">
      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-center gap-2 rounded-lg border border-success/25 bg-success/5 px-4 py-3 text-sm font-medium text-success"
          >
            <Check size={16} strokeWidth={3} />
            Email renvoyé — vérifiez votre boîte de réception.
          </motion.div>
        ) : (
          <motion.div
            key="resend"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button
              type="button"
              variant={ready ? "primary" : "outline"}
              size="lg"
              onClick={handleResend}
              disabled={!ready || pending}
              loading={pending}
              className="w-full"
            >
              {!pending && (
                <RefreshCw size={17} className={ready ? "" : "opacity-50"} />
              )}
              {ready
                ? "Renvoyer l'email de confirmation"
                : `Renvoyer dans ${formatSeconds(seconds)}`}
            </Button>

            {!ready && (
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-navy/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-da"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-3 text-center text-sm font-medium text-error">
          {error}
        </p>
      )}

      <p className="mt-6 text-center text-sm text-text-secondary">
        Ce n'est pas la bonne adresse ?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-brand-blue-royal transition-colors hover:text-brand-violet"
        >
          Changer d'adresse
        </Link>
      </p>
    </div>
  );
}
