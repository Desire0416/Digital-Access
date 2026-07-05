import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@da/ui";

/** Rendu markdown riche des chapitres — typographie soignée, tableaux, code. */
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
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
