// ─── Design system Digital Access — point d'entrée @da/ui ───

// Utilitaires
export { cn } from "./lib/cn";
export {
  buttonClasses,
  type ButtonVariant,
  type ButtonSize,
} from "./lib/buttonClasses";
export {
  formatFCFA,
  formatPrice,
  formatDuration,
  formatDate,
} from "./lib/format";

// Animations
export * from "./animations/variants";

// Hooks
export { useMediaQuery, useIsMobile, useIsDesktop } from "./hooks/useMediaQuery";
export { useScrolled } from "./hooks/useScrolled";

// Marque
export { Monogram, type MonogramProps } from "./components/Monogram";
export { Logo, type LogoProps } from "./components/Logo";
export { Loader, type LoaderProps } from "./components/Loader";

// Primitives de mise en page
export { Container } from "./components/Container";
export { Section } from "./components/Section";
export { GradientText } from "./components/GradientText";
export { Divider, IconBadge, Avatar, StarRating } from "./components/Primitives";

// Composants
export { Button, type ButtonProps } from "./components/Button";
export { Card, type CardProps } from "./components/Card";
export { Badge, type BadgeVariant, type BadgeProps } from "./components/Badge";
export { Input, Textarea, Field } from "./components/Field";
export { SectionHeading } from "./components/SectionHeading";

// Animation au scroll
export { Reveal } from "./components/Reveal";
export { StaggerGroup, StaggerItem } from "./components/Stagger";
export { AnimatedCounter } from "./components/AnimatedCounter";
