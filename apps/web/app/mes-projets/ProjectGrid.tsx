"use client";

import { StaggerGroup, StaggerItem } from "@da/ui";
import type { ProjectListItem } from "@/lib/portal-queries";
import { ProjectCard } from "./ProjectCard";

export function ProjectGrid({ projects }: { projects: ProjectListItem[] }) {
  return (
    <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <StaggerItem key={project.id} className="h-full">
          <ProjectCard project={project} />
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
