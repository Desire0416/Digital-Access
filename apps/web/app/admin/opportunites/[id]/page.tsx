import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUser } from "@da/auth/guards";
import { getDeal } from "@/lib/crm-deal-queries";
import { getAssignableCommercials, getProjectManagers } from "@/lib/crm-queries";
import { can, isAdmin } from "@/lib/permissions";
import { DealWorkspace } from "./DealWorkspace";
import { ConversionActions } from "./ConversionActions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const deal = await getDeal(id);
  return { title: deal ? deal.title : "Opportunité introuvable" };
}

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, deal, assignable, projectManagers] = await Promise.all([
    currentUser(), getDeal(id), getAssignableCommercials(), getProjectManagers(),
  ]);
  if (!deal) notFound();

  const canRequest = can(user, "conversion:request");
  const canValidate = can(user, "conversion:validate");

  return (
    <DealWorkspace
      deal={deal}
      assignable={assignable}
      canAssign={can(user, "prospect:assign")}
      canArchive={isAdmin(user) || can(user, "deal:update_assigned")}
      canQuote={can(user, "quote:prepare")}
      conversionSlot={
        (canRequest || canValidate) ? (
          <ConversionActions deal={deal} canRequest={canRequest} canValidate={canValidate} projectManagers={projectManagers} />
        ) : null
      }
    />
  );
}
