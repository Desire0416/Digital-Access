import { redirect } from "next/navigation";
import { currentUser, hasRole } from "@da/auth/guards";

export const dynamic = "force-dynamic";

/**
 * Aiguillage post-connexion : dirige chaque utilisateur vers son espace selon
 * son rôle. Utilisé après la connexion email/mot de passe et Google OAuth.
 */
export default async function ApresConnexion() {
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  if (hasRole(user, "ADMIN", "SUPER_ADMIN")) redirect("/admin/dashboard");
  redirect("/mon-espace");
}
