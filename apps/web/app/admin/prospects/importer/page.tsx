import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ListChecks,
  Lightbulb,
  FileText,
  ScanText,
  PencilLine,
  CheckCircle2,
} from "lucide-react";
import { currentUser } from "@da/auth/guards";
import { getAssignableCommercials } from "@/lib/crm-queries";
import { can } from "@/lib/permissions";
import { ImportProspectForm } from "./ImportProspectForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Importer un prospect" };

const STEPS = [
  { icon: FileText, label: "Déposez le rapport d'audit (Word ou PDF)" },
  { icon: ScanText, label: "L'IA extrait l'organisation, la qualification et les constats" },
  { icon: PencilLine, label: "Relisez et corrigez chaque champ pré-rempli" },
  { icon: CheckCircle2, label: "Créez le prospect, l'organisation et l'audit en un clic" },
];

export default async function ImportProspectPage() {
  const [user, assignable] = await Promise.all([currentUser(), getAssignableCommercials()]);

  // Garde de page : réservé aux profils pouvant créer un prospect.
  if (!can(user, "prospect:create")) redirect("/admin/prospects");

  return (
    <div>
      <Link
        href="/admin/prospects"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft size={16} /> Retour aux prospects
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ImportProspectForm
          assignable={assignable}
          canAssign={can(user, "prospect:assign")}
          defaultAssigneeId={user?.id ?? ""}
        />

        <aside className="flex flex-col gap-4 lg:sticky lg:top-4">
          <div className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-6">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-navy">
              <ListChecks size={17} className="text-brand-blue-royal" /> Comment ça marche
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
              <Lightbulb size={17} className="text-brand-violet" /> Bon à savoir
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li>• L'analyse par l'IA peut prendre quelques dizaines de secondes.</li>
              <li>• L'extraction est une proposition : vérifiez toujours avant de créer.</li>
              <li>• Le document déposé reste rattaché à l'audit créé.</li>
              <li>• Formats acceptés : Word (.docx) et PDF.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
