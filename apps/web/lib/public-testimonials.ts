import { prisma } from "@da/db/client";
import { testimonials as mockTestimonials } from "@da/db";
import type { Testimonial } from "@da/db";

/* ══════════════════════════════════════════════════════════════════════════
   Témoignages publics — source de vérité = la base (pilotée par le CRM admin,
   /admin/temoignages). Repli automatique sur le mock si la base est vide ou
   injoignable (propriété « runs-without-DB »). Ainsi l'administrateur peut
   créer / modifier / retirer les témoignages depuis le back-office et le site
   les reflète immédiatement.
   ══════════════════════════════════════════════════════════════════════════ */

interface TestimonialRow {
  id: string;
  name: string;
  role: string | null;
  company: string | null;
  content: string;
  avatar: string | null;
  rating: number;
  featured: boolean;
}

function toTestimonial(t: TestimonialRow): Testimonial {
  return {
    id: t.id,
    name: t.name,
    role: t.role ?? "",
    company: t.company ?? "",
    content: t.content,
    avatar: t.avatar ?? undefined,
    rating: t.rating,
    featured: t.featured,
  };
}

/** Tous les témoignages publics (ordre de création). Repli sur le mock si base vide/injoignable. */
export async function getPublicTestimonials(): Promise<Testimonial[]> {
  try {
    const rows = await prisma.testimonial.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        role: true,
        company: true,
        content: true,
        avatar: true,
        rating: true,
        featured: true,
      },
    });
    if (rows.length === 0) return mockTestimonials;
    return rows.map(toTestimonial);
  } catch {
    return mockTestimonials;
  }
}

/** Témoignages mis en avant pour la page d'accueil (repli : featured du mock). */
export async function getFeaturedTestimonials(limit = 3): Promise<Testimonial[]> {
  const all = await getPublicTestimonials();
  const featured = all.filter((t) => t.featured);
  return (featured.length > 0 ? featured : all).slice(0, limit);
}
