import type { Metadata } from "next";
import { AuthShell } from "../AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous à votre espace Access Academy pour reprendre vos cours, suivre votre progression et obtenir vos certificats.",
};

export const dynamic = "force-dynamic";

/** N'accepte que les chemins internes (« /... ») — jamais d'URL externe. */
function sanitizeCallbackUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  if (!raw.startsWith("/") || raw.startsWith("//")) return undefined;
  return raw;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const safeCallbackUrl = sanitizeCallbackUrl(callbackUrl);
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <AuthShell
      aside={{
        quote:
          "Je me forme le soir, directement depuis mon téléphone. Je reprends chaque cours exactement là où je m'étais arrêté.",
        author: "Yao Kouassi",
        role: "Apprenant — Marketing Digital",
        bullets: [
          "Certificats vérifiables en ligne",
          "Quiz interactifs avec correction immédiate",
          "Apprentissage mobile, où que vous soyez",
        ],
      }}
    >
      <LoginForm googleEnabled={googleEnabled} callbackUrl={safeCallbackUrl} />
    </AuthShell>
  );
}
