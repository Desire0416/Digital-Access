"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@da/db/client";
import { currentUser } from "@da/auth/guards";

/* Édition du profil de l'utilisateur courant (chacun son propre profil). */

export type ProfileResult = { ok: true } | { ok: false; error: string };

const schema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(80),
  bio: z.string().trim().max(400).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  location: z.string().trim().max(100).optional().or(z.literal("")),
  website: z
    .string()
    .trim()
    .url("Adresse de site invalide (https://…)")
    .max(200)
    .optional()
    .or(z.literal("")),
  avatar: z.string().trim().max(600).optional().or(z.literal("")),
});

export async function getMyProfile() {
  const user = await currentUser();
  if (!user) return null;
  return prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      avatar: true,
      bio: true,
      phone: true,
      location: true,
      website: true,
      roles: true,
      createdAt: true,
    },
  });
}

export async function updateProfile(input: unknown): Promise<ProfileResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée — reconnectez-vous." };
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const d = parsed.data;
  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: d.name,
        bio: d.bio || null,
        phone: d.phone || null,
        location: d.location || null,
        website: d.website || null,
        avatar: d.avatar || null,
      },
    });
    revalidatePath("/profil");
    revalidatePath("/mon-espace");
    return { ok: true };
  } catch (e) {
    console.error("[profile] updateProfile:", e);
    return { ok: false, error: "Une erreur est survenue. Réessayez." };
  }
}
