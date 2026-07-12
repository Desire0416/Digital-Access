"use client";

import * as React from "react";
import { useActionState } from "react";
import { motion } from "framer-motion";
import { MailCheck } from "lucide-react";
import { Button, Field, Input } from "@da/ui";
import { requestPasswordReset } from "@/lib/auth-actions";

/* Demande de réinitialisation §15 — réponse neutre (anti-énumération). */

type State = { sent?: boolean; message?: string };

async function action(_prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get("email") ?? "");
  const res = await requestPasswordReset(email);
  return { sent: true, message: res.ok ? res.message : undefined };
}

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(action, {});

  if (state.sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 rounded-xl border border-success/25 bg-success/5 p-6 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <MailCheck size={28} />
        </span>
        <p className="text-sm leading-relaxed text-text-secondary">
          {state.message ??
            "Si un compte existe pour cette adresse, un email de réinitialisation vient d'être envoyé. Vérifiez votre boîte de réception."}
        </p>
      </motion.div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <Field label="Adresse email" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="vous@exemple.com" required />
      </Field>
      <Button type="submit" size="lg" loading={pending} className="w-full">
        Envoyer le lien de réinitialisation
      </Button>
    </form>
  );
}
