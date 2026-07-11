import "server-only";
import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { ImportError } from "./errors";

/* ══════════════════════════════════════════════════════════════════════════
   Extraction de texte depuis un fichier pédagogique (Word / PDF / Markdown /
   texte). On conserve le texte des titres et la structure en lignes ; l'IA
   s'appuie dessus pour reconstruire modules, leçons et quiz.
   Runtime Node requis (mammoth / unpdf).
   ══════════════════════════════════════════════════════════════════════════ */

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function ext(fileName: string): string {
  return (fileName.split(".").pop() ?? "").toLowerCase();
}

export async function extractDocumentText(buffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  const e = ext(fileName);
  let text = "";

  try {
    if (mimeType === DOCX_MIME || e === "docx") {
      const { value } = await mammoth.extractRawText({ buffer });
      text = value;
    } else if (mimeType === "application/pdf" || e === "pdf") {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const res = await extractText(pdf, { mergePages: true });
      text = Array.isArray(res.text) ? res.text.join("\n") : res.text;
    } else if (mimeType.startsWith("text/") || e === "txt" || e === "md" || e === "markdown") {
      text = buffer.toString("utf8");
    } else {
      throw new ImportError("UNSUPPORTED", "Format non pris en charge.");
    }
  } catch (err) {
    if (err instanceof ImportError) throw err;
    throw new ImportError("EXTRACT_FAILED", `Lecture impossible : ${(err as Error)?.message ?? "erreur inconnue"}`);
  }

  // Normalisation des blancs : \r\n → \n, on limite les lignes vides consécutives.
  const cleaned = text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (cleaned.length < 40) {
    throw new ImportError("EMPTY_TEXT", "Contenu illisible ou vide.");
  }
  return cleaned;
}
