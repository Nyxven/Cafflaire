import Link from "next/link";
import Cup from "@/components/Cup";
import ThemeToggle from "@/components/ThemeToggle";
import Logo, { APP_NAME } from "@/components/Logo";
import { PRESET_MAP } from "@/lib/catalog";

const steps = [
  ["🧋", "Build it", "Pick your base, shots, milk, syrups and toppings — just like behind the bar."],
  ["🛒", "Basket it", "Make as many drinks as you like. See price, caffeine and sweetness for each."],
  ["🛵", "Get it", "Pick it up at the counter or have it delivered to your door."],
];

export default function Landing() {
  return (
    <main>
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo href="/" />
        <div className="flex items-center gap-2"><ThemeToggle /><Link href="/login" className="btn-ghost">Log in</Link><Link href="/signup" className="btn-primary hidden sm:inline-flex">Sign up</Link></div>
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 lg:grid-cols-2 lg:py-20">
        <div>
          <span className="chip bg-matcha/20">New · Be your own barista</span>
          <h1 className="mt-4 text-5xl font-bold leading-tight sm:text-6xl">Your coffee,<br /><span className="text-caramel">your recipe.</span></h1>
          <p className="mt-4 max-w-md text-lg opacity-80">{APP_NAME} lets you craft every layer of your drink, then pick it up or have it delivered.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Link href="/signup" className="btn-accent !min-h-12 !px-7">Start brewing</Link><Link href="/login" className="btn-ghost !min-h-12 !px-7">I have an account</Link></div>
        </div>
        <div className="relative grid place-items-center rounded-[2rem] bg-gradient-to-br from-milk to-surface p-8 shadow-soft">
          <Cup config={PRESET_MAP["caramel-frappe"].config} className="h-72 sm:h-96" />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="mb-6 text-center text-3xl font-bold">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">{steps.map(([e, t, d]) => <div key={t} className="card text-center"><div className="text-4xl">{e}</div><h3 className="mt-2 text-xl font-bold">{t}</h3><p className="mt-1 text-sm opacity-70">{d}</p></div>)}</div>
      </section>
    </main>
  );
}
