import "server-only";
import { prisma } from "@da/db/client";
import { sendCertificateEmail } from "@da/email";
import { createNotification, emailEnabled } from "./notifications";

/* ══════════════════════════════════════════════════════════════════════════
   Émission de certificats. Idempotent (contrainte unique userId+courseId).
   Déclenché à la complétion d'un cours (progression 100%).
   ══════════════════════════════════════════════════════════════════════════ */

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_ACADEMY_URL?.replace(/\/$/, "") ||
    "https://academy.digitalaccess.ci"
  );
}

/** Code lisible + non ambigu : DA-XXXX-XXXX. */
function genCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I,O,0,1
  const seg = () =>
    Array.from({ length: 4 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
  return `DA-${seg()}-${seg()}`;
}

export type IssueResult = { code: string; created: boolean } | null;

/** Émet le certificat si absent ; renvoie le code. Best-effort pour notif/email. */
export async function issueCertificate(userId: string, courseId: string): Promise<IssueResult> {
  try {
    const existing = await prisma.certificate.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { code: true },
    });
    if (existing) return { code: existing.code, created: false };

    let code = genCode();
    for (let i = 0; i < 6; i++) {
      const clash = await prisma.certificate.findUnique({
        where: { code },
        select: { id: true },
      });
      if (!clash) break;
      code = genCode();
    }

    let created = true;
    try {
      await prisma.certificate.create({ data: { userId, courseId, code } });
    } catch {
      // Course de complétion : une autre requête a créé le certificat entre-temps.
      const again = await prisma.certificate.findUnique({
        where: { userId_courseId: { userId, courseId } },
        select: { code: true },
      });
      if (again) return { code: again.code, created: false };
      created = false;
    }

    // Notification in-app + email (best-effort — ne bloque pas la complétion).
    const [user, course] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, notificationPrefs: true },
      }),
      prisma.course.findUnique({ where: { id: courseId }, select: { title: true } }),
    ]);

    if (user && course) {
      await createNotification({
        userId,
        type: "CERTIFICATE_ISSUED",
        title: "Certificat obtenu 🎓",
        message: `Félicitations ! Vous avez décroché le certificat du cours « ${course.title} ».`,
        link: "/certificates",
        data: { code, courseTitle: course.title },
      });

      if (emailEnabled(user.notificationPrefs, "CERTIFICATE_ISSUED")) {
        const base = baseUrl();
        void sendCertificateEmail(user.email, {
          name: user.name,
          courseTitle: course.title,
          certificatesUrl: `${base}/certificates`,
          verifyUrl: `${base}/verify/${code}`,
          code,
        }).catch((e) => console.error("[academy] certificate email:", e));
      }
    }

    return { code, created };
  } catch (e) {
    console.error("[academy] issueCertificate:", e);
    return null;
  }
}

/** À appeler quand un cours atteint 100 %. Idempotent. */
export async function onCourseCompleted(userId: string, courseId: string): Promise<IssueResult> {
  return issueCertificate(userId, courseId);
}
