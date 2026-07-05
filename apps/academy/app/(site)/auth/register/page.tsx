import type { Metadata } from "next";
import { AuthShell } from "../AuthShell";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Créez votre compte Access Academy gratuitement : accédez au catalogue de formations, aux chapitres gratuits et commencez à apprendre dès aujourd'hui.",
};

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  return (
    <AuthShell
      aside={{
        quote:
          "J'ai décroché mon premier contrat freelance grâce à la formation Développement Web. Les quiz m'ont vraiment fait progresser.",
        author: "Mariam Traoré",
        role: "Apprenante — Développement Web",
        bullets: [
          "Certificats vérifiables en ligne",
          "Quiz interactifs avec correction immédiate",
          "Apprentissage mobile, où que vous soyez",
        ],
      }}
    >
      <RegisterForm googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
