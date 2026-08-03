import { redirect } from "next/navigation";
import { requireUser } from "@/lib/guards";
import { getMyNotifications } from "@/lib/notify";
import { userNav, roleHomePath } from "@/lib/site";
import { Container } from "@da/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EspaceNav } from "@/components/espace/EspaceNav";
import { EspaceMobileBar } from "@/components/espace/EspaceMobileBar";

/* ══════════════════════════════════════════════════════════════════════════
   Coquille de l'espace apprenant (§16). Réservé au rôle LEARNER. Les
   autres rôles sont redirigés vers leur espace propre. Header/footer du
   site + sous-navigation latérale (desktop) ou onglets défilables (mobile).
   ══════════════════════════════════════════════════════════════════════════ */

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/espace");
  if (!user.roles.includes("LEARNER")) {
    const home = roleHomePath(user.roles);
    if (home !== "/espace") redirect(home);
  }
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
            items={userNav}
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
