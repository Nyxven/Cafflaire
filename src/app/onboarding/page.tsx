import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Onboarding from "@/components/Onboarding";
import { getPrefsState } from "@/lib/prefs-server";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Set your tastes" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ redo?: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { redo } = await searchParams;
  const state = await getPrefsState(session.user.id);
  // Already answered? Go home, unless they came here on purpose from Settings.
  if (state.status === "completed" && !redo) redirect("/home");
  return <Onboarding first={session.user.name.split(" ")[0]} initial={state.status === "completed" ? state.prefs : null} redo={Boolean(redo)} />;
}
