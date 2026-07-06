import {
  GraduationCap,
  TrendingUp,
  Award,
  BadgeCheck,
  MessageSquare,
  AtSign,
  Flame,
  Bell,
  type LucideIcon,
} from "lucide-react";

/**
 * Métadonnées d'affichage par type de notification (local à la page).
 * — libellé FR, icône lucide et classes de teinte cohérentes avec la charte DA.
 * Non partagé : propre à la surface UI /notifications.
 */
export interface NotifTypeMeta {
  label: string;
  Icon: LucideIcon;
  /** classes texte + fond pour la pastille d'icône */
  tone: string;
}

export const NOTIF_TYPE_META: Record<string, NotifTypeMeta> = {
  COURSE_ENROLLED: {
    label: "Inscription",
    Icon: GraduationCap,
    tone: "text-brand-blue-royal bg-brand-blue-royal/10",
  },
  PROGRESS_MILESTONE: {
    label: "Progression",
    Icon: TrendingUp,
    tone: "text-[#0891a6] bg-brand-cyan/15",
  },
  CERTIFICATE_ISSUED: {
    label: "Certificat",
    Icon: Award,
    tone: "text-brand-violet bg-brand-violet/10",
  },
  PAYMENT_CONFIRMED: {
    label: "Paiement",
    Icon: BadgeCheck,
    tone: "text-success bg-success/10",
  },
  FORUM_REPLY: {
    label: "Forum",
    Icon: MessageSquare,
    tone: "text-brand-blue-royal bg-brand-blue-royal/10",
  },
  CHAT_MENTION: {
    label: "Mention",
    Icon: AtSign,
    tone: "text-[#0891a6] bg-brand-cyan/15",
  },
  STREAK_REMINDER: {
    label: "Série",
    Icon: Flame,
    tone: "text-[#B45309] bg-warning/15",
  },
  SYSTEM: {
    label: "Système",
    Icon: Bell,
    tone: "text-text-secondary bg-navy/[0.06]",
  },
};

const FALLBACK: NotifTypeMeta = {
  label: "Notification",
  Icon: Bell,
  tone: "text-text-secondary bg-navy/[0.06]",
};

export function notifMeta(type: string): NotifTypeMeta {
  return NOTIF_TYPE_META[type] ?? FALLBACK;
}

/** Ordre stable d'affichage des types dans le panneau de préférences. */
export const NOTIF_TYPE_ORDER = [
  "COURSE_ENROLLED",
  "PROGRESS_MILESTONE",
  "CERTIFICATE_ISSUED",
  "PAYMENT_CONFIRMED",
  "FORUM_REPLY",
  "CHAT_MENTION",
  "STREAK_REMINDER",
  "SYSTEM",
] as const;
