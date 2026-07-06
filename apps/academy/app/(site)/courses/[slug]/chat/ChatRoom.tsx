"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MailWarning,
  SendHorizontal,
  Users,
  Wifi,
  X,
} from "lucide-react";
import * as Ably from "ably";
import { Avatar, cn } from "@da/ui";
import { sendChatMessage } from "@/lib/community-actions";
import type {
  ChatMessageItem,
  CommunityAccess,
  PresenceUser,
} from "@/lib/community-queries";

/* ══════════════════════════════════════════════════════════════════════════
   Chat de cours — temps réel via Ably.
   • Souscription au canal chat:{courseId} (jeton scellé au cours via
     /api/ably/token) : messages instantanés, présence live.
   • Fusion dédoublonnée par id ; ajout optimiste à l'envoi (l'écho serveur
     porte le même id → pas de doublon).
   • Dégrade proprement si Ably est indisponible : les messages initiaux
     restent affichés et l'envoi (persisté en base) fonctionne toujours.
   ══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────── Helper @mentions ──────────────────────────── */

/** Découpe un texte et met en évidence les @mentions (@ + lettres/chiffres/./-). */
function renderWithMentions(text: string): React.ReactNode {
  const parts = text.split(/(@[\w.-]+)/g);
  return parts.map((part, i) =>
    /^@[\w.-]+$/.test(part) ? (
      <span key={i} className="font-semibold text-brand-blue-royal">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

/* ───────────────────────────── Helper heure ────────────────────────────── */

const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
});
function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : timeFmt.format(d);
}

/* ══════════════════════════════ Composant ══════════════════════════════ */

