import { redirect } from "next/navigation";

// /paiement sans cible : on renvoie vers le catalogue des formations.
export default function PaiementIndexPage() {
  redirect("/formations");
}
