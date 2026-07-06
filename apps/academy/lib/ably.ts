import "server-only";
import * as Ably from "ably";
import type { ChatMessageItem } from "./community-queries";

/* ══════════════════════════════════════════════════════════════════════════
   Ably — côté serveur (REST). Publie les messages de chat et génère les jetons
   d'authentification client. La clé (ABLY_API_KEY) ne quitte JAMAIS le serveur.
   Dégrade silencieusement si la clé n'est pas configurée.
   ══════════════════════════════════════════════════════════════════════════ */

let rest: Ably.Rest | null = null;

export function getAblyRest(): Ably.Rest | null {
  const key = process.env.ABLY_API_KEY;
  if (!key) return null;
  if (!rest) rest = new Ably.Rest(key);
  return rest;
}

export function ablyConfigured(): boolean {
  return Boolean(process.env.ABLY_API_KEY);
}

/** Nom de canal du chat d'un cours. */
export function chatChannelName(courseId: string): string {
  return `chat:${courseId}`;
}

/** Publie un message sur le canal du cours (best-effort, ne lève jamais). */
export async function publishChatMessage(
  courseId: string,
  message: ChatMessageItem,
): Promise<void> {
  const client = getAblyRest();
  if (!client) return;
  try {
    await client.channels.get(chatChannelName(courseId)).publish("message", message);
  } catch (e) {
    console.error("[ably] publishChatMessage:", e);
  }
}
