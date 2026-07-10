import "server-only";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { ImportError } from "./errors";

/* ══════════════════════════════════════════════════════════════════════════
   Extraction du texte brut d'un document importé (Word .docx / PDF), côté
   serveur uniquement (runtime nodejs). Sert de source à l'analyse IA.
   ══════════════════════════════════════════════════════════════════════════ */

function extOf(fileName: string): string {
  return (fileName.split(".").pop() ?? "").toLowerCase();
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Renvoie le texte brut d'un buffer selon son type. Lève ImportError sinon. */
export async function extractDocumentText(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<string> {
  const ext = extOf(fileName);
  let text = "";

  try {
    if (mimeType === DOCX_MIME || ext === "docx") {
      const { value } = await mammoth.extractRawText({ buffer });
      text = value;
    } else if (mimeType === "application/pdf" || ext === "pdf") {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const res = await extractText(pdf, { mergePages: true });
      text = Array.isArray(res.text) ? res.text.join("\n") : res.text;
    } else if (mimeType.startsWith("text/") || ext === "txt") {
      text = buffer.toString("utf8");
    } else {
      throw new ImportError("UNSUPPORTED", `Type non pris en charge : ${mimeType || ext}`);
    }
  } catch (e) {
    if (e instanceof ImportError) throw e;
    throw new ImportError("EXTRACT_FAILED", `Lecture impossible : ${(e as Error).message}`);
  }

  // Normalise les blancs et supprime les lignes vides répétées.
  const cleaned = text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (cleaned.length < 40) {
    throw new ImportError("EMPTY_TEXT", "Texte insuffisant extrait du document.");
  }
  return cleaned;
}
