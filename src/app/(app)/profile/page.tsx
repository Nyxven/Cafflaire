import Link from "next/link";
import { SignOutButton } from "@/components/Misc";
import Ring from "@/components/Ring";
import { describePrefs } from "@/lib/prefs";
import { getPrefsState } from "@/lib/prefs-server";
import { getSession } from "@/lib/session";

export const metadata = { title: "Profile" };

export default async function Profile() {
  const s = (await getSession())!;
  const state = await getPrefsState(s.user.id);
  return (
    <div className="space-y-6">
      <section className="card relative overflow-hidden">
        <Ring className="pointer-events-none absolute -right-8 -top-10 h-48 w-48 text-caramel/30" />
        <div className="relative flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-caramel font-display text-3xl font-bold text-white shadow-[0_10px_20px_-10px_rgb(var(--caramel))]">{s.user.name[0]?.toUpperCase()}</div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-bold">{s.user.name}</h2>
            <p className="truncate opacity-70">{s.user.email}</p>
            <span className={`chip mt-2 ${s.user.emailVerified ? "bg-matcha/25" : "bg-berry/20"}`}>{s.user.emailVerified ? "Email verified ✓" : "Email not verified"}</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="flex items-start justify-between gap-3">
          <div><h2 className="text-xl font-bold">Your taste</h2><p className="text-sm opacity-70">We use this to pick drinks for you.</p></div>
          <Link href="/onboarding?redo=1" className="btn-ghost text-sm">{state.status === "completed" ? "Retake" : "Set up"}</Link>
        </div>
        {state.status === "completed"
          ? <div className="mt-4 flex flex-wrap gap-1.5">{describePrefs(state.prefs).map((t) => <span key={t} className="chip">{t}</span>)}</div>
          : <p className="mt-4 text-sm opacity-70">Nothing saved yet. Five quick questions and your home page gets personal.</p>}
      </section>

      <SignOutButton />
    </div>
  );
}
