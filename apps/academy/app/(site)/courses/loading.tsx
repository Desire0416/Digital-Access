import { Container, Section } from "@da/ui";

/** Squelette brandé du catalogue — dimensions fixes (zéro CLS), pulsation douce. */
export default function CatalogueLoading() {
  return (
    <>
      {/* En-tête */}
      <div className="relative overflow-hidden border-b border-navy/[0.06] bg-surface-primary">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid opacity-60" />
        </div>
        <Container className="relative">
          <div className="animate-pulse py-12 sm:py-16">
            <div className="h-3 w-36 rounded-full bg-navy/[0.07]" />
            <div className="mt-5 h-10 w-72 max-w-full rounded-lg bg-navy/[0.08] sm:h-12 sm:w-96" />
            <div className="mt-4 h-4 w-full max-w-xl rounded-full bg-navy/[0.06]" />
            <div className="mt-2 h-4 w-2/3 max-w-md rounded-full bg-navy/[0.06]" />
            <div className="mt-6 h-7 w-48 rounded-full bg-gradient-da opacity-[0.12]" />
          </div>
        </Container>
      </div>

      {/* Filtres + grille */}
      <Section tone="muted" spacing="sm">
        <Container>
          <div className="animate-pulse rounded-2xl border border-navy/[0.07] bg-surface-primary p-4 sm:p-5">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="h-12 flex-1 rounded-lg bg-navy/[0.06]" />
              <div className="h-12 rounded-lg bg-navy/[0.06] md:w-52" />
            </div>
            <div className="mt-4 flex gap-2 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-9 w-28 shrink-0 rounded-full bg-navy/[0.06]" />
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-xl border border-navy/[0.07] bg-surface-primary"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="aspect-video bg-gradient-da opacity-[0.14]" />
                <div className="p-5">
                  <div className="h-3 w-20 rounded-full bg-navy/[0.07]" />
                  <div className="mt-3 h-4 w-4/5 rounded-full bg-navy/[0.08]" />
                  <div className="mt-2 h-4 w-3/5 rounded-full bg-navy/[0.06]" />
                  <div className="mt-5 flex items-center justify-between border-t border-navy/[0.06] pt-4">
                    <div className="h-3 w-24 rounded-full bg-navy/[0.06]" />
                    <div className="h-5 w-20 rounded-full bg-navy/[0.08]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
