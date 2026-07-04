import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@da/db/client";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: { email: {}, password: {} },
    authorize: async (raw) => {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;
      const { email, password } = parsed.data;

      const user = await prisma.user.findFirst({
        where: { email: email.toLowerCase(), deletedAt: null },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          avatar: true,
          roles: true,
          emailVerified: true,
        },
      });
      if (!user || !user.password) return null;

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.avatar,
        roles: user.roles,
        emailVerified: user.emailVerified,
      } as unknown as { id: string };
    },
  }),
];

// Google activé uniquement si les identifiants sont présents.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const authConfig: NextAuthConfig = {
  providers,
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 }, // 7 jours
  pages: { signIn: "/auth/login" },
  callbacks: {
    // À la connexion Google : crée (ou lie par email) l'utilisateur dans notre base.
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email?.toLowerCase();
        if (!email) return false;
        await prisma.user.upsert({
          where: { email },
          update: {
            emailVerified: new Date(),
            isActive: true,
            ...(user.name ? { name: user.name } : {}),
            ...(user.image ? { avatar: user.image } : {}),
          },
          create: {
            email,
            name: user.name ?? email.split("@")[0],
            avatar: user.image ?? null,
            roles: ["CLIENT", "LEARNER"],
            emailVerified: new Date(), // vérifié par Google
            isActive: true,
          },
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      const t = token as unknown as Record<string, unknown>;
      // À la connexion (credentials ou Google), on résout l'utilisateur canonique par email.
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
          select: { id: true, roles: true, emailVerified: true },
        });
        t.uid = dbUser?.id ?? (user as { id?: string }).id;
        t.roles = dbUser?.roles ?? ["LEARNER"];
        t.emailVerified = dbUser?.emailVerified ?? null;
      } else if (user) {
        const u = user as unknown as { id: string; roles?: string[]; emailVerified?: Date | null };
        t.uid = u.id;
        t.roles = u.roles ?? ["LEARNER"];
        t.emailVerified = u.emailVerified ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as unknown as Record<string, unknown>;
      if (session.user) {
        const su = session.user as unknown as Record<string, unknown>;
        su.id = t.uid;
        su.roles = t.roles ?? [];
        su.emailVerified = t.emailVerified ?? null;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
export { AuthError } from "next-auth";
