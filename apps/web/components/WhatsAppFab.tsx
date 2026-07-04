"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/site";

/** Bouton flottant WhatsApp — canal de contact privilégié en Côte d'Ivoire. */
export function WhatsAppFab() {
  const href = `https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(
    "Bonjour Digital Access, je souhaite des informations sur vos services.",
  )}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Discuter sur WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-pulse-ring" aria-hidden />
      <MessageCircle size={26} className="relative" fill="currentColor" />
    </motion.a>
  );
}
