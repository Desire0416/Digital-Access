import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { currentUser } from "@da/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 Mo

/** Upload d'image vers Vercel Blob (utilisateur authentifié). Renvoie { url }. */
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Connectez-vous pour envoyer un fichier." }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Le stockage d'images n'est pas configuré (BLOB_READ_WRITE_TOKEN)." },
      { status: 503 },
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Le fichier doit être une image." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image trop lourde (5 Mo maximum)." }, { status: 400 });
    }

    const rawFolder = String(form.get("folder") ?? "uploads");
    const folder = /^[a-z0-9-]{1,32}$/.test(rawFolder) ? rawFolder : "uploads";
    const ext =
      (file.name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";

    const blob = await put(`${folder}/image.${ext}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("[upload] error:", e);
    return NextResponse.json({ error: "Échec de l'envoi. Réessayez." }, { status: 500 });
  }
}
