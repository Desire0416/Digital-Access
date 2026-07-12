import { requireUser } from "@/lib/guards";
import { userNav } from "@/lib/site";
import { Container } from "@da/ui";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageTransition } from "@/components/PageTransition";
import { EspaceNav } from "@/components/espace/EspaceNav";

/* ══════════════════════════════════════════════════════════════════════════
   Coquille de l'espace apprenant (§16). Gardée : requireUser redirige les
   visiteurs vers /connexion?callbackUrl=/espace. Header/footer du site +
   sous-navigation latérale (desktop) ou onglets défilables (mobile).
   ══════════════════════════════════════════════════════════════════════════ */

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/espace");

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={{ name: user.name, avatar: user.avatar, roles: user.roles }} />

      <main className="flex-1 bg-surface-secondary/40">
        <Container className="py-6 sm:py-8 lg:py-10">
          <div className="grid gap-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-8">
            <EspaceNav
              items={userNav}
              user={{ name: user.name, email: user.email, avatar: user.avatar }}
            />
            <div className="min-w-0">
              <PageTransition>{children}</PageTransition>
            </div>
          </div>
        </Container>
      </main>

      <SiteFooter />
    </div>
  );
}
