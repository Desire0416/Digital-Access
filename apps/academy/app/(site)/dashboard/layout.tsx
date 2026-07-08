import type { Metadata } from "next";
import { Section, Container } from "@da/ui";
import { requireUser } from "@/lib/auth-guards";
import { DashboardNav } from "@/components/DashboardNav";

export const metadata: Metadata = {
  title: "Mon espace — Digital Access Academy",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Garde : espace réservé aux apprenants connectés.
  await requireUser("/dashboard");

  return (
    <Section spacing="md" className="min-h-[80vh] pt-24">
      <Container size="lg">
        <DashboardNav />
        <div className="mt-8">{children}</div>
      </Container>
    </Section>
  );
}
