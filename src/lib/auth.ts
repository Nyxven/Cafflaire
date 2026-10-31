import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { db as defaultDb, schema } from "./db";
import { OtpType, sendOtpEmail } from "./mail";

const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;

type Db = Parameters<typeof drizzleAdapter>[0];
interface Opts { db?: Db; sendOtp?: (email: string, otp: string, type: OtpType) => Promise<void>; withNext?: boolean }

export function createAuth({ db = defaultDb as unknown as Db, sendOtp = sendOtpEmail, withNext = true }: Opts = {}) {
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? (vercelProd ? `https://${vercelProd}` : undefined),
    trustedOrigins: [process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "", process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : ""].filter(Boolean),
    database: drizzleAdapter(db, { provider: "pg", schema }),
    // Passwords are stored as salted scrypt hashes by Better Auth (never reversible).
    emailAndPassword: { enabled: true, minPasswordLength: 10, maxPasswordLength: 128, requireEmailVerification: true },
    user: { deleteUser: { enabled: true } },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-up/email": { window: 60, max: 5 },
        "/sign-in/email": { window: 60, max: 10 },
        "/email-otp/send-verification-otp": { window: 60, max: 3 },
        "/email-otp/request-password-reset": { window: 60, max: 3 },
        "/email-otp/verify-email": { window: 60, max: 10 },
        "/email-otp/reset-password": { window: 300, max: 5 },
      },
    },
    plugins: [
      emailOTP({
        otpLength: 6,
        expiresIn: 600,
        allowedAttempts: 5,
        storeOTP: "hashed", // the code itself is never stored in the database
        sendVerificationOnSignUp: true,
        overrideDefaultEmailVerification: true,
        sendVerificationOTP: async ({ email, otp, type }) => { await sendOtp(email, otp, type); },
      }),
      ...(withNext ? [nextCookies()] : []),
    ],
  });
}

export const auth = createAuth();
export type Session = typeof auth.$Infer.Session;
