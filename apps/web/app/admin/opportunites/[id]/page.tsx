import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUser } from "@da/auth/guards";
import { getDeal } from "@/lib/crm-deal-queries";
import { getAssignableCommercials } from "@/lib/crm-queries";
import { can, isAdmin } from "@/lib/permissions";
import { DealWorkspace } from "./DealWorkspace";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const deal = await getDeal(id);
  return { title: deal ? deal.title : "Opportunité introuvable" };
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, deal, assignable] = await Promise.all([currentUser(), getDeal(id), getAssignableCommercials()]);
  if (!deal) notFound();

  return (
    <DealWorkspace
      deal={deal}
      assignable={assignable}
      canAssign={can(user, "prospect:assign")}
      canArchive={isAdmin(user) || can(user, "deal:update_assigned")}
      canQuote={can(user, "quote:prepare")}
    />
  );
}
