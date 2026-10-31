import Link from "next/link";
import PresetCard from "@/components/PresetCard";
import { PRESETS } from "@/lib/catalog";
import { getSession } from "@/lib/session";

export const metadata = { title: "Home" };

export default async function Home() {
  const session = await getSession();
  const first = session?.user.name.split(" ")[0];
  return (
    <div className="space-y-10">
      <section className="rounded-[2rem] bg-espresso p-6 text-cream sm:p-10">
        <p className="text-sm opacity-70">Good to see you, {first} 👋</p>
        <h1 className="mt-1 text-4xl font-bold sm:text-5xl">What are we brewing today?</h1>
        <div className="mt-6 flex flex-wrap gap-3"><Link href="/build" className="btn-accent !min-h-12 !px-7">Build my coffee</Link><Link href="/menu" className="btn !min-h-12 border border-cream/30 !px-7 hover:bg-cream/10">Browse the menu</Link></div>
      </section>
      <section>
        <div className="mb-4 flex items-end justify-between"><h2 className="text-2xl font-bold">Popular right now</h2><Link href="/menu" className="text-sm font-semibold underline">See all</Link></div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[PRESETS[0], PRESETS[5], PRESETS[7]].map((p) => <PresetCard key={p.slug} p={p} />)}</div>
      </section>
    </div>
  );
}
