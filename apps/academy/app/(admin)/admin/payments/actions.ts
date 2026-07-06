"use server";

import { currentUser, hasRole } from "@da/auth/guards";
import {
  getAdminPaymentDetail,
  type AdminPaymentDetail,
} from "@/lib/payment-queries";

/**
 * Charge le détail complet d'un paiement à la demande (ouverture du panneau),
 * derrière une garde ADMIN — la preuve de paiement (image lourde) n'est donc
 * jamais poussée dans la liste, seulement au clic sur un paiement.
 */
export async function fetchPaymentDetail(
  paymentId: string,
): Promise<
  | { ok: true; detail: AdminPaymentDetail }
  | { ok: false; error: string }
> {
  const user = await currentUser();
  if (!user || !hasRole(user, "ADMIN", "SUPER_ADMIN")) {
    return { ok: false, error: "Action réservée aux administrateurs." };
  }
  const detail = await getAdminPaymentDetail(paymentId);
  if (!detail) return { ok: false, error: "Paiement introuvable." };
  return { ok: true, detail };
}
