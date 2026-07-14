import { requireRole } from "@/lib/guards";
import { countPendingPayments } from "@/lib/admin-queries";
import { countPendingEquivalences } from "@/lib/equivalences";
import { AdminShell } from "@/components/admin/AdminShell";

/* ══════════════════════════════════════════════════════════════════════════
   Coquille du back-office (cahier §30, §46). Gardée : requireRole redirige
   tout non-administrateur vers /espace (ou /connexion si déconnecté). Le
   compteur « paiements en attente » alimente la pastille de la barre latérale.
   Défense en profondeur : chaque query/mutation revérifie le rôle en base.
   ══════════════════════════════════════════════════════════════════════════ */

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"], "/admin");
  const [pendingPayments, pendingEquivalences] = await Promise.all([
    countPendingPayments(),
    countPendingEquivalences(),
  ]);

  return (
    <AdminShell
      user={{ name: user.name, email: user.email, avatar: user.avatar, roles: user.roles }}
      pendingPayments={pendingPayments}
      pendingEquivalences={pendingEquivalences}
    >
      {children}
    </AdminShell>
  );
}
