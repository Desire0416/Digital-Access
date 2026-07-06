"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@da/db/client";
import { sendInvoiceEmail } from "@da/email";
import { requireAdmin } from "./admin-queries";

const FCFA = (n: number) =>
  new Intl.NumberFormat("fr-CI", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(n);

/** Envoi best-effort de la facture brandée au client. Ne bloque jamais l'action. */
async function notifyInvoiceSent(invoiceId: string): Promise<void> {
  try {
    const inv = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        number: true,
        total: true,
        dueDate: true,
        client: { select: { name: true, email: true } },
      },
    });
    if (!inv?.client?.email) return;
    await sendInvoiceEmail(inv.client.email, {
      name: inv.client.name || "cher client",
      number: inv.number,
      totalLabel: FCFA(inv.total),
      dueDateLabel: inv.dueDate
        ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(inv.dueDate)
        : undefined,
      invoiceId,
    });
  } catch (e) {
    console.error("[invoice] notifyInvoiceSent:", e);
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   Server Actions — CRM Admin Digital Access (mutations).
   Invariant sécurité : CHAQUE action commence par requireAdmin(). Les Server
   Actions sont directement appelables — jamais de confiance au client.
   ══════════════════════════════════════════════════════════════════════════ */

type Result = { ok: true } | { ok: false; error: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 70);
}

async function uniqueSlug(base: string, exists: (s: string) => Promise<boolean>): Promise<string> {
  const root = slugify(base) || "item";
  let candidate = root;
  let n = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${n++}`;
  }
  return candidate;
}

/* ─────────────────────────────────── Leads ─────────────────────────────── */

const LEAD_STATUSES = ["NEW", "CONTACTED", "QUOTE_SENT", "NEGOTIATION", "WON", "LOST"] as const;

export async function updateLeadStatus(input: { id: string; status: string }): Promise<Result> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1), status: z.enum(LEAD_STATUSES) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Statut invalide." };
  try {
    await prisma.lead.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${parsed.data.id}`);
    revalidatePath("/admin/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de mettre à jour le lead." };
  }
}

export async function assignLead(input: { id: string; assigneeId: string | null }): Promise<Result> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1), assigneeId: z.string().nullable() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  try {
    await prisma.lead.update({
      where: { id: parsed.data.id },
      data: { assigneeId: parsed.data.assigneeId },
    });
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${parsed.data.id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible d'assigner le lead." };
  }
}

export async function updateLeadNotes(input: { id: string; notes: string }): Promise<Result> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1), notes: z.string().max(5000) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Note invalide." };
  try {
    await prisma.lead.update({ where: { id: parsed.data.id }, data: { notes: parsed.data.notes } });
    revalidatePath(`/admin/leads/${parsed.data.id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible d'enregistrer la note." };
  }
}

export async function deleteLead(input: { id: string }): Promise<Result> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Identifiant invalide." };
  try {
    await prisma.lead.update({ where: { id: parsed.data.id }, data: { deletedAt: new Date() } });
    revalidatePath("/admin/leads");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de supprimer le lead." };
  }
}

/**
 * Convertit un lead gagné en projet client. Crée/réutilise un compte CLIENT à
 * partir de l'email du lead, crée le projet, le relie au lead et passe le lead
 * en WON.
 */
export async function convertLeadToProject(input: {
  leadId: string;
  title: string;
  budget?: number | null;
}): Promise<{ ok: true; projectId: string } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = z
    .object({
      leadId: z.string().min(1),
      title: z.string().min(3, "Titre trop court").max(120),
      budget: z.number().int().nonnegative().nullable().optional(),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Données invalides." };
  }
  const { leadId, title, budget } = parsed.data;

  try {
    const lead = await prisma.lead.findFirst({ where: { id: leadId, deletedAt: null } });
    if (!lead) return { ok: false, error: "Lead introuvable." };
    const already = await prisma.project.findUnique({ where: { leadId }, select: { id: true } });
    if (already) {
      return { ok: false, error: "Ce lead est déjà converti en projet." };
    }

    // Client : réutilise ou crée un compte CLIENT (inactif, sans mot de passe).
    let client = await prisma.user.findUnique({ where: { email: lead.email } });
    if (!client) {
      client = await prisma.user.create({
        data: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          roles: ["CLIENT"],
          isActive: false,
        },
      });
    } else if (!client.roles.includes("CLIENT")) {
      client = await prisma.user.update({
        where: { id: client.id },
        data: { roles: { set: [...client.roles, "CLIENT"] } },
      });
    }

    const slug = await uniqueSlug(
      title,
      async (s) => (await prisma.project.count({ where: { slug: s } })) > 0,
    );

    const project = await prisma.project.create({
      data: {
        clientId: client.id,
        leadId: lead.id,
        title,
        slug,
        type: lead.projectType,
        description: lead.message,
        budget: budget ?? null,
        status: "PENDING",
      },
    });

    await prisma.lead.update({ where: { id: lead.id }, data: { status: "WON" } });

    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${lead.id}`);
    revalidatePath("/admin/projets");
    revalidatePath("/admin/dashboard");
    return { ok: true, projectId: project.id };
  } catch {
    return { ok: false, error: "Échec de la conversion du lead." };
  }
}

