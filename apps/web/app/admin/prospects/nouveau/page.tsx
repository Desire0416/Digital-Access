import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ListChecks, Lightbulb, Search, FileSearch, PhoneCall, Handshake } from "lucide-react";
import { currentUser } from "@da/auth/guards";
import { getAssignableCommercials } from "@/lib/crm-queries";
import { can } from "@/lib/permissions";
import { NewProspectForm } from "./NewProspectForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nouveau prospect" };

const STEPS = [
  { icon: Search, label: "Analyser la présence numérique de la structure" },
  { icon: FileSearch, label: "Réaliser un audit et déposer les preuves" },
  { icon: PhoneCall, label: "Contacter et enregistrer les échanges" },
  { icon: Handshake, label: "Qualifier le besoin puis créer une opportunité" },
];

export default async function NewProspectPage() {
  const [user, assignable] = await Promise.all([currentUser(), getAssignableCommercials()]);

  return (
    <div>
      <Link
        href="/admin/prospects"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft size={16} /> Retour aux prospects
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
        <NewProspectForm
          assignable={assignable}
          canAssign={can(user, "prospect:assign")}
          defaultAssigneeId={user?.id ?? ""}
        />

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
          <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
              <ListChecks size={17} className="text-brand-blue-royal" /> Prochaines étapes
            </h3>
            <ol className="mt-4 space-y-3">
              {STEPS.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-text-secondary">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-blue-vif/10 text-brand-blue-royal">
                    <s.icon size={15} />
                  </span>
                  <span className="pt-1">{s.label}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-brand-violet/15 bg-gradient-to-br from-brand-violet/[0.06] to-brand-cyan/[0.06] p-6">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
              <Lightbulb size={17} className="text-brand-violet" /> Bonnes pratiques
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li>• Renseignez le site web pour détecter les doublons automatiquement.</li>
              <li>• Notez le besoin numérique observé pour préparer l'audit.</li>
              <li>• Ajoutez un contact principal dès que possible.</li>
              <li>• Définissez une prochaine action pour ne pas perdre le prospect.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
