import Link from "next/link";
import AccountPanel from "@/components/AccountPanel";
import { SoundSwitch, ThemeChoice } from "@/components/SettingsPanel";
import { describePrefs } from "@/lib/prefs";
import { getPrefsState } from "@/lib/prefs-server";
import { getSession } from "@/lib/session";

export const metadata = { title: "Settings" };

export default async function Settings() {
  const s = (await getSession())!;
  const state = await getPrefsState(s.user.id);
  return (
    <div className="space-y-6">
      <section className="card space-y-4">
        <div><h2 className="text-xl font-bold">Appearance</h2><p className="text-sm opacity-70">Choose how Cafflaire looks on this device.</p></div>
        <ThemeChoice />
      </section>

      <section className="card space-y-4">
        <h2 className="text-xl font-bold">Sound</h2>
        <SoundSwitch />
      </section>

      <section className="card space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="text-xl font-bold">Taste preferences</h2><p className="text-sm opacity-70">Used to pick drinks for you on the home page.</p></div>
          <Link href="/onboarding?redo=1" className="btn-ghost text-sm">{state.status === "completed" ? "Retake quiz" : "Take quiz"}</Link>
        </div>
        {state.status === "completed" && <div className="flex flex-wrap gap-1.5">{describePrefs(state.prefs).map((t) => <span key={t} className="chip">{t}</span>)}</div>}
      </section>

      <div>
        <h2 className="mb-1 text-2xl font-bold">Security</h2>
        <AccountPanel />
      </div>
    </div>
  );
}
