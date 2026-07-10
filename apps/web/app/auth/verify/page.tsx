import { Monogram } from "@da/ui";
import { VerifyError, VerifySuccess } from "./VerifyResult";
import { verifyEmailToken } from "../actions";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Confirmation du compte",
  description:
    "Confirmation de votre adresse email et activation de votre compte Digital Access.",
  path: "/auth/verify",
  noindex: true,
});

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const status = await verifyEmailToken(token ?? "");
  const isValid = status === "success";

  return (
    <div className="relative flex min-h-[calc(100vh-4.5rem)] items-center justify-center overflow-hidden px-5 py-16 sm:px-8">
      {/* Décor de marque */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-brand-violet/15 blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-brand-cyan/15 blur-[120px]" />
        <Monogram
          size={420}
          className="absolute -bottom-32 left-1/2 -translate-x-1/2 opacity-[0.04]"
        />
      </div>

      <div className="w-full max-w-lg">
        {isValid ? <VerifySuccess /> : <VerifyError />}
      </div>
    </div>
  );
}
