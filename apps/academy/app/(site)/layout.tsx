import { currentUser } from "@da/auth/guards";
import { AcademyHeader } from "@/components/AcademyHeader";
import { AcademyFooter } from "@/components/AcademyFooter";
import { PageTransition } from "@/components/PageTransition";
import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { GlobalDiagnostic } from "@/components/GlobalDiagnostic";

export const dynamic = "force-dynamic";

/** Chrome standard du site Academy (le player de cours, immersif, en est exempt). */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // État de session résolu côté serveur (par requête) : source de vérité du header,
  // insensible aux aléas d'hydratation de useSession en production.
  const user = await currentUser();
  const initialUser = user
    ? { name: user.name ?? null, email: user.email ?? null, roles: user.roles }
    : null;

  return (
    <>
      <ImpersonationBanner />
      <AcademyHeader initialUser={initialUser} />
      <main id="contenu">
        <PageTransition>{children}</PageTransition>
      </main>
      <AcademyFooter />
      <GlobalDiagnostic />
    </>
  );
}
