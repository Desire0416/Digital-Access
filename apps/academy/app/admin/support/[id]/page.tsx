import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Info } from "lucide-react";
import { Avatar } from "@da/ui";
import { getTicketAdmin, listSupportStaffForPicker } from "@/lib/support-admin-queries";
import { TICKET_STATUS_LABEL, TICKET_STATUS_TONE, TICKET_CATEGORY_LABEL } from "@/lib/support-labels";
import { AdminCard, StatusPill } from "@/components/admin/ui";
import { Markdown } from "@/components/Markdown";
import { TicketWorkbench } from "@/components/admin/TicketWorkbench";

export const metadata: Metadata = { title: "Ticket — Administration" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

/** Parse défensif des pièces jointes (Blob only) au rendu. */
function safeAttachments(value: unknown): { url: string; name: string }[] {
  if (!Array.isArray(value)) return [];
  const out: { url: string; name: string }[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const rec = item as Record<string, unknown>;
    const url = typeof rec.url === "string" ? rec.url : "";
    const name = typeof rec.name === "string" ? rec.name : "";
    try {
      const u = new URL(url);
      if (u.protocol === "https:" && u.hostname.endsWith(".public.blob.vercel-storage.com")) {
        out.push({ url, name: name.slice(0, 160) || "Pièce jointe" });
      }
    } catch {
      /* ignore */
    }
    if (out.length >= 4) break;
  }
  return out;
}

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [ticket, staff] = await Promise.all([getTicketAdmin(id), listSupportStaffForPicker()]);
  if (!ticket) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <Link href="/admin/support" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-navy">
        <ArrowLeft size={15} aria-hidden />
        File des tickets
      </Link>

      <AdminCard>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-text-muted">#{ticket.number}</span>
          <StatusPill label={TICKET_STATUS_LABEL[ticket.status]} tone={TICKET_STATUS_TONE[ticket.status]} />
          <span className="text-[11px] font-medium text-text-muted">{TICKET_CATEGORY_LABEL[ticket.category]}</span>
        </div>
        <h1 className="mt-2 font-display text-xl font-bold leading-tight text-navy">{ticket.subject}</h1>
        <div className="mt-3 flex items-center gap-2.5 border-t border-navy/[0.06] pt-3">
          <Avatar name={ticket.user.name} src={ticket.user.avatar ?? undefined} className="h-8 w-8" />
          <div className="min-w-0 text-sm">
            <span className="font-semibold text-navy">{ticket.user.name}</span>
            <span className="ml-2 text-xs text-text-muted">{ticket.user.email}</span>
          </div>
        </div>
      </AdminCard>

      {/* Fil */}
      <ul className="space-y-3">
        {ticket.messages.map((m) =>
          m.isSystem ? (
            <li key={m.id} className="flex items-center justify-center gap-2 py-1 text-xs text-text-muted">
              <Info size={13} aria-hidden />
              <span>
                {m.body} · {dateFmt.format(m.createdAt)}
              </span>
            </li>
          ) : (
            <li key={m.id} className={`flex gap-3 ${m.fromStaff ? "flex-row-reverse" : "flex-row"}`}>
              <div className="shrink-0">
                {m.fromStaff ? (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-da text-white shadow-brand" aria-hidden>
                    <ShieldCheck size={16} />
                  </span>
                ) : (
                  <Avatar name={m.author?.name ?? "Apprenant"} className="h-9 w-9" />
                )}
              </div>
              <div className={`min-w-0 max-w-[85%] rounded-2xl border p-3.5 ${m.fromStaff ? "border-brand-blue-vif/20 bg-brand-blue-vif/[0.05]" : "border-navy/[0.07] bg-surface-primary"}`}>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold text-navy">{m.fromStaff ? m.author?.name ?? "Support" : m.author?.name ?? "Apprenant"}</span>
                  <span className="text-[11px] text-text-muted">{dateFmt.format(m.createdAt)}</span>
                </div>
                <Markdown className="prose-sm">{m.body}</Markdown>
                {(() => {
                  const atts = safeAttachments(m.attachments);
                  return atts.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {atts.map((a, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <a key={i} href={a.url} target="_blank" rel="noopener noreferrer">
                          <img src={a.url} alt={a.name} className="h-24 w-auto rounded-lg border border-navy/10 object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
            </li>
          ),
        )}
      </ul>

      <TicketWorkbench
        ticketId={ticket.id}
        status={ticket.status}
        priority={ticket.priority}
        assignedToId={ticket.assignedToId}
        staff={staff}
      />
    </div>
  );
}
