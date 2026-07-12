import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { currentUser } from "@/lib/guards";

/* ══════════════════════════════════════════════════════════════════════════
   Upload d'image → Vercel Blob. Auth requise. Image uniquement, 5 Mo max,
   dossier strictement validé ([a-z0-9-]). Renvoie { url }.
   ══════════════════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);
const FOLDER_RE = /^[a-z0-9-]{1,40}$/;

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (!file.type.startsWith("image/") || !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Seules les images sont acceptées (PNG, JPG, WebP)." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image trop lourde (5 Mo maximum)." }, { status: 400 });
  }

  const rawFolder = form.get("folder");
  const folder = typeof rawFolder === "string" && FOLDER_RE.test(rawFolder) ? rawFolder : "uploads";

  // Nom de fichier assaini (le suffixe aléatoire évite toute collision).
  const safeName =
    file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "image";

  try {
    const blob = await put(`academy/${folder}/${safeName}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch {
    return NextResponse.json({ error: "Échec de l'envoi. Réessayez." }, { status: 500 });
  }
}
