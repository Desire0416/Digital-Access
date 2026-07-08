"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@da/ui";
import { Select, type SelectOption } from "@/components/Select";
import { COURSE_STATUS, toneColor } from "@/components/admin/ui";
import { setShortCourseStatus } from "@/lib/admin-actions";

/* ══════════════════════════════════════════════════════════════════════════
   Contrôle de statut d'une formation courte — Select brandé (portail) qui
   pousse le nouveau statut via la Server Action, puis rafraîchit la vue.
   Restaure la valeur précédente et affiche l'erreur si l'action échoue.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUS_ORDER = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"];

export function ShortCourseStatusControl({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = React.useState(status);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => setValue(status), [status]);

  const options: SelectOption[] = STATUS_ORDER.map((s) => {
    const meta = COURSE_STATUS[s];
    return { value: s, label: meta.label, dotColor: toneColor(meta.tone) };
  });

  function onChange(next: string) {
    if (next === value || pending) return;
    const prev = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const res = await setShortCourseStatus(id, next);
      if (!res.ok) {
        setValue(prev);
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="w-full sm:w-44">
      <Select
        value={value}
        onChange={onChange}
        options={options}
        disabled={pending}
        ariaLabel="Changer le statut de la formation"
        buttonClassName={cn("py-2 text-xs", pending && "opacity-60")}
      />
      {error && <p className="mt-1 text-xs font-medium text-error">{error}</p>}
    </div>
  );
}
