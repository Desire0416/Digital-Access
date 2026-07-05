import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser, hasRole } from "@da/auth/guards";
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
  if (!user) redirect("/auth/login?callbackUrl=/admin/dashboard");
  if (!hasRole(user, "ADMIN", "SUPER_ADMIN")) redirect("/mon-espace");

  return (
    <AdminShell
      user={{
        name: user.name ?? "Administrateur",
        email: user.email ?? "",
        isSuperAdmin: user.roles.includes("SUPER_ADMIN"),
      }}
    >
      {children}
    </AdminShell>
  );
}
