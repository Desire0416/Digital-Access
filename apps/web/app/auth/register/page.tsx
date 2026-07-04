import type { Metadata } from "next";
import { AuthShell } from "../AuthShell";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Créer un compte",
  description:
    "Créez votre compte Digital Access gratuitement pour suivre vos projets, accéder à vos factures et échanger avec notre équipe.",
};

export default function RegisterPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  return (
    <AuthShell
      aside={{
        quote:
          "En une semaine, nous avions un site professionnel qui a doublé nos demandes de devis. L'équipe est exceptionnelle.",
        author: "Yao Konan",
        role: "Fondateur, TechAgri CI",
        bullets: [
          "Devis gratuit et sans engagement",
          "Un interlocuteur dédié à votre projet",
          "Paiement Mobile Money sécurisé",
        ],
      }}
    >
      <RegisterForm googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
