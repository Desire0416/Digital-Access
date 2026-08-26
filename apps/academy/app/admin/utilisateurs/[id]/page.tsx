import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Clock,
  BookOpen,
  Award,
  CreditCard,
  UsersRound,
  Target,
  BadgeCheck,
  ShieldCheck,
  Activity,
  FileText,
} from "lucide-react";
import { Avatar } from "@da/ui";
import { getUserDetailAdmin, listCoursesForPicker } from "@/lib/admin-queries";
import { currentUser } from "@/lib/guards";
import { formatFCFA, ENROLLMENT_STATUS_LABEL } from "@/lib/site";
import {
  AdminPageHeader,
  AdminCard,
  StatusPill,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_TONE,
  type PillTone,
} from "@/components/admin/ui";
import { UserActions } from "../UserActions";

export const metadata: Metadata = { title: "Fiche utilisateur — Administration" };

const ROLE_LABEL: Record<string, string> = {
  LEARNER: "Apprenant",
  INSTRUCTOR: "Formateur",
  GRADER: "Correcteur",
  MENTOR: "Mentor",
  SCHOOL_MANAGER: "Resp. école",
  PATH_MANAGER: "Resp. parcours",
  ORG_MANAGER: "Resp. entreprise",
  ACADEMIC_ADMIN: "Admin pédago.",
  SALES_ADMIN: "Admin commercial",
  SUPER_ADMIN: "Super admin",
};
const ADMIN_ROLES = new Set(["ACADEMIC_ADMIN", "SALES_ADMIN", "SUPER_ADMIN"]);

