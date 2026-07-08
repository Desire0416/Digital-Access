import { redirect } from "next/navigation";
import { Fingerprint, BadgeCheck, Circle } from "lucide-react";
import { GradientText, cn } from "@da/ui";
import { currentUser } from "@da/auth/guards";
import { getSkillsPassport } from "@/lib/learn-queries";
import { DashboardHeading, EmptyState } from "@/components/learner-ui";
import { SKILL_CATEGORY_LABEL } from "@/lib/learn-labels";

export const dynamic = "force-dynamic";

export default async function PasseportPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/dashboard/passeport");
  const skills = await getSkillsPassport(user.id);

  const validated = skills.filter((s) => s.validated).length;
  const byCategory = new Map<string, typeof skills>();
  for (const s of skills) {
    const arr = byCategory.get(s.category) ?? [];
    arr.push(s);
    byCategory.set(s.category, arr);
  }

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeading
        eyebrow="Employabilité"
        title={<>Passeport de <GradientText>compétences</GradientText></>}
        description="Les compétences développées par vos parcours. Celles validées par un certificat sont attestées par preuve."
      />

      {skills.length === 0 ? (
        <EmptyState
          icon={<Fingerprint size={22} />}
          title="Votre passeport est vierge"
          message="Inscrivez-vous à un parcours pour commencer à développer et attester des compétences recherchées."
          action={{ href: "/career-paths", label: "Explorer les parcours" }}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-4 rounded-2xl border border-navy/[0.07] bg-surface-primary p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-da text-white shadow-brand"><Fingerprint size={20} /></span>
              <div>
                <p className="font-display text-2xl font-extrabold text-navy">{skills.length}</p>
                <p className="text-xs text-text-secondary">Compétences en développement</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-success text-white shadow-brand"><BadgeCheck size={20} /></span>
              <div>
                <p className="font-display text-2xl font-extrabold text-navy">{validated}</p>
                <p className="text-xs text-text-secondary">Validées par certificat</p>
              </div>
            </div>
          </div>

          {[...byCategory.entries()].map(([cat, items]) => (
            <section key={cat}>
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-brand-blue-royal">
                {SKILL_CATEGORY_LABEL[cat] ?? cat}
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {items.map((s) => (
                  <div
                    key={s.slug}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border p-4",
                      s.validated ? "border-success/25 bg-success/[0.05]" : "border-navy/[0.07] bg-surface-primary",
                    )}
                  >
                    <span className={cn("mt-0.5 shrink-0", s.validated ? "text-success" : "text-text-muted")}>
                      {s.validated ? <BadgeCheck size={18} /> : <Circle size={16} />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy">{s.name}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {s.validated ? "Validée par preuve" : "En cours d'acquisition"} · {s.fromPaths[0]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