/* ────────────────────────────────── Projets ────────────────────────────── */

const PROJECT_STATUSES = ["PENDING", "IN_PROGRESS", "REVIEW", "DELIVERED", "MAINTENANCE", "ARCHIVED"] as const;

export async function updateProjectStatus(input: { id: string; status: string }): Promise<Result> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1), status: z.enum(PROJECT_STATUSES) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Statut invalide." };
  try {
    await prisma.project.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
    revalidatePath("/admin/projets");
    revalidatePath(`/admin/projets/${parsed.data.id}`);
    revalidatePath("/mes-projets");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de mettre à jour le projet." };
  }
}

export async function addProjectStage(input: {
  projectId: string; name: string; description?: string;
}): Promise<Result> {
  await requireAdmin();
  const parsed = z
    .object({
      projectId: z.string().min(1),
      name: z.string().min(2).max(120),
      description: z.string().max(2000).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Étape invalide." };
  try {
    const last = await prisma.projectStage.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    await prisma.projectStage.create({
      data: {
        projectId: parsed.data.projectId,
        name: parsed.data.name,
        description: parsed.data.description,
        position: (last?.position ?? -1) + 1,
      },
    });
    revalidatePath(`/admin/projets/${parsed.data.projectId}`);
    revalidatePath("/mes-projets");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible d'ajouter l'étape." };
  }
}

export async function updateStageStatus(input: {
  stageId: string; projectId: string; status: string;
}): Promise<Result> {
  await requireAdmin();
  const parsed = z
    .object({
      stageId: z.string().min(1),
      projectId: z.string().min(1),
      status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Statut invalide." };
  try {
    await prisma.projectStage.update({
      where: { id: parsed.data.stageId },
      data: {
        status: parsed.data.status,
        completedAt: parsed.data.status === "COMPLETED" ? new Date() : null,
      },
    });
    revalidatePath(`/admin/projets/${parsed.data.projectId}`);
    revalidatePath("/mes-projets");
    revalidatePath("/admin/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de mettre à jour l'étape." };
  }
}

export async function deleteStage(input: { stageId: string; projectId: string }): Promise<Result> {
  await requireAdmin();
  const parsed = z.object({ stageId: z.string().min(1), projectId: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Identifiant invalide." };
  try {
    await prisma.projectStage.delete({ where: { id: parsed.data.stageId } });
    revalidatePath(`/admin/projets/${parsed.data.projectId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de supprimer l'étape." };
  }
}

export async function sendAdminProjectMessage(input: {
  projectId: string; content: string;
}): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ projectId: z.string().min(1), content: z.string().min(1).max(4000) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Message invalide." };
  try {
    await prisma.projectMessage.create({
      data: { projectId: parsed.data.projectId, userId: admin.id, content: parsed.data.content.trim() },
    });
    revalidatePath(`/admin/projets/${parsed.data.projectId}`);
    revalidatePath("/mes-projets");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible d'envoyer le message." };
  }
}

/* ───────────────────────────────── Factures ────────────────────────────── */

const INVOICE_STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"] as const;
const lineItemSchema = z.object({
  label: z.string().min(1).max(200),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
});

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: { number: { startsWith: `DA-${year}-` } },
  });
  return `DA-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function createInvoice(input: {
  clientId: string;
  projectId?: string | null;
  items: { label: string; quantity: number; unitPrice: number }[];
  taxRate?: number; // % (0 par défaut)
  dueDate?: string | null;
  status?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = z
    .object({
      clientId: z.string().min(1),
      projectId: z.string().nullish(),
      items: z.array(lineItemSchema).min(1, "Ajoutez au moins une ligne."),
      taxRate: z.number().min(0).max(100).optional(),
      dueDate: z.string().nullish(),
      status: z.enum(INVOICE_STATUSES).optional(),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Facture invalide." };
  }
  const { clientId, projectId, items, taxRate = 0, dueDate, status = "DRAFT" } = parsed.data;
  try {
    const amount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const tax = Math.round((amount * taxRate) / 100);
    const total = amount + tax;
    const invoice = await prisma.invoice.create({
      data: {
        clientId,
        projectId: projectId ?? null,
        number: await nextInvoiceNumber(),
        items: items as never,
        amount,
        tax,
        total,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
    if (status === "SENT") await notifyInvoiceSent(invoice.id);
    revalidatePath("/admin/factures");
    revalidatePath("/admin/dashboard");
    revalidatePath("/factures");
    return { ok: true, id: invoice.id };
  } catch {
    return { ok: false, error: "Impossible de créer la facture." };
  }
}

export async function updateInvoice(input: {
  id: string;
  items: { label: string; quantity: number; unitPrice: number }[];
  taxRate?: number;
  dueDate?: string | null;
}): Promise<Result> {
  await requireAdmin();
  const parsed = z
    .object({
      id: z.string().min(1),
      items: z.array(lineItemSchema).min(1, "Ajoutez au moins une ligne."),
      taxRate: z.number().min(0).max(100).optional(),
      dueDate: z.string().nullish(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Facture invalide." };
  const { id, items, taxRate = 0, dueDate } = parsed.data;
  try {
    const amount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const tax = Math.round((amount * taxRate) / 100);
    await prisma.invoice.update({
      where: { id },
      data: { items: items as never, amount, tax, total: amount + tax, dueDate: dueDate ? new Date(dueDate) : null },
    });
    revalidatePath("/admin/factures");
    revalidatePath(`/admin/factures/${id}`);
    revalidatePath("/factures");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de mettre à jour la facture." };
  }
}

export async function updateInvoiceStatus(input: { id: string; status: string }): Promise<Result> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1), status: z.enum(INVOICE_STATUSES) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Statut invalide." };
  try {
    await prisma.invoice.update({
      where: { id: parsed.data.id },
      data: {
        status: parsed.data.status,
        paidAt: parsed.data.status === "PAID" ? new Date() : null,
      },
    });
    if (parsed.data.status === "SENT") await notifyInvoiceSent(parsed.data.id);
    revalidatePath("/admin/factures");
    revalidatePath(`/admin/factures/${parsed.data.id}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/factures");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de mettre à jour le statut." };
  }
}

export async function deleteInvoice(input: { id: string }): Promise<Result> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Identifiant invalide." };
  try {
    await prisma.invoice.delete({ where: { id: parsed.data.id } });
    revalidatePath("/admin/factures");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de supprimer la facture." };
  }
}

/* ───────────────────────────────── Tickets ─────────────────────────────── */

const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export async function replyToTicket(input: { ticketId: string; content: string }): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = z.object({ ticketId: z.string().min(1), content: z.string().min(1).max(4000) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Réponse invalide." };
  try {
    await prisma.$transaction([
      prisma.ticketMessage.create({
        data: { ticketId: parsed.data.ticketId, userId: admin.id, content: parsed.data.content.trim() },
      }),
      prisma.ticket.update({
        where: { id: parsed.data.ticketId },
        data: { status: "IN_PROGRESS" },
      }),
    ]);
    revalidatePath(`/admin/tickets/${parsed.data.ticketId}`);
    revalidatePath("/admin/tickets");
    revalidatePath("/support");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible d'envoyer la réponse." };
  }
}

export async function updateTicketStatus(input: { id: string; status: string }): Promise<Result> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1), status: z.enum(TICKET_STATUSES) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Statut invalide." };
  try {
    await prisma.ticket.update({ where: { id: parsed.data.id }, data: { status: parsed.data.status } });
    revalidatePath("/admin/tickets");
    revalidatePath(`/admin/tickets/${parsed.data.id}`);
    revalidatePath("/admin/dashboard");
    revalidatePath("/support");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de mettre à jour le ticket." };
  }
}

export async function updateTicketPriority(input: { id: string; priority: string }): Promise<Result> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1), priority: z.enum(TICKET_PRIORITIES) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Priorité invalide." };
  try {
    await prisma.ticket.update({ where: { id: parsed.data.id }, data: { priority: parsed.data.priority } });
    revalidatePath("/admin/tickets");
    revalidatePath(`/admin/tickets/${parsed.data.id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de mettre à jour la priorité." };
  }
}

/* ─────────────────────────────────── Blog ──────────────────────────────── */

const BLOG_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const blogSchema = z.object({
  title: z.string().min(3, "Titre trop court").max(160),
  excerpt: z.string().min(10, "Extrait trop court").max(400),
  content: z.string().min(20, "Contenu trop court"),
  category: z.string().max(60).optional().nullable(),
  coverImage: z.string().url().optional().or(z.literal("")).nullable(),
  tags: z.array(z.string().max(40)).max(12).optional(),
  status: z.enum(BLOG_STATUSES),
  readMinutes: z.number().int().min(1).max(90).optional(),
});

export async function createBlogPost(
  input: z.input<typeof blogSchema>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  const parsed = blogSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Article invalide." };
  const d = parsed.data;
  try {
    const slug = await uniqueSlug(d.title, async (s) => (await prisma.blogPost.count({ where: { slug: s } })) > 0);
    const post = await prisma.blogPost.create({
      data: {
        title: d.title, slug, excerpt: d.excerpt, content: d.content,
        category: d.category || null, coverImage: d.coverImage || null, tags: d.tags ?? [],
        status: d.status, readMinutes: d.readMinutes ?? 3, authorId: admin.id,
        publishedAt: d.status === "PUBLISHED" ? new Date() : null,
      },
    });
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return { ok: true, id: post.id };
  } catch {
    return { ok: false, error: "Impossible de créer l'article." };
  }
}

export async function updateBlogPost(
  input: z.input<typeof blogSchema> & { id: string },
): Promise<Result> {
  await requireAdmin();
  const parsed = blogSchema.extend({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Article invalide." };
  const d = parsed.data;
  try {
    const existing = await prisma.blogPost.findUnique({ where: { id: d.id }, select: { publishedAt: true } });
    await prisma.blogPost.update({
      where: { id: d.id },
      data: {
        title: d.title, excerpt: d.excerpt, content: d.content,
        category: d.category || null, coverImage: d.coverImage || null, tags: d.tags ?? [],
        status: d.status, readMinutes: d.readMinutes ?? 3,
        publishedAt: d.status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : null,
      },
    });
    revalidatePath("/admin/blog");
    revalidatePath(`/admin/blog/${d.id}`);
    revalidatePath("/blog");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de mettre à jour l'article." };
  }
}

export async function deleteBlogPost(input: { id: string }): Promise<Result> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Identifiant invalide." };
  try {
    await prisma.blogPost.delete({ where: { id: parsed.data.id } });
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de supprimer l'article." };
  }
}

/* ──────────────────────────────── Portfolio ────────────────────────────── */

const portfolioSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().min(10),
  client: z.string().min(1).max(120),
  type: z.string().min(1).max(80),
  url: z.string().url().optional().or(z.literal("")).nullable(),
  coverImage: z.string().url().optional().or(z.literal("")).nullable(),
  technologies: z.array(z.string().max(40)).max(20).optional(),
  featured: z.boolean().optional(),
  testimonial: z.string().max(1000).optional().nullable(),
});

export async function createPortfolioItem(
  input: z.input<typeof portfolioSchema>,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireAdmin();
  const parsed = portfolioSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Réalisation invalide." };
  const d = parsed.data;
  try {
    const slug = await uniqueSlug(d.title, async (s) => (await prisma.portfolioProject.count({ where: { slug: s } })) > 0);
    const item = await prisma.portfolioProject.create({
      data: {
        title: d.title, slug, description: d.description, client: d.client, type: d.type,
        url: d.url || null, coverImage: d.coverImage || null,
        technologies: d.technologies ?? [], featured: d.featured ?? false,
        testimonial: d.testimonial || null,
      },
    });
    revalidatePath("/admin/portfolio");
    revalidatePath("/portfolio");
    return { ok: true, id: item.id };
  } catch {
    return { ok: false, error: "Impossible de créer la réalisation." };
  }
}

export async function updatePortfolioItem(
  input: z.input<typeof portfolioSchema> & { id: string },
): Promise<Result> {
  await requireAdmin();
  const parsed = portfolioSchema.extend({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Réalisation invalide." };
  const d = parsed.data;
  try {
    await prisma.portfolioProject.update({
      where: { id: d.id },
      data: {
        title: d.title, description: d.description, client: d.client, type: d.type,
        url: d.url || null, coverImage: d.coverImage || null,
        technologies: d.technologies ?? [], featured: d.featured ?? false,
        testimonial: d.testimonial || null,
      },
    });
    revalidatePath("/admin/portfolio");
    revalidatePath(`/admin/portfolio/${d.id}`);
    revalidatePath("/portfolio");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de mettre à jour la réalisation." };
  }
}

export async function deletePortfolioItem(input: { id: string }): Promise<Result> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Identifiant invalide." };
  try {
    await prisma.portfolioProject.delete({ where: { id: parsed.data.id } });
    revalidatePath("/admin/portfolio");
    revalidatePath("/portfolio");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de supprimer la réalisation." };
  }
}

/* ────────────────────────────── Utilisateurs ───────────────────────────── */

const ROLES = ["LEARNER", "CLIENT", "INSTRUCTOR", "ADMIN", "SUPER_ADMIN"] as const;

export async function updateUserRoles(input: { id: string; roles: string[] }): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ id: z.string().min(1), roles: z.array(z.enum(ROLES)).min(1, "Au moins un rôle.") })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.errors[0]?.message ?? "Rôles invalides." };
  // Seul un SUPER_ADMIN peut accorder/retirer le rôle SUPER_ADMIN.
  const grantsSuper = parsed.data.roles.includes("SUPER_ADMIN");
  if (grantsSuper && !admin.roles.includes("SUPER_ADMIN")) {
    return { ok: false, error: "Seul un super-administrateur peut accorder ce rôle." };
  }
  try {
    await prisma.user.update({ where: { id: parsed.data.id }, data: { roles: { set: parsed.data.roles as never } } });
    revalidatePath("/admin/utilisateurs");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de mettre à jour les rôles." };
  }
}

export async function toggleUserActive(input: { id: string; isActive: boolean }): Promise<Result> {
  await requireAdmin();
  const parsed = z.object({ id: z.string().min(1), isActive: z.boolean() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  try {
    await prisma.user.update({ where: { id: parsed.data.id }, data: { isActive: parsed.data.isActive } });
    revalidatePath("/admin/utilisateurs");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de modifier le compte." };
  }
}

/**
 * Suppression d'un compte — soft delete (deletedAt, rétention 30 j). Garde-fous :
 * pas soi-même, seul un super-administrateur peut supprimer un admin, jamais le
 * dernier super-administrateur. Le compte disparaît des listes et ne peut plus
 * se connecter (authorize filtre deletedAt ; Google refuse un compte supprimé).
 */
export async function deleteUser(input: { id: string }): Promise<Result> {
  const admin = await requireAdmin();
  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Identifiant invalide." };
  if (parsed.data.id === admin.id) {
    return { ok: false, error: "Vous ne pouvez pas supprimer votre propre compte." };
  }
  const target = await prisma.user.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, roles: true, deletedAt: true },
  });
  if (!target || target.deletedAt) return { ok: false, error: "Utilisateur introuvable." };

  const targetIsAdmin = target.roles.includes("ADMIN") || target.roles.includes("SUPER_ADMIN");
  if (targetIsAdmin && !admin.roles.includes("SUPER_ADMIN")) {
    return { ok: false, error: "Seul un super-administrateur peut supprimer un compte administrateur." };
  }
  if (target.roles.includes("SUPER_ADMIN")) {
    const supers = await prisma.user.count({
      where: { roles: { has: "SUPER_ADMIN" }, deletedAt: null },
    });
    if (supers <= 1) return { ok: false, error: "Impossible de supprimer le dernier super-administrateur." };
  }
  try {
    await prisma.user.update({
      where: { id: parsed.data.id },
      data: { deletedAt: new Date(), isActive: false },
    });
    revalidatePath("/admin/utilisateurs");
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de supprimer le compte." };
  }
}
