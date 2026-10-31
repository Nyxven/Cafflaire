import { headers } from "next/headers";
import { auth } from "./auth";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export function isAdmin(email?: string | null) {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}
