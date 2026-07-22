import { NextResponse } from "next/server";
import { incrementVisitCount } from "@/lib/visits";

// Jamais mis en cache : chaque appel incrémente réellement le compteur.
export const dynamic = "force-dynamic";

/** Enregistre une visite (appelé une fois par session depuis le client). */
export async function POST() {
  try {
    const value = await incrementVisitCount();
    return NextResponse.json({ value });
  } catch {
    // Un échec de comptage ne doit jamais perturber la navigation.
    return NextResponse.json({ value: null }, { status: 200 });
  }
}
