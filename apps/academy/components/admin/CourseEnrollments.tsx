"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, UserPlus, Ban, RotateCcw, ArrowRight, Check, Users } from "lucide-react";
import { Avatar, cn } from "@da/ui";
import type { EnrollmentStatus, EnrollmentOrigin } from "@da/academy-db/client";
import { adminEnrollUserInCourse, setCourseEnrollmentStatus, searchUsersForCourseAction } from "@/lib/admin-actions";
import type { CourseEnrollmentRow } from "@/lib/admin-queries";
import { AdminCard, StatusPill } from "@/components/admin/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Onglet « Inscrits » du constructeur de formation (§30.2). Liste des apprenants
   inscrits (progression, statut, origine), inscription manuelle (recherche) et
   révocation / réactivation de l'accès. Mutations gardées par requireAdminFresh.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUS_META: Record<EnrollmentStatus, { label: string; tone: "success" | "danger" | "neutral" | "info" | "warning" }> = {
  ACTIVE: { label: "Actif", tone: "success" },
  COMPLETED: { label: "Terminé", tone: "info" },
  CANCELLED: { label: "Révoqué", tone: "danger" },
  PENDING: { label: "En attente", tone: "warning" },
  PAUSED: { label: "En pause", tone: "neutral" },
  FAILED: { label: "Échec", tone: "danger" },
  EXPIRED: { label: "Expiré", tone: "neutral" },
};
const ORIGIN_LABEL: Record<EnrollmentOrigin, string> = {
  DIRECT: "Direct",
  COHORT: "Cohorte",
  CAREER_PATH: "Parcours",
  ORGANIZATION: "Entreprise",
};
const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

type SearchResult = { id: string; name: string; email: string; avatar: string | null; enrolled: boolean };

