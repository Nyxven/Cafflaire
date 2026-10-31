import Link from "next/link";
import Cup from "@/components/Cup";
import { Icon } from "@/components/Icons";
import PresetCard from "@/components/PresetCard";
import { Item, Stagger } from "@/components/Reveal";
import Ring from "@/components/Ring";
import { PRESETS } from "@/lib/catalog";
import { describePrefs, rankPicks } from "@/lib/prefs";
import { getPrefsState } from "@/lib/prefs-server";
import { getSession } from "@/lib/session";

export const metadata = { title: "Home" };

// The shop is in the Philippines, so greet by Manila time (servers run in UTC).
function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-PH", { hour: "numeric", hour12: false, timeZone: "Asia/Manila" }).format(new Date())) % 24;
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function Home() {
  const session = await getSession();
  const first = session?.user.name.split(" ")[0];
  const state = session ? await getPrefsState(session.user.id) : ({ status: "none" } as const);
  const picks = state.status === "completed" ? rankPicks(state.prefs).slice(0, 3) : null;
  const heroConfig = picks ? picks[0].config : PRESETS[5].config;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2.5rem] bg-espresso p-7 text-cream shadow-float sm:p-12">
        <Ring className="pointer-events-none absolute -right-10 -top-12 h-80 w-80 text-caramel/40 sm:h-[26rem] sm:w-[26rem]" />
        <div className="relative grid items-center gap-6 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-medium opacity-70">{greeting()}, {first}</p>
            <h1 className="mt-2 max-w-md text-4xl font-bold leading-[1.05] sm:text-6xl">What are we brewing today?</h1>
            {state.status === "completed" && (
              <div className="mt-4 flex max-w-md flex-wrap gap-1.5" aria-label="Your taste profile">
                {describePrefs(state.prefs).map((t) => <span key={t} className="rounded-full bg-cream/15 px-3 py-1 text-xs font-semibold">{t}</span>)}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/build" className="btn-accent !min-h-12 !px-7">Build my coffee</Link>
              <Link href="/menu" className="btn !min-h-12 border border-cream/30 !px-7 hover:bg-cream/10">Browse the menu</Link>
            </div>
          </div>
          <Cup config={heroConfig} className="mx-auto hidden h-56 drop-shadow-2xl sm:block" />
        </div>
      </section>

      {state.status !== "completed" && (
        <section className="card flex flex-wrap items-center gap-4 !border-caramel/30 bg-caramel/10">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-caramel text-white"><Icon.sparkle className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold">Make it yours</h2>
            <p className="text-sm opacity-75">Answer five quick questions and we&apos;ll pick drinks you&apos;ll like.</p>
          </div>
          <Link href="/onboarding" className="btn-primary">Set my tastes</Link>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold sm:text-3xl">{picks ? "Picked for you" : "Popular right now"}</h2>
          <Link href="/menu" className="text-sm font-semibold underline underline-offset-4">See the full menu</Link>
        </div>
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {picks
            ? picks.map((k, i) => <Item key={k.preset.slug} className="h-full"><PresetCard p={k.preset} config={k.config} badge={i === 0 ? "Best match" : undefined} /></Item>)
            : [PRESETS[0], PRESETS[5], PRESETS[7]].map((p) => <Item key={p.slug} className="h-full"><PresetCard p={p} /></Item>)}
        </Stagger>
      </section>
    </div>
  );
}
