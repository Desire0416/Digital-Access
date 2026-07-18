import { requireRole } from "@/lib/guards";
import { getMyNotifications } from "@/lib/notify";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageTransition } from "@/components/PageTransition";

/* ══════════════════════════════════════════════════════════════════════════
   Espace mentor (cahier §7.5) — même coque que le site public.
   Accès réservé aux mentors et aux administrateurs pédagogiques / commerciaux ;
   SUPER_ADMIN est auto-autorisé par requireRole. Le cloisonnement fin (un mentor
   ne voit QUE ses mentorés assignés) est appliqué dans les requêtes/actions.
   ══════════════════════════════════════════════════════════════════════════ */

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["MENTOR", "ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"], "/mentorat");
  const notif = await getMyNotifications(user.id, { take: 8 });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        user={{ name: user.name, avatar: user.avatar, roles: user.roles }}
        notifications={{ items: notif.notifications, unreadCount: notif.unreadCount }}
      />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
    </div>
  );
}
