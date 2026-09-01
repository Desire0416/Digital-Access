/* Registre des blocs interactifs de leçon — module NEUTRE (ni serveur ni client).
   Il doit rester sans "use client" : le rendu markdown est un Server Component
   et doit pouvoir APPELER isLessonBlock(). Un helper exporté depuis un fichier
   "use client" ne serait pas appelable côté serveur. */

export const LESSON_BLOCKS = [
  "da-etapes",
  "da-quiz",
  "da-comparatif",
  "da-checklist",
  "da-onglets",
  "da-schema",
  "da-anatomie",
  "da-graphique",
] as const;

export type LessonBlockName = (typeof LESSON_BLOCKS)[number];

const SET: ReadonlySet<string> = new Set(LESSON_BLOCKS);

export function isLessonBlock(lang: string | undefined): boolean {
  return !!lang && SET.has(lang);
}
