import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { currentUser } from "@da/auth/guards";
import { getAssignableCommercials } from "@/lib/crm-queries";
import { can } from "@/lib/permissions";
import { NewProspectForm } from "./NewProspectForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nouveau prospect" };

export default async function NewProspectPage() {
  const [user, assignable] = await Promise.all([currentUser(), getAssignableCommercials()]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/prospects" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition-colors hover:text-navy">
        <ArrowLeft size={16} /> Retour aux prospects
      </Link>
      <NewProspectForm
        assignable={assignable}
        canAssign={can(user, "prospect:assign")}
        defaultAssigneeId={user?.id ?? ""}
      />
    </div>
  );
}
