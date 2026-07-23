import { UserCog, LogOut } from "lucide-react";
import type { Role } from "@da/academy-db/client";
import { getImpersonation } from "@/lib/guards";
import { stopActingAs } from "@/lib/impersonation-actions";

/* Bandeau permanent quand un super admin « agit en tant que » (§12). Rendu très
   visible pour ne jamais oublier qu'on n'est pas sur son propre compte. Le
   bouton de sortie est un Server Action (aucun JS client requis). */

const ROLE_LABEL: Record<Role, string> = {
  LEARNER: "Apprenant",
  INSTRUCTOR: "Formateur",
  GRADER: "Correcteur",
  MENTOR: "Mentor",
  SCHOOL_MANAGER: "Responsable d'école",
  PATH_MANAGER: "Responsable de parcours",
  ORG_MANAGER: "Responsable d'organisation",
  ACADEMIC_ADMIN: "Admin pédagogique",
  SALES_ADMIN: "Admin commercial",
  SUPER_ADMIN: "Super admin",
};

export async function ImpersonationBanner() {
  const state = await getImpersonation();
  if (!state) return null;

  const label =
    state.mode === "user"
      ? `Vous agissez en tant que ${state.targetName}`
      : `Prévisualisation du rôle « ${ROLE_LABEL[state.role as Role] ?? state.role} »`;

  return (
    <div className="relative z-[70] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-warning px-4 py-2 text-center text-[0.82rem] font-medium text-[#3b2a05]">
      <span className="inline-flex items-center gap-1.5">
        <UserCog size={15} />
        {label}
        <span className="hidden opacity-70 sm:inline">· connecté·e comme {state.real.name}</span>
      </span>
      <form
        action={async () => {
          "use server";
          await stopActingAs();
        }}
      >
        <button
          type="submit"
          className="inline-flex items-center gap-1 rounded-full bg-[#3b2a05] px-3 py-1 text-xs font-semibold text-warning transition-opacity hover:opacity-90"
        >
          <LogOut size={12} />
          Revenir à mon compte
        </button>
      </form>
    </div>
  );
}
