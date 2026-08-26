import "server-only";
import { redirect } from "next/navigation";
import { prisma } from "@da/academy-db/client";
import { requireAdminFresh } from "./guards";

/* ══════════════════════════════════════════════════════════════════════════
   Analytics de fréquentation (back-office). Agrège la table PageView (vues de
   page anonymes ou rattachées à un compte) + les inscriptions (User.createdAt).
   Réservé aux administrateurs (revérification en base).
   ══════════════════════════════════════════════════════════════════════════ */

async function guard() {
  const admin = await requireAdminFresh();
  if (!admin) redirect("/connexion?callbackUrl=%2Fadmin");
  return admin;
}

const DAY_MS = 86_400_000;

function fillDaily(rows: { day: Date; [k: string]: number | Date }[], keys: string[], days: number) {
  const map = new Map(rows.map((r) => [new Date(r.day).toISOString().slice(0, 10), r]));
  const out: { date: string; label: string }[] & Record<string, unknown>[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    const iso = d.toISOString().slice(0, 10);
    const row = map.get(iso);
    const entry: Record<string, unknown> = {
      date: iso,
      label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    };
    for (const k of keys) entry[k] = row ? Number(row[k]) || 0 : 0;
    out.push(entry as { date: string; label: string });
  }
  return out;
}

export async function getAnalyticsOverview() {
  await guard();

  const [
    totals,
    unique30,
    uniqueToday,
    viewsDaily,
    signupsDaily,
    topPages,
    topReferrers,
    devices,
    loggedSplit,
    signupTotals,
  ] = await Promise.all([
    // Vues totales / 30j / 7j / aujourd'hui
    prisma.$queryRaw<{ all: bigint; d30: bigint; d7: bigint; today: bigint }[]>`
      SELECT
        count(*) AS all,
        count(*) FILTER (WHERE "createdAt" >= now() - interval '30 days') AS d30,
        count(*) FILTER (WHERE "createdAt" >= now() - interval '7 days') AS d7,
        count(*) FILTER (WHERE "createdAt" >= date_trunc('day', now())) AS today
      FROM "PageView"`,
    prisma.$queryRaw<{ c: bigint }[]>`
      SELECT count(DISTINCT "sessionId") AS c FROM "PageView" WHERE "createdAt" >= now() - interval '30 days'`,
    prisma.$queryRaw<{ c: bigint }[]>`
      SELECT count(DISTINCT "sessionId") AS c FROM "PageView" WHERE "createdAt" >= date_trunc('day', now())`,
    prisma.$queryRaw<{ day: Date; views: bigint; visitors: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, count(*) AS views, count(DISTINCT "sessionId") AS visitors
      FROM "PageView" WHERE "createdAt" >= now() - interval '30 days'
      GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<{ day: Date; signups: bigint }[]>`
      SELECT date_trunc('day', "createdAt") AS day, count(*) AS signups
      FROM "User" WHERE "createdAt" >= now() - interval '30 days' AND "deletedAt" IS NULL
      GROUP BY 1 ORDER BY 1`,
    prisma.$queryRaw<{ path: string; views: bigint }[]>`
      SELECT path, count(*) AS views FROM "PageView"
      WHERE "createdAt" >= now() - interval '30 days'
      GROUP BY path ORDER BY views DESC LIMIT 12`,
    prisma.$queryRaw<{ referrer: string; views: bigint }[]>`
      SELECT referrer, count(*) AS views FROM "PageView"
      WHERE "createdAt" >= now() - interval '30 days' AND referrer IS NOT NULL
      GROUP BY referrer ORDER BY views DESC LIMIT 8`,
    prisma.$queryRaw<{ device: string | null; views: bigint }[]>`
      SELECT device, count(*) AS views FROM "PageView"
      WHERE "createdAt" >= now() - interval '30 days'
      GROUP BY device`,
    prisma.$queryRaw<{ logged: bigint; anon: bigint }[]>`
      SELECT
        count(*) FILTER (WHERE "userId" IS NOT NULL) AS logged,
        count(*) FILTER (WHERE "userId" IS NULL) AS anon
      FROM "PageView" WHERE "createdAt" >= now() - interval '30 days'`,
    prisma.$queryRaw<{ all: bigint; d30: bigint; d7: bigint; today: bigint; never_active: bigint }[]>`
      SELECT
        count(*) AS all,
        count(*) FILTER (WHERE "createdAt" >= now() - interval '30 days') AS d30,
        count(*) FILTER (WHERE "createdAt" >= now() - interval '7 days') AS d7,
        count(*) FILTER (WHERE "createdAt" >= date_trunc('day', now())) AS today,
        count(*) FILTER (WHERE "lastActiveAt" IS NULL) AS never_active
      FROM "User" WHERE "deletedAt" IS NULL`,
  ]);

  const t = totals[0] ?? { all: 0n, d30: 0n, d7: 0n, today: 0n };
  const s = signupTotals[0] ?? { all: 0n, d30: 0n, d7: 0n, today: 0n, never_active: 0n };
  const ls = loggedSplit[0] ?? { logged: 0n, anon: 0n };
  const n = (v: bigint | number | undefined) => Number(v ?? 0);

  const daily = fillDaily(
    viewsDaily.map((r) => ({ day: r.day, views: n(r.views), visitors: n(r.visitors) })),
    ["views", "visitors"],
    30,
  ) as { date: string; label: string; views: number; visitors: number }[];

  const signups = fillDaily(
    signupsDaily.map((r) => ({ day: r.day, signups: n(r.signups) })),
    ["signups"],
    30,
  ) as { date: string; label: string; signups: number }[];

  return {
    views: { all: n(t.all), d30: n(t.d30), d7: n(t.d7), today: n(t.today) },
    uniqueVisitors: { d30: n(unique30[0]?.c), today: n(uniqueToday[0]?.c) },
    signups: { all: n(s.all), d30: n(s.d30), d7: n(s.d7), today: n(s.today), neverActive: n(s.never_active) },
    audience: { logged: n(ls.logged), anon: n(ls.anon) },
    devices: devices.map((d) => ({ device: d.device ?? "inconnu", views: n(d.views) })),
    daily,
    signupsDaily: signups,
    topPages: topPages.map((p) => ({ path: p.path, views: n(p.views) })),
    topReferrers: topReferrers.map((r) => ({ referrer: r.referrer, views: n(r.views) })),
  };
}

export type AnalyticsOverview = Awaited<ReturnType<typeof getAnalyticsOverview>>;
