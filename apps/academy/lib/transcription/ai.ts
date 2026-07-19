import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/* ══════════════════════════════════════════════════════════════════════════
   Transcription / support écrit d'une leçon, généré par l'IA intégrée (Claude).
   Claude traite du TEXTE et des PDF — pas d'audio. Trois sources possibles :
     · "text"     : script / sous-titres / notes collés par le formateur ;
     · "document" : un PDF hébergé (présentation, support) que Claude LIT ;
     · "context"  : à défaut de source, un support écrit rédigé à partir du
                    titre + objectifs (brouillon à relire).
   La transcription AUTOMATIQUE d'un fichier audio/vidéo (speech-to-text) exige
   un service dédié NON encore branché → `transcribeMedia` est le point d'ancrage
   prévu (voir TRANSCRIPTION_PROVIDER). server-only.
   ══════════════════════════════════════════════════════════════════════════ */

export class TranscriptionError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const MODEL = process.env.TRANSCRIPTION_MODEL || process.env.DIAGNOSTIC_MODEL || "claude-haiku-4-5";

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new TranscriptionError("AI_KEY_MISSING", "ANTHROPIC_API_KEY manquante.");
  return new Anthropic({ apiKey });
}

function frError(e: unknown): TranscriptionError {
  if (e instanceof TranscriptionError) return e;
  const err = e as { status?: number; message?: string };
  const msg = String(err?.message ?? "");
  let fr = "La génération de la transcription a échoué. Réessayez dans un instant.";
  if (err?.status === 401 || /authentication|invalid x-api-key|invalid api key/i.test(msg))
    fr = "Clé API Anthropic invalide. Vérifiez ANTHROPIC_API_KEY.";
  else if (/credit balance is too low|insufficient|billing|quota/i.test(msg))
    fr = "Crédit Anthropic insuffisant. Ajoutez des crédits, puis réessayez.";
  else if (err?.status === 429 || /rate.?limit|overloaded/i.test(msg))
    fr = "Service IA momentanément saturé. Réessayez dans quelques instants.";
  else if (err?.status === 404 || /model/i.test(msg))
    fr = "Modèle IA introuvable. Vérifiez TRANSCRIPTION_MODEL.";
  return new TranscriptionError("AI_FAILED", fr);
}

export type TranscriptSource =
  | { kind: "text"; text: string }
  | { kind: "document"; url: string }
  | { kind: "context" };

const SYSTEM = `Tu es assistant pédagogique d'Access Academy (académie numérique, Côte d'Ivoire). Tu produis la TRANSCRIPTION / le support écrit d'une leçon, en FRANÇAIS, au format MARKDOWN.
Règles :
- Structure claire : titres « ## », paragraphes courts, listes à puces, **gras** sur les termes clés, et un encadré « **À retenir** » en fin de section quand c'est utile.
- À partir d'un SCRIPT ou de SOUS-TITRES bruts : corrige la ponctuation et l'orthographe, supprime les hésitations, découpe en sections logiques — SANS inventer de contenu ni ajouter d'informations absentes.
- À partir d'un DOCUMENT (PDF) : restitue fidèlement le propos sous forme de support écrit lisible.
- À DÉFAUT de source (contexte seul) : rédige un support écrit fidèle au sujet annoncé, en restant prudent et général ; commence par une note « > *Brouillon généré à partir du titre et des objectifs — à relire et compléter.* ».
- Ton pédagogique, accessible, vouvoiement. Contextualise si pertinent (exemples ivoiriens). Ne renvoie QUE le markdown de la transcription, sans préambule.`;

/** Génère la transcription/support markdown d'une leçon à partir d'une source. */
export async function generateTranscript(params: {
  lessonTitle: string;
  courseTitle: string;
  objectives?: string[];
  source: TranscriptSource;
}): Promise<string> {
  const { lessonTitle, courseTitle, objectives = [], source } = params;
  const header =
    `FORMATION : « ${courseTitle} »\nLEÇON : « ${lessonTitle} »` +
    (objectives.length ? `\nOBJECTIFS : ${objectives.slice(0, 8).join(" ; ")}` : "");

  // Bloc(s) de contenu du message utilisateur.
  const content: Anthropic.ContentBlockParam[] = [];
  if (source.kind === "document") {
    content.push({ type: "document", source: { type: "url", url: source.url } });
    content.push({
      type: "text",
      text: `${header}\n\nRédige la transcription / le support écrit de cette leçon à partir du DOCUMENT ci-joint.`,
    });
  } else if (source.kind === "text") {
    content.push({
      type: "text",
      text: `${header}\n\nSOURCE (script / sous-titres / notes) à mettre en forme :\n"""\n${source.text.slice(0, 40000)}\n"""\n\nProduis la transcription structurée.`,
    });
  } else {
    content.push({
      type: "text",
      text: `${header}\n\nAucune source fournie : rédige un SUPPORT ÉCRIT (brouillon) fidèle au sujet de la leçon, à partir du titre et des objectifs.`,
    });
  }

  let resp: Anthropic.Message;
  try {
    resp = await client().messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: "user", content }],
    });
  } catch (e) {
    throw frError(e);
  }

  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new TranscriptionError("AI_NO_OUTPUT", "Aucune transcription générée.");
  return text;
}

/* ─── Point d'ancrage : transcription AUTOMATIQUE audio/vidéo (à venir) ─────────
   Nécessite un service de reconnaissance vocale (OpenAI Whisper, Deepgram…) et
   une clé dédiée. Quand TRANSCRIPTION_PROVIDER sera configuré, brancher l'appel
   ici (télécharger l'asset → STT → texte), puis passer le texte à
   generateTranscript({ source: { kind: "text", text } }) pour la mise en forme. */
export async function transcribeMedia(_mediaUrl: string): Promise<string> {
  throw new TranscriptionError(
    "STT_NOT_CONFIGURED",
    "La transcription automatique de l'audio/vidéo n'est pas encore activée. Collez le script ou les sous-titres, ou utilisez un document PDF.",
  );
}
