import type { ImportErrorCode } from "./types";

/** Erreur d'import typée → l'API renvoie un message FR + le code à l'UI. */
export class ImportError extends Error {
  code: ImportErrorCode;
  constructor(code: ImportErrorCode, message: string) {
    super(message);
    this.name = "ImportError";
    this.code = code;
  }
}

/** Message utilisateur (FR) associé à chaque code. */
export const IMPORT_ERROR_MESSAGE: Record<ImportErrorCode, string> = {
  AI_KEY_MISSING:
    "L'analyse par IA n'est pas configurée. Ajoutez ANTHROPIC_API_KEY dans les variables d'environnement.",
  AI_NO_OUTPUT: "L'IA n'a pas pu structurer le document. Réessayez ou saisissez le prospect manuellement.",
  AI_FAILED: "L'analyse par IA a échoué. Réessayez dans un instant.",
  EMPTY_TEXT: "Le fichier ne contient pas de texte lisible (document scanné/image ?).",
  UNSUPPORTED: "Format non pris en charge. Importez un fichier Word (.docx) ou PDF.",
  EXTRACT_FAILED: "Impossible de lire le contenu du fichier. Vérifiez qu'il n'est pas corrompu.",
};
