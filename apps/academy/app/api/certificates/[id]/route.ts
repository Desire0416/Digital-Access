import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { prisma } from "@da/db/client";
import { currentUser } from "@da/auth/guards";
import { CertificateDocument } from "@/lib/certificate-document";
import { academyBaseUrl } from "@/lib/certificates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

/** PDF du certificat (QR de vérification embarqué). Réservé au titulaire ou à un admin. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return new Response("Non autorisé", { status: 401 });

  const cert = await prisma.certificate.findUnique({
    where: { id },
    select: {
      learnerId: true,
      title: true,
      certificateNumber: true,
      verificationUrl: true,
      issuedAt: true,
      status: true,
      learner: { select: { name: true } },
    },
  });
  if (!cert) return new Response("Certificat introuvable", { status: 404 });

  const isOwner = cert.learnerId === user.id;
  const isAdmin = user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN");
  if (!isOwner && !isAdmin) return new Response("Accès refusé", { status: 403 });

  try {
    const verifyUrl = cert.verificationUrl ?? `${await academyBaseUrl()}/verify/${cert.certificateNumber}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      margin: 1,
      width: 220,
      color: { dark: "#14142A", light: "#FFFFFF" },
    });

    const doc = CertificateDocument({
      name: cert.learner.name,
      courseTitle: cert.title,
      dateStr: DATE.format(cert.issuedAt),
      code: cert.certificateNumber,
      verifyUrl,
      qrDataUrl,
      instructor: null,
    });
    const buffer = await renderToBuffer(doc);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="certificat-${cert.certificateNumber}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("[academy] certificate PDF:", e);
    return new Response("Erreur de génération du certificat", { status: 500 });
  }
}
