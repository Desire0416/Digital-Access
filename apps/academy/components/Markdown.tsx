import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@da/ui";
import { isLessonBlock } from "./lesson-blocks/registry";
import { LessonBlock } from "./lesson-blocks/LessonBlocks";

/** Rendu markdown riche des chapitres — typographie soignée, tableaux, code.
 *
 *  Les blocs de code balisés `da-*` sont rendus comme composants interactifs au
 *  lieu d'un bloc de code : blocs pédagogiques (da-etapes, da-quiz, da-comparatif,
 *  da-checklist, da-onglets) et visuels (da-schema, da-anatomie, da-graphique,
 *  da-figure). La liste fait foi dans lesson-blocks/registry.ts. Tout autre langage garde le rendu habituel, et un bloc
 *  `da-*` mal formé n'affiche rien plutôt que de casser la leçon.
 *  Aucun HTML brut n'est interprété : le contenu reste non injectable.
 */
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "prose prose-slate max-w-none",
        "prose-headings:font-display prose-headings:tracking-tight prose-headings:text-navy",
        "prose-p:leading-relaxed prose-p:text-navy/85",
        "prose-strong:text-navy prose-a:font-medium prose-a:text-brand-blue-royal hover:prose-a:text-brand-violet",
        "prose-blockquote:border-l-4 prose-blockquote:border-brand-blue-vif prose-blockquote:bg-brand-blue-vif/[0.06] prose-blockquote:py-1 prose-blockquote:not-italic",
        "prose-code:rounded prose-code:bg-navy/[0.06] prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-[0.85em] prose-code:text-brand-blue-royal prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:rounded-xl prose-pre:bg-surface-dark prose-pre:text-white/90",
        "prose-th:text-navy prose-td:text-navy/80",
        "prose-li:marker:text-brand-blue-vif",
        "prose-img:rounded-xl prose-img:border prose-img:border-navy/[0.08]",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className: cls, children: kids, ...props }) {
            const lang = /language-(\S+)/.exec(cls || "")?.[1];
            if (isLessonBlock(lang)) {
              return <LessonBlock lang={lang!} source={String(kids)} />;
            }
            return (
              <code className={cls} {...props}>
                {kids}
              </code>
            );
          },
          // Un bloc interactif remplace le <pre> : sans cela il resterait
          // encapsulé dans le fond sombre réservé au code.
          pre({ children: kids }) {
            const el = Array.isArray(kids) ? kids[0] : kids;
            const cls = (el as { props?: { className?: string } })?.props?.className;
            const lang = /language-(\S+)/.exec(cls || "")?.[1];
            if (isLessonBlock(lang)) return <>{kids}</>;
            return <pre>{kids}</pre>;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
