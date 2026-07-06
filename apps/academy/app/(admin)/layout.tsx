import { redirect } from "next/navigation";
import { currentUser, hasRole } from "@da/auth/guards";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/admin/dashboard");
  if (!hasRole(user, "ADMIN", "SUPER_ADMIN")) redirect("/dashboard");

  return (
    <AdminShell
      user={{
        name: user.name ?? "Admin",
        email: user.email ?? "",
        isSuperAdmin: hasRole(user, "SUPER_ADMIN"),
      }}
    >
      {children}
    </AdminShell>
  );
}
