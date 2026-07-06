import "server-only";
import { prisma } from "@da/db/client";

/* Certificats — lecture. */

export async function getMyCertificates(userId: string) {
  return prisma.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    select: {
      id: true,
      code: true,
      issuedAt: true,
      course: {
        select: {
          title: true,
          slug: true,
          level: true,
          category: { select: { name: true } },
        },
      },
    },
  });
}

export type MyCertificate = Awaited<ReturnType<typeof getMyCertificates>>[number];

/** Vérification publique par code. */
export async function getCertificateByCode(code: string) {
  return prisma.certificate.findUnique({
    where: { code },
    select: {
      code: true,
      issuedAt: true,
      user: { select: { name: true } },
      course: {
        select: {
          title: true,
          level: true,
          category: { select: { name: true } },
          instructor: { select: { name: true } },
        },
      },
    },
  });
}

export type VerifiedCertificate = Awaited<ReturnType<typeof getCertificateByCode>>;
