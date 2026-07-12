import { Container } from "@da/ui";
import { requireRole } from "@/lib/guards";
import { getMyNotifications } from "@/lib/notify";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageTransition } from "@/components/PageTransition";
import { FormateurNav } from "./FormateurNav";

/* ══════════════════════════════════════════════════════════════════════════
   Espace formateur (cahier §29). Même chrome que le site public + une sous-
   navigation propre au studio. Accès réservé aux formateurs et administrateurs
   pédagogiques ; SUPER_ADMIN est auto-autorisé par requireRole. Le cloisonnement
   fin (un formateur ne voit QUE ses formations) est géré côté requêtes.
   ══════════════════════════════════════════════════════════════════════════ */

export default async function FormateurLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["INSTRUCTOR", "ACADEMIC_ADMIN", "SALES_ADMIN"], "/formateur");
  const notif = await getMyNotifications(user.id, { take: 8 });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        user={{ name: user.name, avatar: user.avatar, roles: user.roles }}
        notifications={{ items: notif.notifications, unreadCount: notif.unreadCount }}
      />

      <main className="flex-1 bg-surface-secondary/40">
        {/* Sous-navigation studio — bandeau sticky sous le header */}
        <div className="sticky top-16 z-30 border-b border-navy/[0.07] bg-surface-primary/85 backdrop-blur-md lg:top-[4.5rem]">
          <Container>
            <FormateurNav />
          </Container>
        </div>

        <Container className="py-6 sm:py-8 lg:py-10">
          <PageTransition>{children}</PageTransition>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
