"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Link2 } from "lucide-react";
import { cn } from "@da/ui";
import { siteConfig } from "@/lib/site";

/**
 * Boutons de partage réseaux (logos SVG inline — lucide n'a pas les marques).
 * Construit l'URL à partir du slug et de siteConfig.url.
 */
export function ShareButtons({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const url = `${siteConfig.url}/blog/${slug}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: "Partager sur Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      hover: "hover:bg-[#1877F2] hover:border-[#1877F2] hover:text-white",
      icon: (
        <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden>
          <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.49 0-1.96.93-1.96 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
        </svg>
      ),
    },
    {
      label: "Partager sur LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      hover: "hover:bg-[#0A66C2] hover:border-[#0A66C2] hover:text-white",
      icon: (
        <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden>
          <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.53C0 23.2.79 24 1.77 24h20.45c.98 0 1.78-.8 1.78-1.74V1.73C24 .77 23.2 0 22.22 0z" />
        </svg>
      ),
    },
    {
      label: "Partager sur X",
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      hover: "hover:bg-navy hover:border-navy hover:text-white",
      icon: (
        <svg viewBox="0 0 24 24" width={17} height={17} fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
        </svg>
      ),
    },
    {
      label: "Partager sur WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      hover: "hover:bg-[#25D366] hover:border-[#25D366] hover:text-white",
      icon: (
        <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden>
          <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.44 9.44 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.44 9.44 0 0 1 14.66-11.65 9.38 9.38 0 0 1 2.76 6.68c0 5.2-4.24 9.4-9.44 9.4zM20.52 3.48A11.36 11.36 0 0 0 12.05.02C5.8.02.72 5.1.72 11.35c0 2 .52 3.95 1.52 5.67L.63 23.03l6.15-1.61a11.32 11.32 0 0 0 5.27 1.34h.01c6.25 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.88-3.32-8.02z" />
        </svg>
      ),
    },
  ];

  function copy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm font-semibold text-navy">Partager :</span>
      <div className="flex flex-wrap items-center gap-2">
        {links.map((l) => (
          <motion.a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={l.label}
            whileTap={{ scale: 0.92 }}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full border border-navy/[0.1] bg-surface-primary text-text-secondary transition-colors duration-200",
              l.hover,
            )}
          >
            {l.icon}
          </motion.a>
        ))}
        <motion.button
          type="button"
          onClick={copy}
          aria-label="Copier le lien"
          whileTap={{ scale: 0.92 }}
          className={cn(
            "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-navy/[0.1] bg-surface-primary px-4 text-sm font-medium transition-colors duration-200",
            copied
              ? "border-success/30 bg-success/10 text-success"
              : "text-text-secondary hover:border-brand-blue-vif/50 hover:text-brand-blue-royal",
          )}
        >
          {copied ? <Check size={15} /> : <Link2 size={15} />}
          {copied ? "Lien copié" : "Copier"}
        </motion.button>
      </div>
    </div>
  );
}
