import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@da/academy-db/client";
import { currentUser, isAdmin } from "@/lib/guards";
import { siteConfig } from "@/lib/site";
import { CertificateDocument } from "@/lib/certificate-document";

/* ══════════════════════════════════════════════════════════════════════════
   Téléchargement du certificat en PDF (§16.6, §20). Sécurité : seul le
   titulaire (ou un administrateur) peut télécharger. Le QR encode l'URL de
   vérification publique. Un certificat non ACTIF n'est jamais servi.
   ══════════════════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const cert = await prisma.certificate.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      title: true,
      number: true,
      verifyCode: true,
      status: true,
      issuedAt: true,
      user: { select: { name: true } },
      course: { select: { instructors: { orderBy: { order: "asc" }, select: { user: { select: { name: true } } }, take: 1 } } },
    },
  });
  if (!cert) return NextResponse.json({ error: "Certificat introuvable." }, { status: 404 });

  // Sécurité au niveau ligne : titulaire ou administrateur uniquement.
  if (cert.userId !== user.id && !isAdmin(user)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  if (cert.status !== "ACTIVE") {
    return NextResponse.json({ error: "Ce certificat n'est plus valide." }, { status: 410 });
  }

  const verifyUrl = `${siteConfig.url}/certificats/verifier?code=${cert.verifyCode}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 0, width: 320, errorCorrectionLevel: "M" });

  const buffer = await renderToBuffer(
    CertificateDocument({
      name: cert.user.name,
      courseTitle: cert.title,
      dateStr: dateFmt.format(cert.issuedAt),
      code: cert.verifyCode,
      verifyUrl,
      qrDataUrl,
      instructor: cert.course?.instructors[0]?.user.name ?? null,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificat-${cert.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
