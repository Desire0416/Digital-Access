import { AdminPageHeader } from "@/components/admin/ui";
import { getAdminUsers } from "@/lib/admin-queries";
import { UsersTable } from "./UsersTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Utilisateurs" };

export default async function UtilisateursPage() {
  const users = await getAdminUsers();

  return (
    <>
      <AdminPageHeader
        title="Utilisateurs"
        description="Comptes et rôles de la plateforme."
      />
      <UsersTable users={users} />
    </>
  );
}
