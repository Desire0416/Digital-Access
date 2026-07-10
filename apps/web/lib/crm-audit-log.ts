import "server-only";
import { prisma } from "@da/db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Journal des opérations sensibles du CRM (AuditLog). Best-effort — ne bloque
   jamais l'action métier. On conserve userId + userName en clair pour survivre
   à la suppression d'un compte (pas de FK).
   ══════════════════════════════════════════════════════════════════════════ */

export async function logAction(input: {
  actor: { id: string; name?: string | null } | null;
  action: string; // ex. "prospect.create", "prospect.assign", "audit.validate"
  entity: string; // ex. "Prospect", "Audit", "Deal"
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.actor?.id ?? null,
        userName: input.actor?.name ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        oldValue: (input.oldValue as never) ?? undefined,
        newValue: (input.newValue as never) ?? undefined,
        metadata: (input.metadata as never) ?? undefined,
      },
    });
  } catch (e) {
    console.error("[crm] logAction:", e);
  }
}
