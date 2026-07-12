import { currentUser } from "@/lib/guards";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageTransition } from "@/components/PageTransition";

/* ══════════════════════════════════════════════════════════════════════════
   Layout du site public — lit la session côté serveur et passe l'utilisateur
   au header en prop (aucun fetch client). Header sticky + transitions + footer.
   ══════════════════════════════════════════════════════════════════════════ */

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader
        user={user ? { name: user.name, avatar: user.avatar, roles: user.roles } : null}
      />
      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>
      <SiteFooter />
    </div>
  );
}
