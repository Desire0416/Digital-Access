import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { CHATBOT_SYSTEM_PROMPT } from "@/lib/chatbot/knowledge";

/* ══════════════════════════════════════════════════════════════════════════
   Route de chat de l'assistant IA du site (streaming).
   POST /api/chat  { messages: [{ role: "user"|"assistant", content: string }] }
   → flux texte (text/plain) des jetons de réponse de Claude.
   Garde-fous : clé API requise, rate-limit par IP, validation + troncature des
   messages, réponse courte, repli d'erreur brandé. Aucune écriture en base.
   ══════════════════════════════════════════════════════════════════════════ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = process.env.CHATBOT_MODEL || "claude-haiku-4-5-20251001";
const MAX_TOKENS = 800;
const MAX_MESSAGES = 24; // historique conservé (paires user/assistant)
const MAX_MSG_CHARS = 2000; // longueur max d'un message entrant

// Rate-limit best-effort en mémoire (les instances serverless sont éphémères ;
// pour un plafond strict multi-instances il faudrait un KV/Upstash).
const RL_MAX = 20; // requêtes
const RL_WINDOW_MS = 60_000; // par minute et par IP
const rl = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const e = rl.get(ip);
  if (!e || now > e.reset) {
    rl.set(ip, { count: 1, reset: now + RL_WINDOW_MS });
    return false;
  }
  e.count += 1;
  if (rl.size > 5000) {
    // purge paresseuse des entrées expirées
    for (const [k, v] of rl) if (now > v.reset) rl.delete(k);
  }
  return e.count > RL_MAX;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

/** Nettoie l'historique : rôles valides, contenu tronqué, commence par un
 *  message « user », se termine par « user », plafonné à MAX_MESSAGES. */
function sanitize(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  let msgs: ChatMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: unknown }).role;
    const content = (m as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;
    const text = content.trim().slice(0, MAX_MSG_CHARS);
    if (!text) continue;
    msgs.push({ role, content: text });
  }
  // Ne garder que la fin de la conversation.
  if (msgs.length > MAX_MESSAGES) msgs = msgs.slice(-MAX_MESSAGES);
  // Doit commencer par un message utilisateur.
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  // Le dernier message doit être une question de l'utilisateur.
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return [];
  return msgs;
}

function textResponse(body: string, status: number): Response {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

const FALLBACK =
  "Désolé, je rencontre un souci technique. Vous pouvez nous joindre directement sur WhatsApp au +225 07 57 90 88 84 ou via la page /contact.";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return textResponse(FALLBACK, 503);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip)) {
    return textResponse(
      "Vous envoyez des messages un peu vite. Patientez quelques secondes, puis réessayez 🙏",
      429,
    );
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return textResponse("Requête invalide.", 400);
  }

  const messages = sanitize((payload as { messages?: unknown })?.messages);
  if (!messages.length) return textResponse("Aucun message valide.", 400);

  const client = new Anthropic({ apiKey });

  let stream: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    stream = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: CHATBOT_SYSTEM_PROMPT,
      messages,
      stream: true,
    });
  } catch {
    return textResponse(FALLBACK, 502);
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sentAny = false;
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            sentAny = true;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch {
        // Erreur en cours de flux : le repli est géré dans le finally.
      } finally {
        // Si rien n'a pu être streamé (échec immédiat), envoyer le repli une fois.
        if (!sentAny) controller.enqueue(encoder.encode(FALLBACK));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
