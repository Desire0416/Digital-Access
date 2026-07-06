import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Bell, SlidersHorizontal } from "lucide-react";
import {
  Container,
  GradientText,
  Section,
  SectionHeading,
} from "@da/ui";
import { currentUser } from "@da/auth/guards";
import {
  getNotifications,
  getNotificationPrefs,
} from "@/lib/notification-queries";
import { NotificationsClient } from "./NotificationsClient";
import { PreferencesForm } from "./PreferencesForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications",
  description:
    "Votre centre de notifications Access Academy : inscriptions, progression, certificats, paiements et préférences de rappel.",
  robots: { index: false, follow: false },
};

export default async function NotificationsPage() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?callbackUrl=/notifications");

  const [items, prefs] = await Promise.all([
    getNotifications(user.id, 50),
    getNotificationPrefs(user.id),
  ]);

  const unread = items.filter((n) => !n.read).length;

  return (
    <Section tone="muted" spacing="md">
      <Container>
        {/* ── En-tête brandé ─────────────────────────────────────────────── */}
        <SectionHeading
          align="left"
          eyebrow="Espace apprenant"
          title={
            <>
              Centre de <GradientText>notifications</GradientText>
            </>
          }
          subtitle="Suivez votre activité en temps réel et choisissez précisément ce dont vous souhaitez être averti."
          className="max-w-2xl"
        />

        <div className="mt-10 space-y-12 lg:mt-12">
          {/* 1) Vos notifications */}
          <section aria-labelledby="notifs-title">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-da text-white shadow-brand">
                <Bell size={18} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2
                  id="notifs-title"
                  className="font-display text-xl font-bold tracking-tight text-navy"
                >
                  Vos notifications
                </h2>
                <p className="text-sm text-text-secondary">
                  {unread > 0
                    ? `${unread} notification${unread > 1 ? "s" : ""} non lue${
                        unread > 1 ? "s" : ""
                      }`
                    : "Vous êtes à jour"}
                </p>
              </div>
            </div>

            <NotificationsClient items={items} />
          </section>

          {/* 2) Préférences */}
          <section aria-labelledby="prefs-title">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                <SlidersHorizontal size={18} aria-hidden />
              </span>
              <div className="min-w-0">
                <h2
                  id="prefs-title"
                  className="font-display text-xl font-bold tracking-tight text-navy"
                >
                  Préférences
                </h2>
                <p className="text-sm text-text-secondary">
                  Activez ou coupez chaque type d&apos;alerte, dans
                  l&apos;application et par e-mail.
                </p>
              </div>
            </div>

            <PreferencesForm prefs={prefs} />
          </section>
        </div>
      </Container>
    </Section>
  );
}
