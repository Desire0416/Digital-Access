import { redirect } from "next/navigation";
import { currentUser } from "@da/auth/guards";

export const dynamic = "force-dynamic";

/**
 * Aiguillage post-connexion. Les espaces par rôle (dashboard apprenant, studio
 * formateur, back-office admin) arrivent aux phases suivantes de la refonte ;
 * en attendant, chacun est dirigé vers son profil.
 */
export default async function ApresConnexion() {
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  redirect("/profil");
}
