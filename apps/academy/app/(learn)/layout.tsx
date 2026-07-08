import type { Metadata } from "next";

/** Groupe « player » : immersif, sans en-tête ni pied de page du site. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface-secondary">{children}</div>;
}
