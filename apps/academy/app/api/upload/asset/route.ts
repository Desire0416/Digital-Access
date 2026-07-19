import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { currentUser, hasRole } from "@/lib/guards";

/* ══════════════════════════════════════════════════════════════════════════
   Upload d'assets de leçon → Vercel Blob (upload CÔTÉ CLIENT, multipart).
   Contrairement à /api/upload (images, ≤5 Mo via la fonction serveur), cette
   route délivre un JETON d'upload signé : le fichier part du navigateur DIRECT
   vers Blob, sans transiter par la fonction serverless (dépasse donc la limite
   de corps de 4,5 Mo — nécessaire pour PDF, PPTX, audio…).
   Auth : formateur ou admin uniquement. Types & taille bornés dans le jeton.
   ══════════════════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";

const EDITOR_ROLES = ["INSTRUCTOR", "ACADEMIC_ADMIN", "SUPER_ADMIN"] as const;

// 100 Mo — large pour un support de cours, sans permettre d'héberger n'importe quoi.
const MAX_SIZE = 100 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "text/plain",
  "text/csv",
  "application/zip",
  // Audio
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/aac",
  "audio/x-m4a",
];

export async function POST(req: Request): Promise<NextResponse> {
  const user = await currentUser();
  if (!user || !hasRole(user, [...EDITOR_ROLES])) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request: req,
      // Le jeton est délivré uniquement après ces contraintes (le client ne peut
      // pas les contourner : Blob les fait respecter à la réception).
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: MAX_SIZE,
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ userId: user.id }),
      }),
      // Callback de complétion (production only ; non appelé en local). Le client
      // récupère l'URL directement via la promesse d'upload — rien à faire ici.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Échec de l'envoi." },
      { status: 400 },
    );
  }
}
