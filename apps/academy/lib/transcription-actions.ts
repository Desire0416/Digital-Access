"use server";

import { z } from "zod";
import { prisma } from "@da/academy-db/client";
import { requireCourseEditor } from "./guards";
import { generateTranscript, TranscriptionError, type TranscriptSource } from "./transcription/ai";

/* ══════════════════════════════════════════════════════════════════════════
   Action : générer la transcription / support écrit d'une leçon par l'IA.
   Réservée à l'éditeur de la formation (formateur propriétaire OU admin).
   Le texte est RENVOYÉ (pas enregistré) : le formateur le relit et l'insère
   dans le champ « contenu » avant d'enregistrer la leçon.
   ══════════════════════════════════════════════════════════════════════════ */

export type TranscriptResult = { ok: true; transcript: string } | { ok: false; error: string };

const schema = z.object({
  mode: z.enum(["text", "document", "context"]),
  sourceText: z.string().max(50000).optional(),
});

const isPdf = (url: string) => /\.pdf(\?.*)?$/i.test(url);

export async function generateLessonTranscript(
  lessonId: string,
  input: z.infer<typeof schema>,
): Promise<TranscriptResult> {
  const idParsed = z.string().min(1).safeParse(lessonId);
  const parsed = schema.safeParse(input);
  if (!idParsed.success || !parsed.success) return { ok: false, error: "Requête invalide." };

  const lesson = await prisma.lesson.findUnique({
    where: { id: idParsed.data },
    select: {
      id: true,
      title: true,
      fileUrl: true,
      module: { select: { course: { select: { id: true, title: true, objectives: true } } } },
    },
  });
  if (!lesson) return { ok: false, error: "Leçon introuvable." };

  const editor = await requireCourseEditor(lesson.module.course.id);
  if (!editor) return { ok: false, error: "Accès refusé." };

  const { mode, sourceText } = parsed.data;
  let source: TranscriptSource;
  if (mode === "text") {
    if (!sourceText || sourceText.trim().length < 30) {
      return { ok: false, error: "Collez au moins quelques phrases (script, sous-titres, notes…)." };
    }
    source = { kind: "text", text: sourceText.trim() };
  } else if (mode === "document") {
    if (!lesson.fileUrl || !isPdf(lesson.fileUrl)) {
      return {
        ok: false,
        error: "Aucun document PDF n'est attaché à cette leçon. Envoyez un PDF ou collez le texte source.",
      };
    }
    source = { kind: "document", url: lesson.fileUrl };
  } else {
    source = { kind: "context" };
  }

  try {
    const transcript = await generateTranscript({
      lessonTitle: lesson.title,
      courseTitle: lesson.module.course.title,
      objectives: lesson.module.course.objectives,
      source,
    });
    return { ok: true, transcript };
  } catch (e) {
    return { ok: false, error: e instanceof TranscriptionError ? e.message : "La génération a échoué. Réessayez." };
  }
}