export function CourseEnrollments({ courseId, enrollments }: { courseId: string; enrollments: CourseEnrollmentRow[] }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [searching, setSearching] = React.useState(false);

  React.useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    let alive = true;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchUsersForCourseAction(courseId, q);
        if (alive) setResults(r as SearchResult[]);
      } finally {
        if (alive) setSearching(false);
      }
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query, courseId]);

  function enroll(userId: string) {
    start(async () => {
      const res = await adminEnrollUserInCourse(userId, courseId);
      setMsg(res.ok ? { ok: true, text: res.message ?? "Inscrit·e." } : { ok: false, text: res.error });
      if (res.ok) {
        setQuery("");
        setResults([]);
        router.refresh();
      }
    });
  }

  function setStatus(userId: string, status: "ACTIVE" | "CANCELLED", name: string) {
    if (status === "CANCELLED" && !window.confirm(`Révoquer l'accès de ${name} à cette formation ? Il/elle ne pourra plus consulter le contenu (progression conservée).`)) return;
    start(async () => {
      const res = await setCourseEnrollmentStatus(userId, courseId, status);
      setMsg(res.ok ? { ok: true, text: res.message ?? "Mis à jour." } : { ok: false, text: res.error });
      if (res.ok) router.refresh();
    });
  }

  const activeCount = enrollments.filter((e) => e.status === "ACTIVE" || e.status === "COMPLETED").length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {/* ── Liste des inscrits ── */}
      <AdminCard className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-navy/[0.07] bg-surface-secondary/50 px-5 py-3.5">
          <h2 className="inline-flex items-center gap-2 font-display text-sm font-bold text-navy">
            <Users size={16} className="text-brand-blue-royal" aria-hidden />
            Inscrits
            <span className="rounded-full bg-navy/[0.06] px-2 py-0.5 text-xs font-semibold text-text-secondary">
              {activeCount} actif{activeCount > 1 ? "s" : ""}
            </span>
          </h2>
          <span className="text-xs text-text-muted">{enrollments.length} au total</span>
        </div>

        {enrollments.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-navy/[0.05] text-text-muted">
              <Users size={24} />
            </span>
            <p className="mt-3 text-sm text-text-secondary">Aucun apprenant inscrit pour l&apos;instant.</p>
          </div>
        ) : (
          <ul className="divide-y divide-navy/[0.05]">
            {enrollments.map((e) => {
              const meta = STATUS_META[e.status];
              const revoked = e.status === "CANCELLED";
              const locked = e.status === "COMPLETED";
              return (
                <li key={e.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={e.name} src={e.avatar ?? undefined} className="h-9 w-9 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy">{e.name}</p>
                      <p className="truncate text-xs text-text-muted">{e.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:w-40">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-text-secondary">
                        <span>Progression</span>
                        <span className="font-semibold tabular-nums text-navy">{Math.round(e.progress)}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-navy/[0.08]">
                        <div className="h-full rounded-full bg-gradient-da" style={{ width: `${Math.min(100, Math.max(0, e.progress))}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:w-44 sm:justify-end">
                    <div className="text-right">
                      <StatusPill label={meta.label} tone={meta.tone} />
                      <p className="mt-0.5 text-[11px] text-text-muted">
                        {ORIGIN_LABEL[e.origin]} · {dateFmt.format(new Date(e.enrolledAt))}
                      </p>
                    </div>
                    {!locked &&
                      (revoked ? (
                        <button
                          type="button"
                          onClick={() => setStatus(e.userId, "ACTIVE", e.name)}
                          disabled={pending}
                          title="Rétablir l'accès"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-success/25 text-success transition-colors hover:bg-success/[0.06] disabled:opacity-40"
                        >
                          <RotateCcw size={14} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setStatus(e.userId, "CANCELLED", e.name)}
                          disabled={pending}
                          title="Révoquer l'accès"
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-error/25 text-error transition-colors hover:bg-error/[0.06] disabled:opacity-40"
                        >
                          <Ban size={14} />
                        </button>
                      ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminCard>

      {/* ── Ajouter un apprenant ── */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <AdminCard className="p-5">
          <h3 className="inline-flex items-center gap-2 font-display text-sm font-bold text-navy">
            <UserPlus size={16} className="text-brand-violet" aria-hidden />
            Inscrire un apprenant
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            Accès immédiat et gratuit (inscription manuelle). L&apos;apprenant est notifié.
          </p>

          <div className="relative mt-3">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" aria-hidden />
            {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-text-muted" aria-hidden />}
            <input
              type="search"
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              placeholder="Rechercher par nom ou email…"
              aria-label="Rechercher un apprenant"
              className="h-10 w-full rounded-lg border border-navy/10 bg-surface-primary pl-9 pr-9 text-sm text-navy outline-none transition-colors placeholder:text-text-muted focus:border-brand-blue-vif/60"
            />
          </div>

          {results.length > 0 && (
            <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => !u.enrolled && enroll(u.id)}
                    disabled={pending || u.enrolled}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors",
                      u.enrolled
                        ? "cursor-default border-navy/[0.06] opacity-60"
                        : "border-navy/[0.08] hover:border-brand-violet/40 hover:bg-brand-violet/[0.04]",
                    )}
                  >
                    <Avatar name={u.name} src={u.avatar ?? undefined} className="h-8 w-8 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-navy">{u.name}</span>
                      <span className="block truncate text-xs text-text-muted">{u.email}</span>
                    </span>
                    {u.enrolled ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-success">
                        <Check size={13} /> inscrit
                      </span>
                    ) : (
                      <ArrowRight size={15} className="shrink-0 text-brand-violet" aria-hidden />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.trim() && !searching && results.length === 0 && (
            <p className="mt-3 text-center text-xs text-text-muted">Aucun utilisateur trouvé.</p>
          )}

          <AnimatePresence>
            {msg && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={cn("mt-3 rounded-lg px-3 py-2 text-xs font-medium", msg.ok ? "bg-success/10 text-success" : "bg-error/10 text-error")}
              >
                {msg.text}
              </motion.p>
            )}
          </AnimatePresence>
        </AdminCard>
      </div>
    </div>
  );
}
