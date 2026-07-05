import {
  Code,
  Palette,
  Megaphone,
  FileText,
  Rocket,
  Brain,
  Globe,
  GraduationCap,
  Award,
  PlayCircle,
  Users,
  Smartphone,
  Sparkles,
  Target,
  Zap,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  code: Code,
  palette: Palette,
  megaphone: Megaphone,
  "file-text": FileText,
  rocket: Rocket,
  brain: Brain,
  globe: Globe,
  "graduation-cap": GraduationCap,
  award: Award,
  "play-circle": PlayCircle,
  users: Users,
  smartphone: Smartphone,
  sparkles: Sparkles,
  target: Target,
  zap: Zap,
  "book-open": BookOpen,
};

export interface IconProps {
  name: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

/** Rend une icône lucide à partir de son nom kebab-case (icônes de catégories incluses). */
export function Icon({ name, className, size = 24, strokeWidth = 2 }: IconProps) {
  const Cmp = map[name] ?? Sparkles;
  return <Cmp className={className} size={size} strokeWidth={strokeWidth} />;
}
