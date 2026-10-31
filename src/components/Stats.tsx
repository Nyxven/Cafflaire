import { Stats, fmt } from "@/lib/catalog";

const color: Record<Stats["caffeineLevel"], string> = { None: "bg-gray-300", Low: "bg-matcha", Medium: "bg-caramel", High: "bg-orange-600", "Very high": "bg-berry" };

export function StatChips({ s }: { s: Stats }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="chip">⚡ {s.caffeineMg} mg</span>
      <span className="chip">🍬 Sweet {s.sweetness}/5</span>
      <span className="chip">🔥 {s.calories} kcal</span>
    </div>
  );
}

export default function StatsPanel({ s, cents }: { s: Stats; cents?: number }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex justify-between text-sm font-semibold"><span>Caffeine</span><span>{s.caffeineMg} mg · {s.caffeineLevel}</span></div>
        <div className="h-3 overflow-hidden rounded-full bg-milk" role="meter" aria-valuenow={s.caffeineMg} aria-valuemin={0} aria-valuemax={400} aria-label="Caffeine">
          <div className={`h-full rounded-full transition-all ${color[s.caffeineLevel]}`} style={{ width: `${Math.min(100, (s.caffeineMg / 400) * 100)}%` }} />
        </div>
        {s.caffeineMg > 400 && <p className="mt-1 text-xs text-berry">That&apos;s a lot of caffeine for one drink.</p>}
      </div>
      <div>
        <div className="mb-1 flex justify-between text-sm font-semibold"><span>Sweetness</span><span>{s.sweetness}/5</span></div>
        <div className="flex gap-1.5" aria-hidden>{[1, 2, 3, 4, 5].map((n) => <span key={n} className={`h-5 w-5 rounded-md ${n <= s.sweetness ? "bg-caramel" : "bg-milk"}`} />)}</div>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-xl bg-milk p-2"><dt className="text-xs opacity-70">Calories</dt><dd className="font-bold">{s.calories}</dd></div>
        <div className="rounded-xl bg-milk p-2"><dt className="text-xs opacity-70">Sugar</dt><dd className="font-bold">{s.sugarG} g</dd></div>
        <div className="rounded-xl bg-milk p-2"><dt className="text-xs opacity-70">Size</dt><dd className="font-bold">{s.oz} oz</dd></div>
      </dl>
      {s.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{s.tags.map((t) => <span key={t} className="chip bg-matcha/20">{t}</span>)}</div>}
      {cents !== undefined && <div className="text-right font-display text-2xl font-bold">{fmt(cents)}</div>}
      <p className="text-xs opacity-60">Approximate values.</p>
    </div>
  );
}
