import { redirect } from "next/navigation";
import { currentUser } from "@da/auth/guards";
import { landingForUser } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * Aiguillage post-connexion : dirige chaque utilisateur vers son espace selon
 * son rôle (ADMIN → dashboard, COMMERCIAL → espace commercial, CHEF_PROJET →
 * ses projets, sinon espace client). Utilisé après connexion email et Google.
 */
export default async function ApresConnexion() {
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  redirect(landingForUser(user));
}
