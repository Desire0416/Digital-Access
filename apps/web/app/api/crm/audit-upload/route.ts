import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { currentUser } from "@da/auth/guards";
import { isStaff } from "@/lib/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ══════════════════════════════════════════════════════════════════════════
   Upload de documents d'audit (PDF / Word / captures). Route DÉDIÉE, distincte
   de /api/upload (images) : réservée à l'équipe interne, types élargis, taille
   configurable. Ne renvoie que { url, fileName, mimeType, size } ; la VISIBILITÉ
   et le rattachement à l'audit sont posés côté serveur par addAuditDocument
   (re-vérification de propriété). Un document interne n'est donc jamais exposé
   à un client par cette route.
   ══════════════════════════════════════════════════════════════════════════ */

// Taille max configurable (défaut 15 Mo).
const MAX_MB = Number(process.env.CRM_MAX_DOC_MB) || 15;
const MAX_BYTES = MAX_MB * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
  "image/png",
  "image/jpeg",
  "image/webp",
]);
const ALLOWED_EXT = new Set(["pdf", "docx", "doc", "png", "jpg", "jpeg", "webp"]);

/** Nom de fichier sûr et lisible (pas d'exposition de chemin, pas de caractères dangereux). */
function safeName(name: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "document";
  return base.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "document";
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!isStaff(user)) {
    return NextResponse.json({ error: "Accès réservé à l'équipe interne." }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Le stockage n'est pas configuré (BLOB_READ_WRITE_TOKEN)." }, { status: 503 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    }
    const cleanName = safeName(file.name);
    const ext = (cleanName.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_MIME.has(file.type) || !ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ error: "Format non autorisé (PDF, Word, PNG, JPG ou WEBP)." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `Fichier trop lourd (${MAX_MB} Mo maximum).` }, { status: 400 });
    }

    const blob = await put(`audit-documents/${cleanName}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url, fileName: cleanName, mimeType: file.type, size: file.size });
  } catch (e) {
    console.error("[audit-upload] error:", e);
    return NextResponse.json({ error: "Échec de l'envoi. Réessayez." }, { status: 500 });
  }
}
