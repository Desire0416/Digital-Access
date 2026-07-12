"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@da/ui";
import { resendVerification } from "@/lib/auth-actions";

/* Renvoi d'email de vérification avec compte à rebours (§15.3, 1 envoi / 2 min). */

const COOLDOWN_S = 120;

export function ResendPanel({ email }: { email: string }) {
  const [pending, setPending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);
  const [message, setMessage] = React.useState<{ ok: boolean; text: string } | null>(null);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function handleResend() {
    if (pending || cooldown > 0) return;
    setPending(true);
    setMessage(null);
    try {
      const res = await resendVerification(email);
      if (res.ok) {
        setMessage({ ok: true, text: res.message ?? "Email envoyé. Vérifiez votre boîte de réception." });
        setCooldown(COOLDOWN_S);
      } else {
        setMessage({ ok: false, text: res.error });
      }
    } catch {
      setMessage({ ok: false, text: "Une erreur est survenue. Réessayez dans quelques instants." });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      {message && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm font-medium ${message.ok ? "text-success" : "text-error"}`}
          role="status"
        >
          {message.text}
        </motion.p>
      )}
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={handleResend}
        loading={pending}
        disabled={cooldown > 0}
        className="w-full"
      >
        {cooldown > 0 ? `Renvoyer dans ${cooldown}s` : "Renvoyer l'email de vérification"}
      </Button>
    </div>
  );
}
