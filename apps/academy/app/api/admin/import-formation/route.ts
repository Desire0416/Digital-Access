import type { NextRequest } from "next/server";
import { prisma } from "@da/db/client";
import { currentUser } from "@da/auth/guards";
import { clientIp, rateLimited, jsonError } from "@/lib/diagnostic/guard";
import { extractDocumentText } from "@/lib/import/extract";
import { analyzeDocument } from "@/lib/import/ai";
import { ImportError, IMPORT_ERROR_MESSAGE } from "@/lib/import/errors";
import { draftStats, type ImportAnalysis } from "@/lib/import/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // l'analyse multi-passes peut durer

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "ACADEMIC_MANAGER"];
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const ALLOWED_MIME = new Set([DOCX_MIME, "application/pdf", "text/plain", "text/markdown"]);
const ALLOWED_EXT = new Set(["docx", "pdf", "txt", "md", "markdown"]);
const MAX_BYTES = (Number(process.env.IMPORT_MAX_DOC_MB) || 15) * 1024 * 1024;

/** Nettoie le nom de fichier (ASCII, sans chemin) pour l'affichage/journal. */
function safeName(name: string): string {
  const base = String(name).split(/[\\/]/).pop() ?? "document";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "document";
}

export async function POST(req: NextRequest) {
  // Garde admin (le VRAI utilisateur suffit : la route ne fait que lire/analyser).
  const user = await currentUser();
  if (!user || !user.roles.some((r) => ADMIN_ROLES.includes(r)))
    return jsonError("Action réservée à l'administration.", 403);

  if (!process.env.ANTHROPIC_API_KEY)
    return jsonError(IMPORT_ERROR_MESSAGE.AI_KEY_MISSING, 503);
  if (rateLimited(clientIp(req)))
    return jsonError("Trop d'analyses en peu de temps. Patientez un instant.", 429);

  let file: File;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (!(f instanceof File)) return jsonError("Aucun fichier reçu.", 400);
    file = f;
  } catch {
    return jsonError("Requête invalide.", 400);
  }

  const cleanName = safeName(file.name);
  const ext = (cleanName.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_MIME.has(file.type) && !ALLOWED_EXT.has(ext))
    return jsonError(IMPORT_ERROR_MESSAGE.UNSUPPORTED, 400);
  if (file.size > MAX_BYTES)
    return jsonError(`Fichier trop volumineux (${Math.round(MAX_BYTES / 1024 / 1024)} Mo maximum).`, 400);

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await extractDocumentText(buffer, file.type, cleanName);

    const schools = await prisma.school.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { order: "asc" },
      select: { slug: true, name: true },
    });

    const { draft, warnings, model } = await analyzeDocument(text, schools);
    const stats = draftStats(draft);

    const payload: ImportAnalysis = {
      draft,
      meta: {
        sourceFileName: cleanName,
        model,
        moduleCount: stats.modules,
        lessonCount: stats.lessons,
        quizCount: stats.quizzes,
        questionCount: stats.questions,
        warnings,
      },
    };
    return Response.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof ImportError) {
      const status = e.code === "AI_KEY_MISSING" ? 503 : 422;
      const message = e.code === "AI_FAILED" ? e.message : IMPORT_ERROR_MESSAGE[e.code];
      return Response.json({ error: message, code: e.code }, { status, headers: { "Cache-Control": "no-store" } });
    }
    console.error("[academy] import-formation analyze:", e);
    return jsonError("L'analyse a échoué. Réessayez.", 500);
  }
}
