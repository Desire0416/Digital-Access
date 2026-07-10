import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { currentUser } from "@da/auth/guards";
import { can, isStaff } from "@/lib/permissions";
import { extractDocumentText } from "@/lib/crm-import/extract-text";
import { extractProspectFromText } from "@/lib/crm-import/ai-extract";
import { ImportError, IMPORT_ERROR_MESSAGE } from "@/lib/crm-import/errors";
import type { ImportAnalysisResult } from "@/lib/crm-import/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* ══════════════════════════════════════════════════════════════════════════
   Analyse d'un fichier (Word/PDF) → extraction IA d'un prospect + audit.
   NE CRÉE RIEN en base : renvoie les données extraites + le document stocké,
   pour relecture/correction dans le formulaire d'import. La création est faite
   ensuite par l'action createProspectFromImport (gardée + re-validée).
   ══════════════════════════════════════════════════════════════════════════ */

const MAX_MB = Number(process.env.CRM_MAX_DOC_MB) || 15;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);
const ALLOWED_EXT = new Set(["pdf", "docx", "txt"]);

function safeName(name: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "document";
  return base.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100) || "document";
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  // Import réservé à l'équipe pouvant créer des prospects.
  if (!isStaff(user) || !can(user, "prospect:create")) {
    return NextResponse.json({ error: "Accès réservé à l'équipe commerciale." }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Le stockage n'est pas configuré (BLOB_READ_WRITE_TOKEN)." }, { status: 503 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: IMPORT_ERROR_MESSAGE.AI_KEY_MISSING, code: "AI_KEY_MISSING" }, { status: 503 });
  }

  let file: File;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (!(f instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
    file = f;
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const cleanName = safeName(file.name);
  const ext = (cleanName.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_MIME.has(file.type) && !ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: "Format non pris en charge (Word .docx, PDF ou .txt)." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `Fichier trop lourd (${MAX_MB} Mo maximum).` }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1) Extraction du texte (peut lever ImportError EMPTY_TEXT / EXTRACT_FAILED / UNSUPPORTED).
    const text = await extractDocumentText(buffer, file.type, cleanName);

    // 2) Extraction structurée par IA (peut lever ImportError AI_*).
    const extraction = await extractProspectFromText(text);

    // 3) Stockage du fichier d'origine (rattaché ensuite en AuditDocument).
    const blob = await put(`crm-imports/${cleanName}`, buffer, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type || "application/octet-stream",
    });

    const warnings: string[] = [];
    if (extraction.audit.findings.length === 0) warnings.push("Aucun constat détecté — vérifiez le document ou ajoutez-les manuellement.");
    if (!extraction.organization.website) warnings.push("Aucun site web détecté.");

    const result: ImportAnalysisResult = {
      extraction,
      document: { url: blob.url, fileName: cleanName, mimeType: file.type || "application/octet-stream", size: file.size },
      warnings,
    };
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof ImportError) {
      const status = e.code === "AI_KEY_MISSING" ? 503 : 422;
      // AI_FAILED porte un message FR précis (facturation, clé, quota…) ; les autres codes ont un message fixe.
      const error = e.code === "AI_FAILED" ? e.message : IMPORT_ERROR_MESSAGE[e.code];
      return NextResponse.json({ error, code: e.code }, { status });
    }
    console.error("[import-prospect] error:", e);
    return NextResponse.json({ error: "Échec de l'analyse. Réessayez." }, { status: 500 });
  }
}
