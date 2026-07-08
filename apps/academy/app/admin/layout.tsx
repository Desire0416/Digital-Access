import type { Metadata } from "next";
import { requireRole } from "@/lib/auth-guards";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Administration — Digital Access Academy",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Back-office de pilotage — réservé aux administrateurs / responsables pédagogiques. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["ADMIN", "SUPER_ADMIN", "ACADEMIC_MANAGER"], "/admin");
  const shellUser = {
    name: user.name ?? user.email ?? "Administrateur",
    email: user.email ?? "",
    isSuperAdmin: user.roles.includes("SUPER_ADMIN"),
  };
  return <AdminShell user={shellUser}>{children}</AdminShell>;
}
