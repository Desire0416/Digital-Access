import { AdminPageHeader } from "@/components/admin/ui";
import { getAdminProjects } from "@/lib/admin-queries";
import { ProjectsBoard } from "./ProjectsBoard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Projets" };

export default async function ProjectsPage() {
  const projects = await getAdminProjects();

  return (
    <>
      <AdminPageHeader
        title="Projets"
        description="Pilotez les projets clients — avancement, étapes, livrables et facturation."
      />
      <ProjectsBoard projects={projects} />
    </>
  );
}
