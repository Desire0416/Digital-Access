import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireUser } from "@/lib/guards";
import { getMyNotifications } from "@/lib/notify";
import { userNav, roleHomePath, navGroupsForRole } from "@/lib/site";
import { Container } from "@da/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EspaceNav } from "@/components/espace/EspaceNav";
import { EspaceMobileBar } from "@/components/espace/EspaceMobileBar";

/* ══════════════════════════════════════════════════════════════════════════
   Coquille de l'espace apprenant (§16). Réservé au rôle LEARNER. Les autres
   rôles sont redirigés vers leur espace propre — SAUF pour les pages de compte
   partagées (paramètres), universelles. La barre latérale s'adapte au rôle.
   ══════════════════════════════════════════════════════════════════════════ */

/** Pages de /espace accessibles à tous les rôles (compte, universelles). */
const SHARED_ESPACE_PREFIXES = ["/espace/parametres"];

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/espace");
  const isLearner = user.roles.includes("LEARNER");

  if (!isLearner) {
    const pathname = (await headers()).get("x-pathname") ?? "";
    const isShared = SHARED_ESPACE_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
    if (!isShared) {
      const home = roleHomePath(user.roles);
      if (home !== "/espace") redirect(home);
    }
  }

  // Barre latérale adaptée au rôle : l'apprenant voit son espace complet, les
  // autres rôles (présents ici uniquement pour une page partagée) voient la
  // navigation de LEUR espace.
  const navItems = isLearner ? userNav : navGroupsForRole(user.roles).flatMap((g) => g.items);
  const notif = await getMyNotifications(user.id, { take: 8 });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        user={{ name: user.name, avatar: user.avatar, roles: user.roles }}
        notifications={{ items: notif.notifications, unreadCount: notif.unreadCount }}
      />
      <EspaceMobileBar />

      <main className="flex-1 bg-surface-secondary/40">
        <Container className="py-6 sm:py-8 lg:py-10">
          <EspaceNav
            items={navItems}
            user={{ name: user.name, email: user.email, avatar: user.avatar }}
          >
            {children}
          </EspaceNav>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