export function ChatRoom({
  slug,
  initialMessages,
  initialPresence,
  access,
}: {
  slug: string;
  initialMessages: ChatMessageItem[];
  initialPresence: PresenceUser[];
  access: CommunityAccess;
}) {
  const meId = access.currentUser?.id ?? null;

  const [messages, setMessages] =
    React.useState<ChatMessageItem[]>(initialMessages);
  const [presence, setPresence] =
    React.useState<PresenceUser[]>(initialPresence);
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [rosterOpen, setRosterOpen] = React.useState(false);

  // Set des ids connus — dédoublonnage O(1) sans re-render.
  const knownIds = React.useRef<Set<string>>(
    new Set(initialMessages.map((m) => m.id)),
  );
  // Timestamp du dernier message pour le paramètre `after` du polling.
  const lastIsoRef = React.useRef<string | null>(
    initialMessages.at(-1)?.createdAt ?? null,
  );

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  // Contrôle l'auto-scroll : on ne force le bas que si l'utilisateur y est déjà.
  const atBottomRef = React.useRef(true);

  /* ── Auto-scroll en bas quand la liste change (si déjà proche du bas) ── */
  React.useEffect(() => {
    if (atBottomRef.current) {
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    atBottomRef.current = distance < 120;
  }, []);

  /* ── Fusion des nouveaux messages (dédoublonnés) ────────────────────── */
  const mergeMessages = React.useCallback((incoming: ChatMessageItem[]) => {
    if (incoming.length === 0) return;
    const fresh = incoming.filter((m) => !knownIds.current.has(m.id));
    if (fresh.length === 0) return;
    for (const m of fresh) knownIds.current.add(m.id);
    setMessages((prev) => {
      const next = [...prev, ...fresh];
      // Tri stable par date pour absorber tout décalage d'arrivée.
      next.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      lastIsoRef.current = next.at(-1)?.createdAt ?? lastIsoRef.current;
      return next;
    });
  }, []);

  /* ── Temps réel via Ably : messages instantanés + présence live ─────── */
  React.useEffect(() => {
    const me = access.currentUser;
    if (!access.canView || !me) return;

    let client: Ably.Realtime;
    try {
      client = new Ably.Realtime({
        authUrl: `/api/ably/token?slug=${encodeURIComponent(slug)}`,
        clientId: me.id,
      });
    } catch {
      return; // Ably indisponible : on reste sur les messages initiaux.
    }

    const channel = client.channels.get(`chat:${access.courseId}`);

    const onMessage = (msg: Ably.Message) => {
      const data = msg.data as ChatMessageItem | undefined;
      if (data && typeof data.id === "string") mergeMessages([data]);
    };
    void channel.subscribe("message", onMessage);

    const syncPresence = async () => {
      try {
        const members = await channel.presence.get();
        const byId = new Map<string, PresenceUser>();
        for (const m of members) {
          if (!m.clientId) continue;
          const d = (m.data ?? {}) as Partial<PresenceUser>;
          byId.set(m.clientId, {
            id: m.clientId,
            name: d.name ?? "Membre",
            avatar: d.avatar ?? null,
            isInstructor: Boolean(d.isInstructor),
          });
        }
        setPresence(Array.from(byId.values()));
      } catch {
        /* présence indisponible — on garde l'état courant */
      }
    };

    void channel.presence.subscribe(
      ["enter", "leave", "update", "present"],
      () => void syncPresence(),
    );
    channel.presence
      .enter({ name: me.name, avatar: me.avatar, isInstructor: access.isPrivileged })
      .then(() => syncPresence())
      .catch(() => {});

    return () => {
      channel.presence.leave().catch(() => {});
      channel.unsubscribe();
      channel.presence.unsubscribe();
      client.close();
    };
  }, [access, slug, mergeMessages]);

  /* ── Envoi d'un message (ajout optimiste avec l'id renvoyé) ─────────── */
  const send = React.useCallback(() => {
    const content = draft.trim();
    if (!content || pending || !access.canPost) return;
    setError(null);
    atBottomRef.current = true; // on veut voir notre propre message

    startTransition(async () => {
      const res = await sendChatMessage(slug, { content });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDraft("");
      // Ajout optimiste : le tick suivant ne le redoublera pas (id connu).
      if (!knownIds.current.has(res.id) && access.currentUser) {
        knownIds.current.add(res.id);
        const optimistic: ChatMessageItem = {
          id: res.id,
          content,
          createdAt: new Date().toISOString(),
          author: {
            id: access.currentUser.id,
            name: access.currentUser.name,
            avatar: access.currentUser.avatar,
            isInstructor: access.isPrivileged,
          },
        };
        lastIsoRef.current = optimistic.createdAt;
        setMessages((prev) => [...prev, optimistic]);
      }
    });
  }, [draft, pending, access, slug]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Entrée envoie ; Maj+Entrée insère une nouvelle ligne.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const onlineCount = presence.length;

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      {/* ══════════════ Colonne principale : fil de discussion ══════════════ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre d'état compacte + bouton roster (mobile) */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2.5 sm:px-6">
          <span className="inline-flex items-center gap-2 text-xs font-medium text-white/55">
            <Wifi size={14} className="text-success" aria-hidden />
            Actualisé en direct
          </span>
          <button
            type="button"
            onClick={() => setRosterOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/10 lg:hidden"
          >
            <Users size={13} aria-hidden />
            {onlineCount} en ligne
          </button>
          <span className="hidden items-center gap-1.5 text-xs font-medium text-white/45 lg:inline-flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            {onlineCount} membre{onlineCount > 1 ? "s" : ""} en ligne
          </span>
        </div>

        {/* Liste des messages (scroll) */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6"
        >
          {messages.length === 0 ? (
            <EmptyState courseTitle={access.courseTitle} />
          ) : (
            <ul className="mx-auto flex max-w-3xl flex-col gap-4">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  const mine = meId != null && m.author.id === meId;
                  const prev = messages[i - 1];
                  // Regroupe les messages consécutifs du même auteur.
                  const grouped =
                    prev != null && prev.author.id === m.author.id && !mine;
                  return (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      mine={mine}
                      grouped={grouped}
                    />
                  );
                })}
              </AnimatePresence>
              <div ref={bottomRef} />
            </ul>
          )}
        </div>

        {/* ══════════════ Zone de saisie / bandeau vérif ══════════════ */}
        <div className="shrink-0 border-t border-white/10 bg-surface-dark/80 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl px-4 py-3 sm:px-6 sm:py-4">
            {access.canPost ? (
              <>
                <div className="flex items-end gap-2.5">
                  <div className="relative min-w-0 flex-1">
                    <textarea
                      value={draft}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        if (error) setError(null);
                      }}
                      onKeyDown={onKeyDown}
                      rows={1}
                      placeholder="Écrivez un message…  (Entrée pour envoyer, Maj+Entrée = saut de ligne)"
                      className={cn(
                        "block max-h-40 min-h-[2.75rem] w-full resize-none rounded-2xl border px-4 py-3 text-sm text-white placeholder:text-white/35 transition-all duration-200 focus:outline-none focus:ring-2",
                        "border-white/10 bg-white/[0.06] focus:border-brand-cyan/60 focus:ring-brand-cyan/25",
                      )}
                      style={{ scrollbarWidth: "thin" }}
                    />
                  </div>
                  <motion.button
                    type="button"
                    onClick={send}
                    disabled={draft.trim().length === 0 || pending}
                    whileTap={{ scale: 0.94 }}
                    transition={{ type: "spring", stiffness: 400, damping: 22 }}
                    aria-label="Envoyer le message"
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white shadow-brand transition-opacity",
                      "bg-gradient-da",
                      draft.trim().length === 0 || pending
                        ? "cursor-not-allowed opacity-40"
                        : "hover:opacity-90",
                    )}
                  >
                    {pending ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                    ) : (
                      <SendHorizontal size={18} aria-hidden />
                    )}
                  </motion.button>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-2 text-xs font-medium text-error"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3.5">
                <span
                  aria-hidden
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warning/20 text-warning"
                >
                  <MailWarning size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    Confirmez votre email pour discuter
                  </p>
                  <p className="text-xs leading-relaxed text-white/60">
                    Vous pouvez suivre la conversation, mais l&apos;envoi de
                    messages nécessite un email vérifié.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════ Barre latérale « En ligne » (desktop) ══════════════ */}
      <aside className="hidden w-64 shrink-0 flex-col border-l border-white/[0.06] bg-white/[0.02] lg:flex">
        <RosterContent presence={presence} meId={meId} />
      </aside>

      {/* ══════════════ Drawer roster (mobile) ══════════════ */}
      <AnimatePresence>
        {rosterOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Fermer la liste des membres"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setRosterOpen(false)}
              className="absolute inset-0 z-40 bg-navy/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 34 }}
              className="absolute inset-y-0 right-0 z-50 flex w-72 max-w-[85%] flex-col border-l border-white/10 bg-surface-dark-card shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
                <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-white">
                  <Users size={16} className="text-brand-cyan" aria-hidden />
                  En ligne
                </span>
                <button
                  type="button"
                  onClick={() => setRosterOpen(false)}
                  aria-label="Fermer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
              <RosterContent presence={presence} meId={meId} hideHeader />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════ Bulle message ══════════════════════════════ */

function MessageBubble({
  message,
  mine,
  grouped,
}: {
  message: ChatMessageItem;
  mine: boolean;
  grouped: boolean;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={cn("flex items-end gap-2.5", mine && "flex-row-reverse")}
    >
      {/* Avatar (autres uniquement) — masqué pour les messages groupés. */}
      {!mine ? (
        grouped ? (
          <span className="w-9 shrink-0" aria-hidden />
        ) : (
          <Avatar
            name={message.author.name}
            src={message.author.avatar ?? undefined}
            className={cn(
              "h-9 w-9 shrink-0 text-xs",
              message.author.isInstructor && "ring-2 ring-brand-cyan/50",
            )}
          />
        )
      ) : null}

      <div
        className={cn(
          "flex min-w-0 max-w-[82%] flex-col gap-1 sm:max-w-[75%]",
          mine && "items-end",
        )}
      >
        {/* En-tête : nom + badge instructeur (autres, non groupés). */}
        {!mine && !grouped && (
          <span className="flex items-center gap-1.5 px-1 text-xs">
            <span className="font-semibold text-white/85">
              {message.author.name}
            </span>
            {message.author.isInstructor && (
              <span className="rounded-full bg-gradient-da px-1.5 py-0.5 text-[0.625rem] font-bold uppercase leading-none tracking-wide text-white">
                Instructeur
              </span>
            )}
          </span>
        )}

        <div
          className={cn(
            "w-fit max-w-full whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
            mine
              ? "rounded-br-md bg-gradient-da text-white"
              : "rounded-bl-md border border-white/10 bg-white/[0.07] text-white/90",
          )}
        >
          {renderWithMentions(message.content)}
        </div>

        <span
          className={cn(
            "px-1 text-[0.65rem] tabular-nums text-white/35",
            mine && "text-right",
          )}
        >
          {formatTime(message.createdAt)}
        </span>
      </div>
    </motion.li>
  );
}

/* ══════════════════════════ Contenu du roster ══════════════════════════ */

function RosterContent({
  presence,
  meId,
  hideHeader,
}: {
  presence: PresenceUser[];
  meId: string | null;
  hideHeader?: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
          <span className="inline-flex items-center gap-2 font-display text-sm font-bold text-white">
            <Users size={16} className="text-brand-cyan" aria-hidden />
            En ligne
          </span>
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-gradient-da px-1.5 text-xs font-bold text-white">
            {presence.length}
          </span>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {presence.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs leading-relaxed text-white/45">
            Personne d&apos;autre en ligne pour l&apos;instant. Lancez la
            conversation !
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {presence.map((u) => {
              const isMe = meId != null && u.id === meId;
              return (
                <li
                  key={u.id}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
                >
                  <span className="relative shrink-0">
                    <Avatar
                      name={u.name}
                      src={u.avatar ?? undefined}
                      className={cn(
                        "h-8 w-8 text-xs",
                        u.isInstructor && "ring-2 ring-brand-cyan/50",
                      )}
                    />
                    <span
                      aria-hidden
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface-dark bg-success"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-medium text-white/85">
                        {u.name}
                      </span>
                      {isMe && (
                        <span className="shrink-0 text-[0.65rem] text-white/40">
                          (vous)
                        </span>
                      )}
                    </span>
                    {u.isInstructor && (
                      <span className="block text-[0.65rem] font-semibold text-brand-cyan">
                        Instructeur
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════ État vide ══════════════════════════════ */

function EmptyState({ courseTitle }: { courseTitle: string }) {
  return (
    <div className="flex h-full min-h-[16rem] flex-col items-center justify-center px-6 text-center">
      <motion.span
        aria-hidden
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-brand-cyan ring-1 ring-white/10"
      >
        <SendHorizontal size={26} />
      </motion.span>
      <h2 className="mt-5 font-display text-lg font-bold text-white">
        Ouvrez la discussion
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/55">
        Aucun message pour l&apos;instant dans « {courseTitle} ». Posez une
        question, partagez une ressource ou saluez les autres apprenants —
        soyez le premier à écrire.
      </p>
    </div>
  );
}
