/** Squelette de chargement du back-office (limite le décalage de mise en page). */
export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      {/* En-tête */}
      <div className="mb-8 space-y-3">
        <div className="h-8 w-56 rounded-lg bg-navy/[0.06]" />
        <div className="h-4 w-80 max-w-full rounded bg-navy/[0.05]" />
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5"
          >
            <div className="h-10 w-10 rounded-xl bg-navy/[0.06]" />
            <div className="mt-4 h-7 w-24 rounded bg-navy/[0.06]" />
            <div className="mt-2 h-3 w-20 rounded bg-navy/[0.05]" />
          </div>
        ))}
      </div>

      {/* Graphes */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-navy/[0.07] bg-surface-primary p-5"
          >
            <div className="h-4 w-32 rounded bg-navy/[0.06]" />
            <div className="mt-5 h-48 rounded-xl bg-navy/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}
