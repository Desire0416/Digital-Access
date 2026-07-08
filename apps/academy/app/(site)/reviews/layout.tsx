import type { Metadata } from "next";
import { Section, Container } from "@da/ui";
import { requireRole } from "@/lib/auth-guards";

export const metadata: Metadata = {
  title: "Espace relecteur — Digital Access Academy",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Espace de relecture des projets — réservé aux relecteurs / formateurs / admins. */
export default async function ReviewsLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["REVIEWER", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"], "/reviews");
  return (
    <Section spacing="md" className="min-h-[80vh] pt-24">
      <Container size="lg">{children}</Container>
    </Section>
  );
}
