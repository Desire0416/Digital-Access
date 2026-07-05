import { AdminPageHeader } from "@/components/admin/ui";
import { getAdminTickets } from "@/lib/admin-queries";
import { TicketsBoard } from "./TicketsBoard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Support" };

export default async function TicketsPage() {
  const tickets = await getAdminTickets();

  const openCount = tickets.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS",
  ).length;

  return (
    <>
      <AdminPageHeader
        title="Support"
        description={
          openCount > 0
            ? `Traitez les demandes clients — ${openCount} ticket${
                openCount > 1 ? "s" : ""
              } en attente de réponse.`
            : "Traitez les demandes clients — tickets, priorités et fil de discussion."
        }
      />
      <TicketsBoard tickets={tickets} />
    </>
  );
}
