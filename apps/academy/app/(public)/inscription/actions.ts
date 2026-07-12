"use server";

import { redirect } from "next/navigation";
import { registerUser } from "@/lib/auth-actions";

/* Inscription §15.2 — enveloppe Server Action pour useActionState.
   Succès → redirection vers la page d'attente /verification-email?email=… */

export type RegisterState = { error?: string };

export async function registerAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  if (formData.get("terms") !== "on") {
    return { error: "Vous devez accepter les conditions d'utilisation pour créer un compte." };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const result = await registerUser({
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email,
    password: String(formData.get("password") ?? ""),
    country: String(formData.get("country") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    objective: String(formData.get("objective") ?? ""),
    experienceLevel: String(formData.get("experienceLevel") ?? ""),
  });

  if (!result.ok) return { error: result.error };

  redirect(`/verification-email?email=${encodeURIComponent(email)}`);
}
