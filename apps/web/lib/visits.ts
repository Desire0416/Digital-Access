import "server-only";
import { prisma } from "@da/db/client";

/* ══════════════════════════════════════════════════════════════════════════
   Compteur de visites public (bandeau statistiques du site vitrine).
   Une visite = une session de navigateur (déduplication côté client via
   sessionStorage). Incrément ATOMIQUE en base (SiteCounter).
   ══════════════════════════════════════════════════════════════════════════ */

const KEY = "site_visits";

/** Total de visites (0 si le compteur n'existe pas encore ou base injoignable). */
export async function getVisitCount(): Promise<number> {
  try {
    const row = await prisma.siteCounter.findUnique({
      where: { key: KEY },
      select: { value: true },
    });
    return row?.value ?? 0;
  } catch {
    return 0;
  }
}

/** Incrémente le compteur d'une unité et renvoie la nouvelle valeur. */
export async function incrementVisitCount(): Promise<number> {
  const row = await prisma.siteCounter.upsert({
    where: { key: KEY },
    create: { key: KEY, value: 1 },
    update: { value: { increment: 1 } },
    select: { value: true },
  });
  return row.value;
}