const ENROLLMENT_TONE: Record<string, PillTone> = {
  ACTIVE: "info", COMPLETED: "success", PAUSED: "warning", FAILED: "danger",
  CANCELLED: "neutral", EXPIRED: "neutral", PENDING: "warning",
};
const CERT_TONE: Record<string, PillTone> = { ACTIVE: "success", REVOKED: "danger", EXPIRED: "neutral" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function relativeDays(d: Date | null): string {
  if (!d) return "jamais";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 30) return `il y a ${days} j`;
  if (days < 365) return `il y a ${Math.floor(days / 30)} mois`;
  return `il y a ${Math.floor(days / 365)} an(s)`;
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy/[0.04] text-brand-blue-royal" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
        <div className="text-sm font-medium text-navy break-words">{value}</div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-navy/[0.07] bg-surface-primary p-3.5">
      <div className="flex items-center gap-2 text-text-muted">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-navy">{value}</p>
    </div>
  );
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [u, me, courseOptions] = await Promise.all([
    getUserDetailAdmin(id),
    currentUser(),
    listCoursesForPicker(),
  ]);
  if (!u) notFound();

  const actorIsSuper = !!me?.roles.includes("SUPER_ADMIN");
  const enrollCourses = courseOptions.map((c) => ({ id: c.id, title: c.title, level: c.level, price: c.price }));
  const statusLabel = u.deletedAt ? "Supprimé" : u.isActive ? "Actif" : "Inactif";
  const statusTone: PillTone = u.deletedAt ? "danger" : u.isActive ? "success" : "neutral";
  const neverActive = !u.lastActiveAt;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/utilisateurs"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft size={15} aria-hidden />
        Utilisateurs
      </Link>

      <AdminPageHeader
        eyebrow="Fiche utilisateur"
        title={u.name}
        description={u.email}
        actions={
          <UserActions
            user={{ id: u.id, name: u.name, roles: u.roles, isActive: u.isActive, isDeleted: !!u.deletedAt, emailVerified: !!u.emailVerified }}
            actorIsSuper={actorIsSuper}
            isSelf={u.id === me?.id}
            courses={enrollCourses}
          />
        }
      />

      {/* Identité + statut */}
      <AdminCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={u.name} src={u.avatar ?? undefined} className="h-20 w-20 shrink-0 text-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold text-navy">{u.name}</h2>
              <StatusPill label={statusLabel} tone={statusTone} />
              {u.emailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                  <BadgeCheck size={12} aria-hidden /> Email vérifié
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-[#b45309]">
                  <Mail size={12} aria-hidden /> Email non vérifié
                </span>
              )}
              {neverActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-error/10 px-2 py-0.5 text-[11px] font-semibold text-error">
                  <Clock size={12} aria-hidden /> Jamais connecté
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {u.roles.map((r) => (
                <span
                  key={r}
                  className={
                    ADMIN_ROLES.has(r)
                      ? "rounded-full bg-brand-violet/10 px-2 py-0.5 text-[11px] font-semibold text-brand-violet"
                      : "rounded-full bg-navy/[0.06] px-2 py-0.5 text-[11px] font-medium text-text-secondary"
                  }
                >
                  {ROLE_LABEL[r] ?? r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </AdminCard>

      {/* Statistiques d'engagement */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <Stat icon={<BookOpen size={14} />} value={u._count.enrollments} label="Formations" />
        <Stat icon={<Award size={14} />} value={u._count.certificates} label="Certificats" />
        <Stat icon={<UsersRound size={14} />} value={u._count.cohortMemberships} label="Cohortes" />
        <Stat icon={<Activity size={14} />} value={u._count.attempts} label="Évaluations" />
        <Stat icon={<FileText size={14} />} value={u._count.submissions} label="Dépôts" />
        <Stat icon={<CreditCard size={14} />} value={u._count.payments} label="Paiements" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Profil */}
        <AdminCard className="p-5">
          <h3 className="mb-4 font-display text-base font-bold text-navy">Profil</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Info icon={<Mail size={15} />} label="Email" value={u.email} />
            <Info icon={<Phone size={15} />} label="Téléphone" value={u.phone || <span className="text-text-muted">—</span>} />
            <Info icon={<MapPin size={15} />} label="Pays" value={u.country || <span className="text-text-muted">—</span>} />
            <Info icon={<Target size={15} />} label="Niveau déclaré" value={u.experienceLevel || <span className="text-text-muted">—</span>} />
            <Info icon={<CalendarDays size={15} />} label="Inscrit le" value={dateFmt.format(u.createdAt)} />
            <Info icon={<Clock size={15} />} label="Dernière activité" value={u.lastActiveAt ? `${dateFmt.format(u.lastActiveAt)} (${relativeDays(u.lastActiveAt)})` : <span className="text-error">Jamais connecté</span>} />
          </div>
          {u.objective && (
            <div className="mt-4 rounded-lg bg-surface-secondary/60 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Objectif</p>
              <p className="mt-1 text-sm text-navy">{u.objective}</p>
            </div>
          )}
          {u.bio && (
            <div className="mt-3 rounded-lg bg-surface-secondary/60 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Bio</p>
              <p className="mt-1 text-sm leading-relaxed text-navy whitespace-pre-line">{u.bio}</p>
            </div>
          )}
        </AdminCard>

        {/* Formations suivies */}
        <AdminCard className="p-5">
          <h3 className="mb-4 font-display text-base font-bold text-navy">
            Formations ({u._count.enrollments})
          </h3>
          {u.enrollments.length === 0 ? (
            <p className="rounded-lg bg-surface-secondary/60 py-6 text-center text-sm text-text-muted">Aucune inscription.</p>
          ) : (
            <ul className="space-y-3">
              {u.enrollments.map((e) => (
                <li key={e.id} className="rounded-lg border border-navy/[0.06] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">{e.course.title}</p>
                    <StatusPill label={ENROLLMENT_STATUS_LABEL[e.status] ?? e.status} tone={ENROLLMENT_TONE[e.status] ?? "neutral"} />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-navy/[0.06]">
                      <div className="h-full rounded-full bg-gradient-da" style={{ width: `${e.progress}%` }} aria-hidden />
                    </div>
                    <span className="text-xs font-bold tabular-nums text-navy">{e.progress}%</span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-text-muted">Inscrit le {dateFmt.format(e.enrolledAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Paiements */}
        <AdminCard className="p-5">
          <h3 className="mb-4 font-display text-base font-bold text-navy">Paiements ({u._count.payments})</h3>
          {u.payments.length === 0 ? (
            <p className="rounded-lg bg-surface-secondary/60 py-6 text-center text-sm text-text-muted">Aucun paiement.</p>
          ) : (
            <ul className="space-y-2.5">
              {u.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-navy/[0.06] p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{p.course?.title ?? "Paiement"}</p>
                    <p className="text-[11px] text-text-muted">{dateTimeFmt.format(p.createdAt)}{p.reference ? ` · ${p.reference}` : ""}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-sm font-bold tabular-nums text-navy">{formatFCFA(p.amount)}</span>
                    <StatusPill label={PAYMENT_STATUS_LABEL[p.status] ?? p.status} tone={PAYMENT_STATUS_TONE[p.status] ?? "neutral"} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        {/* Certificats + cohortes */}
        <AdminCard className="p-5">
          <h3 className="mb-4 font-display text-base font-bold text-navy">Certificats & cohortes</h3>
          {u.certificates.length === 0 && u.cohortMemberships.length === 0 ? (
            <p className="rounded-lg bg-surface-secondary/60 py-6 text-center text-sm text-text-muted">Aucun certificat ni cohorte.</p>
          ) : (
            <div className="space-y-4">
              {u.certificates.length > 0 && (
                <ul className="space-y-2">
                  {u.certificates.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 rounded-lg border border-navy/[0.06] p-3">
                      <Award size={16} className="shrink-0 text-warning" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy">{c.course?.title ?? "Certificat"}</p>
                        <p className="text-[11px] text-text-muted">Délivré le {dateFmt.format(c.issuedAt)} · {c.verifyCode}</p>
                      </div>
                      <StatusPill label={c.status} tone={CERT_TONE[c.status] ?? "neutral"} />
                    </li>
                  ))}
                </ul>
              )}
              {u.cohortMemberships.length > 0 && (
                <ul className="space-y-2">
                  {u.cohortMemberships.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 rounded-lg border border-navy/[0.06] p-3">
                      <UsersRound size={16} className="shrink-0 text-brand-violet" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy">{m.cohort.name}</p>
                        <p className="text-[11px] text-text-muted">Rejoint le {dateFmt.format(m.joinedAt)}</p>
                      </div>
                      <StatusPill label={m.status} tone={m.status === "ACTIVE" ? "success" : "neutral"} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
