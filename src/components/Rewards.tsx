"use client";
import { motion, useReducedMotion } from "framer-motion";
import Ring from "@/components/Ring";
import { EXP, type Rewards } from "@/lib/rewards";

/** Level, title and an EXP bar that fills when the page opens. */
export function LevelCard({ r }: { r: Rewards }) {
  const reduce = useReducedMotion();
  const l = r.level;
  return (
    <section className="card relative overflow-hidden">
      <Ring className="pointer-events-none absolute -left-10 -top-12 h-44 w-44 text-caramel/20" />
      <div className="relative flex items-center gap-4">
        <motion.div
          initial={reduce ? false : { scale: 0.6, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-espresso text-cream shadow-float ring-4 ring-caramel/40"
          aria-hidden
        >
          <div className="text-center leading-none"><div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Level</div><div className="font-display text-3xl font-bold">{l.level}</div></div>
        </motion.div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-bold">{l.title}</h2>
          <p className="text-sm opacity-70">{l.exp.toLocaleString("en-PH")} EXP total · {r.orders} order{r.orders === 1 ? "" : "s"} · {r.drinks} drink{r.drinks === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="mb-1.5 flex justify-between text-xs font-semibold">
          <span>{l.maxed ? "Max level reached 🎉" : `${l.into} / ${l.span} EXP`}</span>
          {!l.maxed && <span className="opacity-70">{l.toNext} EXP to Level {l.level + 1}</span>}
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-milk" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(l.pct * 100)} aria-label={`Progress to level ${l.level + 1}`}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-caramel to-caramel/70"
            initial={reduce ? false : { width: 0 }}
            animate={{ width: `${Math.max(l.pct * 100, l.into > 0 ? 4 : 0)}%` }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
          />
        </div>
      </div>

      <details className="relative mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-caramel">How do I earn EXP?</summary>
        <ul className="mt-2 space-y-1 opacity-80">
          <li>☕ Place an order: <b>+{EXP.order}</b></li>
          <li>✅ Order completed: <b>+{EXP.completed}</b> more</li>
          <li>🥤 Each drink in an order: <b>+{EXP.drink}</b> (up to 10 per order)</li>
          <li>🎨 Each drink you designed yourself: <b>+{EXP.customDrink}</b> more</li>
          <li>🗺️ First time trying a kind of drink: <b>+{EXP.newBase}</b></li>
          <li>🧭 Finish the taste quiz: <b>+{EXP.quiz}</b></li>
        </ul>
        <p className="mt-2 text-xs opacity-60">Cancelled orders don&apos;t count. Removing an order from My orders never lowers your EXP.</p>
      </details>
    </section>
  );
}

/** Every badge: earned ones in colour, locked ones greyed out with a hint and a little progress bar. */
export function BadgeGrid({ r }: { r: Rewards }) {
  const reduce = useReducedMotion();
  return (
    <section className="card">
      <div className="flex items-baseline justify-between gap-3">
        <div><h2 className="text-xl font-bold">Badges</h2><p className="text-sm opacity-70">Little rewards for being a coffee person.</p></div>
        <span className="chip bg-caramel/20 whitespace-nowrap">{r.earned} / {r.badges.length}</span>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {r.badges.map((b, i) => (
          <motion.li
            key={b.id}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
            className={`relative rounded-2xl border-2 p-3 text-center ${b.earned ? "border-caramel/60 bg-caramel/10" : "border-espresso/10 bg-milk/40"}`}
            aria-label={`${b.name}: ${b.earned ? "earned" : `locked, ${b.have} of ${b.need}`}. ${b.desc}`}
          >
            <div className={`mx-auto grid h-12 w-12 place-items-center rounded-full text-2xl ${b.earned ? "bg-caramel/25" : "bg-espresso/10 opacity-60 grayscale"}`} aria-hidden>{b.emoji}</div>
            <div className={`mt-2 text-sm font-bold leading-tight ${b.earned ? "" : "opacity-60"}`}>{b.name}</div>
            <div className="mt-0.5 text-xs leading-snug opacity-70">{b.desc}</div>
            {b.earned
              ? <span className="chip mt-2 bg-matcha/30 !py-0.5 text-[11px]">Earned ✓</span>
              : b.need > 1 && <div className="mt-2" aria-hidden><div className="h-1.5 overflow-hidden rounded-full bg-espresso/10"><div className="h-full rounded-full bg-caramel/60" style={{ width: `${(b.have / b.need) * 100}%` }} /></div><div className="mt-0.5 text-[11px] font-semibold opacity-60">{b.have} / {b.need}</div></div>}
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

/** Small "Lv 3 · Sip Explorer" pill for the top of the profile. */
export function LevelChip({ r }: { r: Rewards }) {
  return <span className="chip mt-2 bg-caramel/25">Lv {r.level.level} · {r.level.title}</span>;
}
