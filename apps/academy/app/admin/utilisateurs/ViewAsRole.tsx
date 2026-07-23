"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, Loader2 } from "lucide-react";
import { viewAsRole } from "@/lib/impersonation-actions";
import type { Role } from "@da/academy-db/client";

/* Prévisualisation de rôle (§12) — un super admin « prend » un rôle pour voir
   l'interface correspondante. Passe par un Server Action (cookie signé) ; la
   sortie se fait via le bandeau « Revenir à mon compte ». */

const PREVIEW_ROLES: { value: Role; label: string }[] = [
  { value: "LEARNER", label: "Apprenant" },
  { value: "INSTRUCTOR", label: "Formateur" },
  { value: "GRADER", label: "Correcteur" },
  { value: "MENTOR", label: "Mentor" },
  { value: "ACADEMIC_ADMIN", label: "Admin pédagogique" },
];

export function ViewAsRole() {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  const [active, setActive] = React.useState<Role | null>(null);

  function preview(role: Role) {
    setActive(role);
    start(async () => {
      const res = await viewAsRole(role);
      if (res.ok) router.push("/");
      else setActive(null);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-navy/[0.08] bg-surface-secondary/60 p-3">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy">
        <Eye size={14} className="text-brand-blue-vif" />
        Prévisualiser l'interface d'un rôle :
      </span>
      {PREVIEW_ROLES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => preview(r.value)}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-navy/10 bg-surface-primary px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-brand-blue-vif/40 hover:text-brand-blue-royal disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending && active === r.value && <Loader2 size={12} className="animate-spin" />}
          {r.label}
        </button>
      ))}
    </div>
  );
}
