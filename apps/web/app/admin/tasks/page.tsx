import type { Metadata } from "next";
import { currentUser } from "@da/auth/guards";
import { getTasks, getTaskCounts, type CrmTaskFilters } from "@/lib/crm-task-queries";
import { getAssignableCommercials } from "@/lib/crm-queries";
import { can } from "@/lib/permissions";
import { TasksBoard } from "./TasksBoard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tâches & relances" };

type SP = Promise<{ view?: string; priority?: string; assignee?: string }>;
const VIEWS = ["today", "overdue", "week", "open", "all"] as const;

export default async function TasksPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const view = (VIEWS as readonly string[]).includes(sp.view ?? "") ? (sp.view as CrmTaskFilters["view"]) : "open";
  const filters: CrmTaskFilters = { view, priority: sp.priority, assignee: sp.assignee };

  const [user, tasks, counts, assignable] = await Promise.all([
    currentUser(),
    getTasks(filters),
    getTaskCounts(),
    getAssignableCommercials(),
  ]);

  return (
    <TasksBoard
      tasks={tasks}
      counts={counts}
      assignable={assignable}
      canAssign={can(user, "prospect:assign")}
      filters={{ view: view ?? "open", priority: sp.priority ?? "", assignee: sp.assignee ?? "" }}
    />
  );
}
