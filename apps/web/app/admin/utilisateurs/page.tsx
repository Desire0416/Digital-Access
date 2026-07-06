import { currentUser } from "@da/auth/guards";
import { AdminPageHeader } from "@/components/admin/ui";
import { getAdminUsers } from "@/lib/admin-queries";
import { UsersTable } from "./UsersTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Utilisateurs" };

export default async function UtilisateursPage() {
  const [users, me] = await Promise.all([getAdminUsers(), currentUser()]);

  return (
    <>
      <AdminPageHeader
        title="Utilisateurs"
        description="Comptes et rôles de la plateforme."
      />
      <UsersTable users={users} currentUserId={me?.id ?? null} />
    </>
  );
}
