"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma, Prisma, type EquivalenceStatus, type EnrollmentStatus } from "@da/academy-db/client";
import { currentUser, requireAdminFresh } from "./guards";
import { ACQUIRED_STATUSES } from "./pricing";
import { createNotification } from "./notify";

/* ══════════════════════════════════════════════════════════════════════════
   Équivalences (cahier §22.3-22.4) — MUTATIONS.
   INVARIANT ABSOLU : déposer une preuve crée une demande PENDING et RIEN
   d'autre. Seule la validation d'un administrateur (relu en base) peut ouvrir
   un accès :
     · ACCEPTED    → Enrollment COMPLETED via EQUIVALENCE (dispense totale :
                     compte comme acquis → prérequis satisfaits + prix parcours
                     déduit, §22.1/§27.4). Aucun certificat n'est émis (l'acquis
                     est reconnu, non certifié par l'Académie).
     · PARTIAL     → Enrollment ACTIVE via EQUIVALENCE (accès gratuit à compléter).
     · CONDITIONAL → aucun accès ; la note porte la condition (re-dépôt possible).
     · REJECTED    → aucun accès ; la note porte le motif.
   ══════════════════════════════════════════════════════════════════════════ */

const ACQUIRED: EnrollmentStatus[] = [...ACQUIRED_STATUSES];

/** Marqueur interne : décision déjà appliquée par un traitement concurrent. */
const REVIEW_RACE = "__EQUIVALENCE_ALREADY_PROCESSED__";

export type EquivalenceActionResult = { ok: true; message?: string } | { ok: false; error: string };

/* ─── Dépôt d'une demande → EquivalenceRequest PENDING (et RIEN d'autre) ─────── */

/** Un lien externe DOIT être http(s) (bloque javascript:/data:). */
const httpUrl = z
  .string()
  .trim()
  .url("Lien invalide.")
  .refine((v) => /^https?:\/\//i.test(v), "Le lien doit commencer par http(s)://");

/**
 * proofUrl est AUTO-chargée en <img> dans la file admin (miniature de preuve)
 * → elle DOIT provenir de notre propre Vercel Blob (capture via /api/upload).
 * Sinon un apprenant pourrait y placer un hôte tiers : le navigateur authentifié
 * de l'admin le chargerait sans clic → pixel traceur / fuite IP-UA / sonde réseau.
 * (proofLink, lui, reste un lien externe volontaire rendu en <a> — clic requis.)
 */
const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";
const blobImageUrl = httpUrl.refine((v) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" && u.hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}, "Capture invalide : envoyez le fichier via le formulaire.");

const submitSchema = z
  .object({
    courseSlug: z.string().min(1),
    evidenceType: z.enum(["CERTIFICATE", "DIPLOMA", "PORTFOLIO", "EXPERIENCE", "TEST"]),
    description: z
      .string()
      .trim()
      .min(20, "Décrivez votre preuve ou votre expérience (20 caractères minimum).")
      .max(2000),
    proofUrl: blobImageUrl.optional().or(z.literal("")),
    proofLink: httpUrl.optional().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    if (!val.proofUrl && !val.proofLink) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["proofLink"],
        message: "Joignez au moins une preuve : une capture/document ou un lien.",
      });
    }
  });

export type SubmitEquivalenceInput = z.input<typeof submitSchema>;

export async function submitEquivalenceRequest(
  input: SubmitEquivalenceInput,
): Promise<EquivalenceActionResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  const data = parsed.data;

  const user = await currentUser();
  if (!user) return { ok: false, error: "Veuillez vous connecter." };
  if (!user.emailVerified) return { ok: false, error: "Confirmez votre adresse email avant de déposer une demande." };

  const course = await prisma.course.findUnique({
    where: { slug: data.courseSlug },
    select: { id: true, title: true, status: true },
  });
  if (!course || course.status !== "PUBLISHED") return { ok: false, error: "Cette formation n'est pas disponible." };

  // Déjà acquise → aucune équivalence à demander.
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    select: { status: true },
  });
  if (enrollment && ACQUIRED.includes(enrollment.status)) {
    return { ok: false, error: "Vous avez déjà accès à cette formation." };
  }

  // Une seule demande en attente à la fois (vérif applicative + index partiel).
  const pending = await prisma.equivalenceRequest.findFirst({
    where: { userId: user.id, courseId: course.id, status: "PENDING" },
    select: { id: true },
  });
  if (pending) {
    return { ok: false, error: "Une demande d'équivalence est déjà en attente pour cette formation." };
  }

  try {
    await prisma.equivalenceRequest.create({
      data: {
        userId: user.id,
        courseId: course.id,
        evidenceType: data.evidenceType,
        description: data.description,
        proofUrl: data.proofUrl || null,
        proofLink: data.proofLink || null,
        status: "PENDING",
      },
    });
  } catch (err) {
    // Index partiel « une seule PENDING par (userId, courseId) » : une seconde
    // soumission concurrente a gagné la course → message identique.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "Une demande d'équivalence est déjà en attente pour cette formation." };
    }
    throw err;
  }

  await createNotification({
    userId: user.id,
    type: "EQUIVALENCE",
    title: "Demande d'équivalence reçue",
    message: `Votre demande de reconnaissance pour « ${course.title} » est en cours d'examen par notre équipe.`,
    link: "/espace/equivalences",
  });

  return {
    ok: true,
    message: "Demande envoyée ! Notre équipe l'examine et vous notifiera de sa décision.",
  };
}

/* ─── Validation admin → SEULE source d'ouverture d'accès ───────────────────── */

const reviewSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["ACCEPTED", "PARTIAL", "CONDITIONAL", "REJECTED"]),
  note: z.string().trim().max(1000).optional(),
});

