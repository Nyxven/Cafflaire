import Cup from "./Cup";
import { PRESETS, Preset, fmt, unitPrice } from "@/lib/catalog";

const TINT: Record<Preset["category"], string> = { Coffee: "bg-caramel/15", Frappe: "bg-berry/15", Matcha: "bg-matcha/25", Specialty: "bg-caramel/30" };

function DrinkCard({ p }: { p: Preset }) {
  return (
    <div className="mr-4 flex w-44 shrink-0 flex-col items-center rounded-3xl border border-espresso/[0.07] bg-surface p-4 text-center shadow-soft sm:w-52">
      <Cup config={p.config} className="h-32 sm:h-40" />
      <div className="mt-2 font-display text-lg font-bold leading-tight">{p.name}</div>
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-semibold ${TINT[p.category]}`}>{p.category}</span>
        <span className="font-semibold">{fmt(unitPrice(p.config))}</span>
      </div>
    </div>
  );
}

/** A slow, endless sideways scroll of every preset drink. The list is shown twice so the loop is seamless. */
export default function DrinkMarquee() {
  return (
    <div className="marquee marquee-fade overflow-hidden py-2">
      <div className="marquee-track flex w-max">
        {PRESETS.map((p) => <DrinkCard key={p.slug} p={p} />)}
        <div className="flex" aria-hidden>{PRESETS.map((p) => <DrinkCard key={`dup-${p.slug}`} p={p} />)}</div>
      </div>
    </div>
  );
}
