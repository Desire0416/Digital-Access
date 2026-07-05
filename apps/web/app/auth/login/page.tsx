import type { Metadata } from "next";
import { AuthShell } from "../AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Connexion",
  description:
    "Connectez-vous à votre espace client Digital Access pour suivre vos projets, télécharger vos factures et gérer vos tickets de support.",
};

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  return (
    <AuthShell
      aside={{
        quote:
          "Digital Access a transformé notre présence en ligne. Un partenaire réactif, à l'écoute et redoutablement efficace.",
        author: "Aminata Koné",
        role: "Directrice, Boutique Ivoire",
        bullets: [
          "Suivi de vos projets en temps réel",
          "Factures et devis centralisés",
          "Support prioritaire par ticket",
        ],
      }}
    >
      <LoginForm googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
