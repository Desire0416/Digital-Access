import { AcademyHeader } from "@/components/AcademyHeader";
import { AcademyFooter } from "@/components/AcademyFooter";
import { PageTransition } from "@/components/PageTransition";

/** Chrome standard du site Academy (le player de cours, immersif, en est exempt). */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AcademyHeader />
      <main id="contenu">
        <PageTransition>{children}</PageTransition>
      </main>
      <AcademyFooter />
    </>
  );
}
