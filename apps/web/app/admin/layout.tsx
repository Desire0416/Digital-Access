import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@da/auth/guards";
import { isStaff, primaryRole, roleLabel } from "@/lib/permissions";
import { getMyNotifications, getUnreadCount } from "@/lib/crm-notification-queries";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s — Admin Digital Access" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/admin");
  // Équipe interne uniquement (ADMIN, SUPER_ADMIN, COMMERCIAL, CHEF_PROJET).
  // Les rubriques réservées à l'administration restent gardées au niveau de
  // chaque page/action (defense in depth) et masquées de la sidebar par rôle.
  if (!isStaff(user)) redirect("/mon-espace");

  const [notifications, unreadCount] = await Promise.all([getMyNotifications(15), getUnreadCount()]);

  return (
    <AdminShell
      user={{
        name: user.name ?? "Utilisateur",
        email: user.email ?? "",
        roles: user.roles,
        roleLabel: roleLabel(primaryRole(user.roles)),
      }}
      notifications={notifications}
      unreadCount={unreadCount}
    >
      {children}
    </AdminShell>
  );
}