export type ReviewEquivalenceInput = z.input<typeof reviewSchema>;

export async function reviewEquivalence(input: ReviewEquivalenceInput): Promise<EquivalenceActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const { id, decision } = parsed.data;
  const note = parsed.data.note?.trim() || null;

  // Motif obligatoire pour un refus / une condition (l'apprenant doit savoir).
  if ((decision === "REJECTED" || decision === "CONDITIONAL") && (!note || note.length < 3)) {
    return {
      ok: false,
      error: decision === "REJECTED" ? "Indiquez le motif du refus." : "Précisez la condition.",
    };
  }

  const admin = await requireAdminFresh();
  if (!admin) return { ok: false, error: "Accès réservé aux administrateurs." };

  const request = await prisma.equivalenceRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      userId: true,
      courseId: true,
      course: { select: { slug: true, title: true } },
    },
  });
  if (!request) return { ok: false, error: "Demande introuvable." };
  if (request.status !== "PENDING") return { ok: false, error: "Cette demande a déjà été traitée." };

  const grantsAccess = decision === "ACCEPTED" || decision === "PARTIAL";
  const newEnrollStatus: EnrollmentStatus = decision === "ACCEPTED" ? "COMPLETED" : "ACTIVE";

  try {
    await prisma.$transaction(async (tx) => {
      // Bascule idempotente : ne traite que si ENCORE PENDING (anti double-clic /
      // deux admins → double inscription / notifications dupliquées).
      const flip = await tx.equivalenceRequest.updateMany({
        where: { id: request.id, status: "PENDING" },
        data: {
          status: decision as EquivalenceStatus,
          reviewNote: note,
          reviewedById: admin.id,
          reviewedAt: new Date(),
        },
      });
      if (flip.count === 0) throw new Error(REVIEW_RACE);

      if (grantsAccess) {
        const existing = await tx.enrollment.findUnique({
          where: { userId_courseId: { userId: request.userId, courseId: request.courseId } },
          select: { id: true, status: true },
        });
        if (existing) {
          // Règle 40.6 : ne JAMAIS toucher un accès déjà acquis (ACTIVE/COMPLETED).
          // On préserve sa provenance (accessType, ex. PAID), sa progression réelle,
          // son startedAt et son chemin de certification (forcer COMPLETED ici
          // bloquerait à vie l'émission du certificat — recalcCourseProgress n'émet
          // que sur la transition →COMPLETED). L'apprenant a déjà accès ; la décision
          // reste tracée via le statut de la demande + reviewNote + audit + notif.
          // On ne (ré)ouvre l'accès que si l'inscription n'était PAS acquise
          // (ex. EXPIRED / CANCELLED / PAUSED / FAILED).
          if (!ACQUIRED.includes(existing.status)) {
            await tx.enrollment.update({
              where: { id: existing.id },
              data: {
                status: newEnrollStatus,
                accessType: "EQUIVALENCE",
                ...(decision === "ACCEPTED"
                  ? { progress: 100, startedAt: new Date(), completedAt: new Date() }
                  : {}),
              },
            });
          }
        } else {
          await tx.enrollment.create({
            data: {
              userId: request.userId,
              courseId: request.courseId,
              status: newEnrollStatus,
              origin: "DIRECT",
              accessType: "EQUIVALENCE",
              ...(decision === "ACCEPTED"
                ? { progress: 100, startedAt: new Date(), completedAt: new Date() }
                : {}),
            },
          });
        }
      }

      const notif = notificationFor(decision, request.course.title, note);
      await tx.notification.create({
        data: {
          userId: request.userId,
          type: "EQUIVALENCE",
          title: notif.title,
          message: notif.message,
          link: grantsAccess ? `/apprendre/${request.course.slug}` : "/espace/equivalences",
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          action: "equivalence.review",
          entity: "EquivalenceRequest",
          entityId: request.id,
          meta: { decision, learnerId: request.userId, courseId: request.courseId },
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === REVIEW_RACE) {
      return { ok: false, error: "Cette demande a déjà été traitée." };
    }
    throw e;
  }

  revalidatePath("/admin/equivalences");
  const label = {
    ACCEPTED: "acceptée — accès ouvert",
    PARTIAL: "partiellement reconnue — accès ouvert",
    CONDITIONAL: "marquée conditionnelle",
    REJECTED: "refusée",
  }[decision];
  return { ok: true, message: `Demande ${label}. L'apprenant a été notifié.` };
}

function notificationFor(
  decision: "ACCEPTED" | "PARTIAL" | "CONDITIONAL" | "REJECTED",
  courseTitle: string,
  note: string | null,
): { title: string; message: string } {
  switch (decision) {
    case "ACCEPTED":
      return {
        title: "Équivalence acceptée ✅",
        message: `Votre équivalence pour « ${courseTitle} » est accordée : la formation est reconnue comme acquise.`,
      };
    case "PARTIAL":
      return {
        title: "Équivalence partielle accordée",
        message: `Votre équivalence pour « ${courseTitle} » est partiellement reconnue : l'accès à la formation vous est ouvert pour compléter ce qui manque.${note ? ` Note : ${note}` : ""}`,
      };
    case "CONDITIONAL":
      return {
        title: "Équivalence conditionnelle",
        message: `Votre demande pour « ${courseTitle} » est reconnue sous condition : l'accès n'est pas encore ouvert. Condition à remplir : ${note ?? "voir avec l'équipe"}. Vous pourrez ensuite redéposer votre demande.`,
      };
    case "REJECTED":
      return {
        title: "Équivalence non retenue",
        message: `Votre demande d'équivalence pour « ${courseTitle} » n'a pas été retenue. Motif : ${note ?? "non précisé"}.`,
      };
  }
}
