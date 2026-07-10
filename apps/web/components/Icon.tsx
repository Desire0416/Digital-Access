import {
  Globe,
  Store,
  Building2,
  School,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Zap,
  Smartphone,
  Headphones,
  Target,
  Heart,
  Gem,
  Handshake,
  RefreshCw,
  Code,
  Palette,
  Megaphone,
  FileText,
  Rocket,
  Brain,
  Star,
  ArrowRight,
  Check,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  globe: Globe,
  store: Store,
  building: Building2,
  school: School,
  "graduation-cap": GraduationCap,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  zap: Zap,
  smartphone: Smartphone,
  headphones: Headphones,
  target: Target,
  heart: Heart,
  gem: Gem,
  handshake: Handshake,
  "refresh-cw": RefreshCw,
  code: Code,
  palette: Palette,
  megaphone: Megaphone,
  "file-text": FileText,
  rocket: Rocket,
  brain: Brain,
  star: Star,
  "arrow-right": ArrowRight,
  check: Check,
};

export interface IconProps {
  name: string;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

/** Rend une icône lucide à partir de son nom kebab-case. */
export function Icon({ name, className, size = 24, strokeWidth = 2 }: IconProps) {
  const Cmp = map[name] ?? Sparkles;
  return <Cmp className={className} size={size} strokeWidth={strokeWidth} />;
}
