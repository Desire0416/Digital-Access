import { Eye, Undo2 } from "lucide-react";
import { currentUser } from "@da/auth/guards";
import { stopImpersonation } from "@/lib/impersonation";

const ROLE_FR: Record<string, string> = {
  LEARNER: "Apprenant",
  INSTRUCTOR: "Instructeur",
  CLIENT: "Client",
  ADMIN: "Administrateur",
  SUPER_ADMIN: "Super admin",
};

/**
 * Bandeau global affiché uniquement quand un admin consulte « en tant que »
 * quelqu'un d'autre. Toujours un moyen de revenir à son compte réel.
 */
export async function ImpersonationBanner() {
  const user = await currentUser();
  if (!user?.impersonatedBy) return null;

  const roleLabel = user.roles.map((r) => ROLE_FR[r] ?? r).join(" · ");
  const isRolePreview = user.impersonatedBy.id === user.id;

  return (
    <div className="relative z-[60] flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-gradient-to-r from-brand-violet to-brand-cyan px-4 py-2.5 text-center text-sm text-white">
      <span className="inline-flex items-center gap-2 font-medium">
        <Eye size={16} className="shrink-0" />
        {isRolePreview ? (
          <>
            Mode aperçu — vous naviguez avec le rôle{" "}
            <b className="font-bold">{roleLabel}</b>
          </>
        ) : (
          <>
            Mode aperçu — connecté en tant que{" "}
            <b className="font-bold">{user.name ?? user.email}</b>
            <span className="hidden opacity-90 sm:inline">({roleLabel})</span>
          </>
        )}
      </span>
      <form action={stopImpersonation}>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/30 transition-colors hover:bg-white/30"
        >
          <Undo2 size={13} />
          Revenir à mon compte admin
        </button>
      </form>
    </div>
  );
}
