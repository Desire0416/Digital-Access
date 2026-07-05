import { AdminPageHeader } from "@/components/admin/ui";
import { getLeads, getAssignableAdmins } from "@/lib/admin-queries";
import { LeadsBoard } from "./LeadsBoard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  const [leads, admins] = await Promise.all([getLeads(), getAssignableAdmins()]);

  return (
    <>
      <AdminPageHeader
        title="Leads"
        description="Pipeline commercial — glissez le suivi de chaque prospect."
      />
      <LeadsBoard leads={leads} admins={admins} />
    </>
  );
}
