import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEventAdmin, listEventContextForPicker } from "@/lib/event-admin-queries";
import { EventEditor } from "@/components/admin/EventEditor";

export const metadata: Metadata = { title: "Édition d'événement — Administration" };

export default async function AdminEventEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, context] = await Promise.all([getEventAdmin(id), listEventContextForPicker()]);
  if (!event) notFound();

  return <EventEditor event={event} context={context} />;
}
