/* Erreurs typées de l'import de formation par fichier (docx / pdf / txt / md). */

export type ImportErrorCode =
  | "UNSUPPORTED"
  | "EMPTY_TEXT"
  | "EXTRACT_FAILED"
  | "AI_KEY_MISSING"
  | "AI_NO_OUTPUT"
  | "AI_FAILED"
  | "TOO_SHORT";

export class ImportError extends Error {
  code: ImportErrorCode;
  constructor(code: ImportErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "ImportError";
  }
}

/** Messages FR affichés à l'admin selon le code (sauf AI_FAILED qui porte son propre message). */
export const IMPORT_ERROR_MESSAGE: Record<ImportErrorCode, string> = {
  UNSUPPORTED: "Format non pris en charge. Déposez un fichier Word (.docx), PDF, Markdown (.md) ou texte (.txt).",
  EMPTY_TEXT: "Impossible de lire le contenu du fichier (document vide, protégé ou scanné en image).",
  EXTRACT_FAILED: "La lecture du fichier a échoué. Vérifiez qu'il n'est pas corrompu.",
  AI_KEY_MISSING: "L'import IA n'est pas configuré sur le serveur (ANTHROPIC_API_KEY).",
  AI_NO_OUTPUT: "L'IA n'a pas produit de structure exploitable. Réessayez.",
  AI_FAILED: "L'analyse IA a échoué. Réessayez dans un instant.",
  TOO_SHORT: "Le document est trop court pour construire une formation. Fournissez un programme détaillé.",
};
