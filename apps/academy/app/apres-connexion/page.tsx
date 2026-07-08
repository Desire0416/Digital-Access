import { redirect } from "next/navigation";
import { currentUser } from "@da/auth/guards";
import { landingForUser } from "@/lib/roles";

export const dynamic = "force-dynamic";

/**
 * Aiguillage post-connexion, piloté par le rôle effectif (voir `lib/roles.ts`).
 * Les espaces par rôle (dashboard apprenant, studio formateur, back-office admin)
 * arrivent aux phases suivantes ; en attendant, chacun est dirigé vers son profil.
 */
export default async function ApresConnexion() {
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  redirect(landingForUser(user));
}
