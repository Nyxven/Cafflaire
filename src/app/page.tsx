import Link from "next/link";
import DrinkMarquee from "@/components/DrinkMarquee";
import HeroCup from "@/components/HeroCup";
import Logo, { APP_NAME } from "@/components/Logo";
import Ring from "@/components/Ring";
import { DELIVERY_FEE_CENTS, MIN_PREP_MINUTES, fmt } from "@/lib/catalog";

const steps = [
  ["Build it", "Pick a base, shots, milk, syrups and toppings, just like behind the bar. The cup fills as you go."],
  ["Basket it", "Make as many drinks as you like. Price, caffeine and sweetness update for each one."],
  ["Get it", "Pick it up at the counter or have it delivered. Pay in cash when it arrives."],
];

export default function Landing() {
  return (
    <main className="overflow-hidden">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        <Logo href="/" />
        <div className="flex items-center gap-2"><Link href="/login" className="btn-ghost">Log in</Link><Link href="/signup" className="btn-primary hidden sm:inline-flex">Sign up</Link></div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-6 lg:grid-cols-[1.05fr_.95fr] lg:pb-24 lg:pt-10">
        <div>
          <h1 className="text-6xl font-bold leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl">Your coffee, your recipe.</h1>
          <p className="mt-6 max-w-md text-lg opacity-80">{APP_NAME} lets you craft every layer of your drink, then pick it up or have it delivered.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-accent !min-h-12 !px-8 text-lg">Start brewing</Link>
            <Link href="/login" className="btn-ghost !min-h-12 !px-8 text-lg">I have an account</Link>
          </div>
          <ul className="mt-8 space-y-1.5 text-sm opacity-80">
            <li>Pay cash on pickup or delivery</li>
            <li>Flat {fmt(DELIVERY_FEE_CENTS)} delivery fee</li>
            <li>Ready in about {MIN_PREP_MINUTES} minutes</li>
          </ul>
        </div>
        <HeroCup />
      </section>

      <section aria-label="Popular drinks" className="pb-16">
        <p className="mb-5 text-center text-sm font-semibold uppercase tracking-widest opacity-60">Fan favourites, or build your own</p>
        <DrinkMarquee />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="mb-8 max-w-lg text-4xl font-bold sm:text-5xl">From empty cup to your door in three steps</h2>
        <ol className="grid gap-px overflow-hidden rounded-[2rem] border border-espresso/10 bg-espresso/10 shadow-soft sm:grid-cols-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="bg-surface p-7">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-espresso font-display text-lg font-bold text-cream" aria-hidden>{i + 1}</span>
              <h3 className="mt-4 text-2xl font-bold">{t}</h3>
              <p className="mt-2 opacity-75">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-espresso p-10 text-center text-cream sm:p-16">
          <Ring className="pointer-events-none absolute -left-16 -top-20 h-80 w-80 text-caramel/40" />
          <Ring className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rotate-180 text-caramel/30" />
          <h2 className="relative mx-auto max-w-xl text-4xl font-bold sm:text-5xl">Ready to build your first cup?</h2>
          <p className="relative mx-auto mt-3 max-w-md opacity-75">Sign up with your email. We&apos;ll send a quick code to confirm it&apos;s you.</p>
          <Link href="/signup" className="btn-accent relative mt-7 !min-h-12 !px-8 text-lg">Create my account</Link>
        </div>
      </section>
    </main>
  );
}
