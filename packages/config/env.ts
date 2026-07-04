import { z } from "zod";

/**
 * Validation centralisée des variables d'environnement (Zod).
 * Les variables serveur ne sont jamais exposées au client.
 * Les variables NEXT_PUBLIC_* sont accessibles côté client.
 *
 * En développement sans base ni clés, la plupart des champs sont optionnels
 * afin que l'application démarre avec les données de démonstration.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Access Academy <noreply@digitalaccess.ci>"),
  CINETPAY_API_KEY: z.string().optional(),
  CINETPAY_SITE_ID: z.string().optional(),
  CINETPAY_SECRET_KEY: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  ABLY_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_WEB_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_ACADEMY_URL: z.string().url().default("http://localhost:3001"),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().default("2250700000000"),
  NEXT_PUBLIC_CONTACT_EMAIL: z.string().default("contact@digitalaccess.ci"),
});

export const serverEnv = serverSchema.parse(process.env);
export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  NEXT_PUBLIC_ACADEMY_URL: process.env.NEXT_PUBLIC_ACADEMY_URL,
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
  NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
