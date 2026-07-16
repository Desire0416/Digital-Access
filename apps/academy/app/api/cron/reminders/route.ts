import { prisma } from "@da/academy-db/client";
import { createNotification } from "@/lib/notify";

/* ══════════════════════════════════════════════════════════════════════════
   Cron « rappel d'événement » (cahier §24.3).

   CONFIGURATION EXTERNE (au même titre que les autres clés serveur) : c'est
   Vercel Cron qui DOIT appeler cette route à intervalle régulier (ex. toutes
   les heures) en fournissant le secret `CRON_SECRET`.

   Authentification acceptée :
     · En-tête   →  Authorization: Bearer <CRON_SECRET>   (transmis automatiquement
                    par Vercel Cron, qui envoie `Authorization: Bearer $CRON_SECRET`) ;
     · ou query  →  /api/cron/reminders?secret=<CRON_SECRET>.

   Exemple vercel.json :
     { "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }] }

   Effet : pour chaque inscription à un événement PUBLISHED démarrant dans les
   24 h et pas encore rappelée (`remindedAt: null`), envoie une notification
   REMINDER puis marque `remindedAt` (anti-doublon). Traitement par lot borné.
   ══════════════════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Date/heure au format FR, exprimée à l'heure d'Abidjan. */
function formatFr(d: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(d);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return Response.json({ error: "CRON_SECRET non configuré" }, { status: 503 });

  const header = req.headers.get("authorization");
  const querySecret = new URL(req.url).searchParams.get("secret");
  if (header !== `Bearer ${secret}` && querySecret !== secret) {
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const due = await prisma.eventRegistration.findMany({
    where: {
      remindedAt: null,
      event: { status: "PUBLISHED", startAt: { gte: now, lte: horizon } },
    },
    take: 200,
    select: {
      id: true,
      userId: true,
      event: { select: { title: true, slug: true, startAt: true, meetingUrl: true } },
    },
  });

  let reminded = 0;
  for (const r of due) {
    const when = formatFr(r.event.startAt);
    const link = r.event.meetingUrl ? ` Lien de connexion : ${r.event.meetingUrl}` : "";
    await createNotification({
      userId: r.userId,
      type: "REMINDER",
      title: `Rappel : ${r.event.title}`,
      message: `« ${r.event.title} » commence le ${when} (heure d'Abidjan).${link}`,
      link: `/evenements/${r.event.slug}`,
    });
    await prisma.eventRegistration.update({ where: { id: r.id }, data: { remindedAt: new Date() } });
    reminded++;
  }

  return Response.json({ ok: true, reminded });
}
