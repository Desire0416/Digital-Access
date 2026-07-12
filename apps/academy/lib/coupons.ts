import "server-only";
import { prisma } from "@da/academy-db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Coupons — helpers & requêtes (cahier §27.2 / §30.1). Server-only, PAS
   "use server" : ces fonctions sont importées par les Server Components et par
   la couche paiement (validation + consommation au moment du checkout).
   L'INVARIANT : la remise n'est jamais calculée côté client — elle est
   toujours revérifiée ici avant d'affecter le montant réellement facturé.
   ══════════════════════════════════════════════════════════════════════════ */

export type CouponValidation =
  | {
      ok: true;
      code: string;
      discountType: "PERCENT" | "FIXED";
      value: number;
      discount: number;
      finalAmount: number;
    }
  | { ok: false; error: string };

/** Normalise un code saisi : sans espaces superflus, en majuscules. */
function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Valide un code promo pour un montant de base donné et calcule la remise.
 * Vérifie l'existence, l'activation, l'expiration et la limite d'utilisation.
 * Ne consomme RIEN — la consommation est faite séparément via consumeCoupon()
 * une fois le paiement effectivement validé.
 */
export async function validateCoupon(code: string, baseAmount: number): Promise<CouponValidation> {
  const normalized = normalizeCode(code);
  if (!normalized) return { ok: false, error: "Code promo invalide." };

  const coupon = await prisma.coupon.findUnique({
    where: { code: normalized },
    select: {
      code: true,
      discountType: true,
      value: true,
      maxUses: true,
      usedCount: true,
      expiresAt: true,
      active: true,
    },
  });

  if (!coupon || !coupon.active) return { ok: false, error: "Code promo invalide." };

  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Ce code promo a expiré." };
  }

  // Limite d'utilisation : on compte AUSSI les paiements PENDING qui détiennent
  // déjà ce code (réservation), sinon N apprenants pourraient déposer une preuve
  // pendant que usedCount vaut encore 0 et tous dépasser le plafond à l'approbation.
  if (coupon.maxUses != null) {
    const reserved = await prisma.payment.count({
      where: { couponCode: coupon.code, status: "PENDING" },
    });
    if (coupon.usedCount + reserved >= coupon.maxUses) {
      return { ok: false, error: "Ce code promo a atteint sa limite d'utilisation." };
    }
  }

  const base = Math.max(0, Math.round(baseAmount));
  const discount =
    coupon.discountType === "PERCENT"
      ? Math.round((base * coupon.value) / 100)
      : Math.min(coupon.value, base);
  const finalAmount = Math.max(0, base - discount);

  return {
    ok: true,
    code: coupon.code,
    discountType: coupon.discountType,
    value: coupon.value,
    discount,
    finalAmount,
  };
}

/**
 * Incrémente le compteur d'utilisation d'un coupon (après paiement validé).
 * Silencieux et non bloquant : un échec ici ne doit jamais annuler un paiement
 * déjà encaissé. updateMany évite de lever si le code n'existe plus.
 */
export async function consumeCoupon(code: string): Promise<void> {
  const normalized = normalizeCode(code);
  if (!normalized) return;
  try {
    // Incrément ATOMIQUE conditionné à la limite : ne dépasse JAMAIS maxUses même
    // en cas d'approbations concurrentes (updateMany Prisma ne permet pas la
    // comparaison colonne-à-colonne « usedCount < maxUses »).
    await prisma.$executeRaw`
      UPDATE "Coupon"
      SET "usedCount" = "usedCount" + 1
      WHERE "code" = ${normalized}
        AND ("maxUses" IS NULL OR "usedCount" < "maxUses")`;
  } catch {
    /* la consommation ne bloque jamais le flux de paiement */
  }
}

/** Liste tous les coupons, du plus récent au plus ancien (back-office). */
export async function getCoupons() {
  return prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      discountType: true,
      value: true,
      maxUses: true,
      usedCount: true,
      expiresAt: true,
      active: true,
      createdAt: true,
    },
  });
}

export type CouponRow = Awaited<ReturnType<typeof getCoupons>>[number];
