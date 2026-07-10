import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Rendu Markdown brandé pour le corps des articles de blog.
 * Server Component (rendu SSR → structure Hn réelle pour le SEO on-page).
 * Sécurité : react-markdown n'exécute PAS de HTML brut (pas de rehype-raw),
 * donc pas d'injection possible depuis le contenu rédigé en back-office.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => (
            <h2 className="mt-10 mb-4 font-display text-2xl font-bold text-navy sm:text-3xl">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-8 mb-3 font-display text-xl font-semibold text-navy">{children}</h3>
          ),
          p: ({ children }) => <p className="mb-5 text-[17px] leading-8 text-text-secondary">{children}</p>,
          ul: ({ children }) => <ul className="mb-6 ml-1 flex flex-col gap-2.5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-6 ml-5 flex list-decimal flex-col gap-2.5 marker:text-brand-blue-royal">{children}</ol>,
          li: ({ children }) => (
            <li className="relative pl-6 text-[17px] leading-7 text-text-secondary before:absolute before:left-0 before:top-3 before:h-1.5 before:w-1.5 before:rounded-full before:bg-gradient-to-r before:from-brand-violet before:to-brand-cyan [ol_&]:pl-1 [ol_&]:before:hidden">
              {children}
            </li>
          ),
          a: ({ href, children }) => {
            const external = !!href && /^https?:\/\//.test(href);
            return (
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="font-semibold text-brand-blue-royal underline decoration-brand-cyan/40 underline-offset-2 transition-colors hover:text-brand-violet"
              >
                {children}
              </a>
            );
          },
          strong: ({ children }) => <strong className="font-semibold text-navy">{children}</strong>,
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-4 border-brand-cyan/60 bg-surface-secondary/60 py-2 pl-5 pr-4 text-text-secondary italic">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-navy/[0.06] px-1.5 py-0.5 font-mono text-[0.9em] text-navy">{children}</code>
          ),
          h1: ({ children }) => (
            <h2 className="mt-10 mb-4 font-display text-2xl font-bold text-navy sm:text-3xl">{children}</h2>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
