import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db, schema } from "./db";

const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const googleReady = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? (vercelProd ? `https://${vercelProd}` : undefined),
  trustedOrigins: [process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "", process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : ""].filter(Boolean),
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  ...(googleReady
    ? { socialProviders: { google: { clientId: process.env.GOOGLE_CLIENT_ID as string, clientSecret: process.env.GOOGLE_CLIENT_SECRET as string } } }
    : {}),
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
