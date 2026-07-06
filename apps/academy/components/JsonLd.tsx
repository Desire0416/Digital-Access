/**
 * Injecte des données structurées Schema.org (JSON-LD) pour le SEO.
 * L'échappement de `<` évite toute rupture de balise </script>.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
