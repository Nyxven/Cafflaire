import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Truck from "@/components/Truck";
import { getPrefsState } from "@/lib/prefs-server";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Welcome" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  // First time here? The truck drives them to a short taste quiz. Everyone else goes straight home.
  const state = await getPrefsState(session.user.id);
  return <Truck next={state.status === "none" ? "/onboarding" : "/home"} />;
}
