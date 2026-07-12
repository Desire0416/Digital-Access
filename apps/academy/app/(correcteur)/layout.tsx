import { requireRole } from "@/lib/guards";
import { getMyNotifications } from "@/lib/notify";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageTransition } from "@/components/PageTransition";

/* ══════════════════════════════════════════════════════════════════════════
   Espace correcteur (cahier §7.4 / §19.4) — même chrome que le site public.
   Accès réservé aux correcteurs, formateurs et administrateurs pédagogiques ;
   SUPER_ADMIN est auto-autorisé par requireRole.
   ══════════════════════════════════════════════════════════════════════════ */

export default async function CorrecteurLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["GRADER", "INSTRUCTOR", "ACADEMIC_ADMIN", "SALES_ADMIN"], "/correction");
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
