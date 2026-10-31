import nodemailer from "nodemailer";

// EMAIL_FROM is required: the SMTP login (e.g. xxx@smtp-brevo.com) is NOT a valid sender address.
export const mailConfigured = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.EMAIL_FROM);
const APP = process.env.NEXT_PUBLIC_APP_NAME ?? "Cafflaire";

function makeTransport() {
  const port = Number(process.env.SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST, port, secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000, // fail fast instead of hanging until Vercel kills the function
  });
}

/** Safe summary of an SMTP error (no secrets) for logs and /api/health. */
export function mailErrorInfo(e: unknown) {
  const err = e as { code?: string; responseCode?: number; response?: string };
  return { code: err?.code ?? "UNKNOWN", responseCode: err?.responseCode, response: err?.response?.slice(0, 160) };
}

/** Checks the SMTP login works, without sending anything. */
export async function verifyMail(): Promise<{ ok: true } | { ok: false; code: string; responseCode?: number; response?: string }> {
  if (!mailConfigured()) return { ok: false, code: "NOT_CONFIGURED" };
  try { await makeTransport().verify(); return { ok: true }; }
  catch (e) { return { ok: false, ...mailErrorInfo(e) }; }
}

export async function sendMail(to: string, subject: string, text: string, html: string) {
  if (!mailConfigured()) {
    if (process.env.NODE_ENV !== "production") { console.log(`[mail:dev] to=${to}\n${subject}\n${text}`); return; }
    throw new Error("Email is not configured: set SMTP_HOST, SMTP_USER, SMTP_PASS and EMAIL_FROM.");
  }
  try {
    const info = await makeTransport().sendMail({ from: process.env.EMAIL_FROM, to, subject, text, html });
    if (info.rejected?.length) throw Object.assign(new Error("Recipient rejected"), { code: "EREJECTED" });
  } catch (e) {
    // Visible in Vercel -> Logs. Never includes the code, password or recipient.
    console.error("[mail] send failed", mailErrorInfo(e));
    throw e;
  }
}

export type OtpType = "sign-in" | "email-verification" | "forget-password" | "change-email";

/** Sends the one-time code email. The code is never logged in production. */
export async function sendOtpEmail(email: string, otp: string, type: OtpType) {
  const reset = type === "forget-password";
  const subject = reset ? `${APP}: your password reset code` : `${APP}: your verification code`;
  const intro = reset ? "Use this code to reset your password:" : "Use this code to verify your email address:";
  const text = `${intro}\n\n${otp}\n\nIt expires in 10 minutes. If you didn't request it, you can ignore this email.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;background:#FFF8F0;color:#3B2417;border-radius:16px">
<h2 style="margin:0 0 8px">☕ ${APP}</h2><p>${intro}</p>
<p style="font-size:34px;letter-spacing:8px;font-weight:700;background:#F3E5D0;padding:14px;text-align:center;border-radius:12px">${otp}</p>
<p style="font-size:13px;opacity:.75">It expires in 10 minutes. If you didn't request it, you can safely ignore this email.</p></div>`;
  await sendMail(email, subject, text, html);
}
