"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, ScanLine } from "lucide-react";
import { Button, cn } from "@da/ui";

/* ══════════════════════════════════════════════════════════════════════════
   Formulaire de vérification publique d'un certificat (cahier §20.4).
   Navigue vers /certificats/verifier?code=… ; la vérification serveur est
   effectuée par la page (verifyCertificate). Aucune donnée sensible ici.
   ══════════════════════════════════════════════════════════════════════════ */

export function VerifyForm({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [code, setCode] = React.useState(initialCode);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (!clean) return;
    router.push(`/certificats/verifier?code=${encodeURIComponent(clean)}`);
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <ScanLine size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ex. A1B2C3D4E5"
            aria-label="Code de vérification du certificat"
            autoComplete="off"
            spellCheck={false}
            className={cn(
              "h-14 w-full rounded-xl border border-navy/15 bg-surface-primary pl-12 pr-4 font-mono text-lg tracking-[0.15em] text-navy",
              "placeholder:tracking-normal placeholder:font-sans placeholder:text-text-muted",
              "transition-all focus:border-brand-blue-vif focus:outline-none focus:ring-2 focus:ring-brand-blue-vif/25",
            )}
          />
        </div>
        <Button type="submit" size="lg" className="h-14 sm:w-auto">
          <Search size={18} />
          Vérifier
        </Button>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-3 text-center text-xs text-text-muted"
      >
        Le code figure sur le certificat, sous le QR code.
      </motion.p>
    </form>
  );
}
