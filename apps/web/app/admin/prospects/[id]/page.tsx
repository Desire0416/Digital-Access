import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUser } from "@da/auth/guards";
import { getProspect, getAssignableCommercials } from "@/lib/crm-queries";
import { can, isAdmin } from "@/lib/permissions";
import { ProspectWorkspace } from "./ProspectWorkspace";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const prospect = await getProspect(id);
  return { title: prospect ? prospect.organization.name : "Prospect introuvable" };
}

export default async function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, prospect, assignable] = await Promise.all([
    currentUser(),
    getProspect(id),
    getAssignableCommercials(),
  ]);
  if (!prospect) notFound();

  return (
    <ProspectWorkspace
      prospect={prospect}
      assignable={assignable}
      canAssign={can(user, "prospect:assign")}
      canArchive={can(user, "prospect:archive") || isAdmin(user)}
    />
  );
}
