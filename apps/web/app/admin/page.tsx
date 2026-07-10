import { redirect } from "next/navigation";
import { currentUser } from "@da/auth/guards";
import { landingForUser } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** /admin → renvoie chaque membre de l'équipe vers son espace selon son rôle. */
export default async function AdminIndex() {
  const user = await currentUser();
  redirect(landingForUser(user));
}
