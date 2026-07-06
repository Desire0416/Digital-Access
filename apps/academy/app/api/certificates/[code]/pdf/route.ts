import { NextRequest } from "next/server";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { prisma } from "@da/db/client";
import { CertificateDocument } from "@/lib/certificate-document";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Téléchargement public du certificat en PDF (par code de vérification). */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  const cert = await prisma.certificate.findUnique({
    where: { code },
    select: {
      code: true,
      issuedAt: true,
      user: { select: { name: true } },
      course: {
        select: { title: true, instructor: { select: { name: true } } },
      },
    },
  });

  if (!cert) {
    return new Response("Certificat introuvable.", { status: 404 });
  }

  const origin =
    process.env.NEXT_PUBLIC_ACADEMY_URL?.replace(/\/$/, "") ||
    new URL(req.url).origin;
  const verifyUrl = `${origin}/verify/${cert.code}`;

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 240,
    color: { dark: "#1A1A2E", light: "#FFFFFF" },
  });

  const dateStr = cert.issuedAt.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const element = createElement(CertificateDocument, {
    name: cert.user.name,
    courseTitle: cert.course.title,
    dateStr,
    code: cert.code,
    verifyUrl,
    qrDataUrl,
    instructor: cert.course.instructor?.name ?? null,
  }) as unknown as Parameters<typeof renderToBuffer>[0];

  const buffer = await renderToBuffer(element);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificat-${cert.code}.pdf"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
