"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@da/academy-db/client";
import { requireAdminFresh } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Coupons — MUTATIONS d'administration (cahier §27.2 / §30.1). Chaque action
   revérifie le rôle admin EN BASE via requireAdminFresh() (jamais le seul JWT).
   La suppression d'un coupon déjà utilisé est refusée (traçabilité comptable) :
   on le désactive à la place.
   ══════════════════════════════════════════════════════════════════════════ */

export type CouponActionResult = { ok: true; message?: string } | { ok: false; error: string };

const DENIED: CouponActionResult = { ok: false, error: "Accès réservé aux administrateurs." };

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002";
}

/** Une date d'expiration saisie (<input type=date>, minuit UTC) doit rester
 *  valable TOUTE la journée choisie → on la borne à la fin de journée. */
function endOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  if (!Number.isNaN(d.getTime())) d.setUTCHours(23, 59, 59, 999);
  return d;
}

/* ─── Création ─────────────────────────────────────────────────────────────── */

const createSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Le code doit contenir au moins 3 caractères.")
      .max(40, "Le code est trop long.")
      .transform((v) => v.toUpperCase()),
    discountType: z.enum(["PERCENT", "FIXED"]),
    value: z.number().int("La valeur doit être un entier.").min(1, "La valeur doit être supérieure à 0."),
    maxUses: z.number().int().min(1, "La limite doit être supérieure à 0.").nullable().optional(),
    expiresAt: z
      .string()
      .trim()
      .min(1)
      .nullable()
      .optional()
      .transform((v) => (v ? endOfDay(v) : null)),
  })
  .superRefine((d, ctx) => {
    if (d.discountType === "PERCENT" && (d.value < 1 || d.value > 100)) {
      ctx.addIssue({ code: "custom", message: "Un pourcentage doit être compris entre 1 et 100.", path: ["value"] });
    }
    if (d.expiresAt && Number.isNaN(d.expiresAt.getTime())) {
      ctx.addIssue({ code: "custom", message: "Date d'expiration invalide.", path: ["expiresAt"] });
    }
  });

export type CreateCouponInput = z.input<typeof createSchema>;

export async function createCoupon(input: CreateCouponInput): Promise<CouponActionResult> {
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  const d = parsed.data;
  try {
    await prisma.coupon.create({
      data: {
        code: d.code,
        discountType: d.discountType,
        value: d.value,
        maxUses: d.maxUses ?? null,
        expiresAt: d.expiresAt ?? null,
      },
    });
  } catch (e) {
    if (isUniqueViolation(e)) return { ok: false, error: "Ce code existe déjà." };
    return { ok: false, error: "Impossible de créer le coupon." };
  }

  revalidatePath("/admin/coupons");
  return { ok: true, message: `Coupon « ${d.code} » créé.` };
}

/* ─── Activation / désactivation ───────────────────────────────────────────── */

export async function toggleCoupon(id: string): Promise<CouponActionResult> {
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const parsed = z.string().min(1).safeParse(id);
  if (!parsed.success) return { ok: false, error: "Coupon invalide." };

  const coupon = await prisma.coupon.findUnique({ where: { id: parsed.data }, select: { id: true, code: true, active: true } });
  if (!coupon) return { ok: false, error: "Coupon introuvable." };

  const next = !coupon.active;
  await prisma.coupon.update({ where: { id: coupon.id }, data: { active: next } });

  revalidatePath("/admin/coupons");
  return { ok: true, message: `Coupon « ${coupon.code} » ${next ? "activé" : "désactivé"}.` };
}

/* ─── Suppression (refusée si déjà utilisé) ────────────────────────────────── */

export async function deleteCoupon(id: string): Promise<CouponActionResult> {
  const admin = await requireAdminFresh();
  if (!admin) return DENIED;

  const parsed = z.string().min(1).safeParse(id);
  if (!parsed.success) return { ok: false, error: "Coupon invalide." };

  const coupon = await prisma.coupon.findUnique({ where: { id: parsed.data }, select: { id: true, code: true, usedCount: true } });
  if (!coupon) return { ok: false, error: "Coupon introuvable." };

  if (coupon.usedCount > 0) {
    return { ok: false, error: "Ce coupon a déjà été utilisé ; désactivez-le plutôt." };
  }

  // usedCount n'est incrémenté qu'à l'approbation : un coupon référencé par un
  // paiement PENDING a encore usedCount=0 mais sa remise est déjà engagée →
  // refuser la suppression (traçabilité), désactiver à la place.
  const pending = await prisma.payment.count({ where: { couponCode: coupon.code, status: "PENDING" } });
  if (pending > 0) {
    return { ok: false, error: "Ce coupon est utilisé par un paiement en attente ; désactivez-le plutôt." };
  }

  await prisma.coupon.delete({ where: { id: coupon.id } }).catch(() => null);

  revalidatePath("/admin/coupons");
  return { ok: true, message: `Coupon « ${coupon.code} » supprimé.` };
}
