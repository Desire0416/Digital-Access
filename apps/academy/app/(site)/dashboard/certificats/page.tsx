import { redirect } from "next/navigation";
import { ScrollText, ShieldCheck, Award } from "lucide-react";
import { GradientText } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getMyCertificates } from "@/lib/learn-queries";
import { DashboardHeading, EmptyState } from "@/components/learner-ui";
import { CERTIFICATE_TYPE_LABEL, CERTIFICATE_MENTION_LABEL } from "@/lib/learn-labels";

export const dynamic = "force-dynamic";

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function CertificatsPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/dashboard/certificats");
  const certificates = await getMyCertificates(user.id);

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeading
        eyebrow="Preuves"
        title={<>Mes <GradientText>certificats</GradientText></>}
        description="Vos certificats délivrés par preuve, avec un numéro unique vérifiable publiquement."
      />

      {certificates.length === 0 ? (
        <EmptyState
          icon={<ScrollText size={22} />}
          title="Pas encore de certificat"
          message="Terminez un parcours et validez ses projets pour obtenir un certificat vérifiable."
          action={{ href: "/career-paths", label: "Voir les parcours" }}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {certificates.map((c) => (
            <article key={c.id} className="relative overflow-hidden rounded-2xl border border-brand-violet/20 bg-surface-primary p-6">
              <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-da opacity-[0.08] blur-2xl" />
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-da text-white shadow-brand"><Award size={24} /></span>
                {c.mention && (
                  <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                    Mention {CERTIFICATE_MENTION_LABEL[c.mention] ?? c.mention}
                  </span>
                )}
              </div>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-brand-blue-royal">
                {CERTIFICATE_TYPE_LABEL[c.certificateType] ?? c.certificateType}
              </p>
              <h2 className="mt-1 font-display text-lg font-bold text-navy">{c.title}</h2>
              <p className="mt-1 text-sm text-text-secondary">Délivré le {DATE.format(new Date(c.issuedAt))}</p>

              {c.skillsValidated.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.skillsValidated.map((s) => (
                    <span key={s} className="rounded-md bg-navy/[0.05] px-2 py-0.5 text-xs font-medium text-text-secondary">{s}</span>
                  ))}
                </div>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-navy/[0.06] pt-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                  <ShieldCheck size={15} /> Vérifiable
                </span>
                <span className="font-mono text-xs text-text-muted">{c.certificateNumber}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
