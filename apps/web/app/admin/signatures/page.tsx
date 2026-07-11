import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/ui";
import { SignatureGenerator } from "./SignatureGenerator";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Signatures email",
  robots: { index: false, follow: false },
};

export default function SignaturesPage() {
  return (
    <>
      <AdminPageHeader
        title="Signatures email"
        description="Générez la signature email d'un collaborateur, puis copiez-la en un clic pour la coller dans Gmail, Outlook ou Apple Mail."
      />
      <SignatureGenerator />
    </>
  );
}
