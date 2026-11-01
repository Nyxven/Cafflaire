"use client";
import { useEffect, useState } from "react";
import { Fulfilment, STATUS_LABEL, flowFor } from "@/lib/order-flow";

/**
 * Horizontal order tracker: a dot for every step with a line between them that fills up as the order moves along.
 * `compact` = thin version without labels (used on the My Orders list).
 */
export default function OrderProgress({ fulfilment, status, compact = false }: { fulfilment: Fulfilment; status: string; compact?: boolean }) {
  const flow = flowFor(fulfilment);
  const last = flow.length - 1;
  const at = Math.max(0, flow.indexOf(status));
  const target = (at / last) * 100;
  // start empty, then grow to the real value so the line animates in (and again whenever the status changes)
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  const inset = `${100 / (flow.length * 2)}%`; // line runs from the middle of the first dot to the middle of the last
  const finished = at === last;

  return (
    <ol className="relative grid text-center" style={{ gridTemplateColumns: `repeat(${flow.length}, minmax(0, 1fr))` }} aria-label="Order progress">
      <li aria-hidden className={`absolute list-none rounded-full bg-espresso/10 ${compact ? "top-[6px] h-[3px]" : "top-4 h-1.5"} -translate-y-1/2`} style={{ left: inset, right: inset }}>
        <span className="block h-full rounded-full bg-caramel transition-[width] duration-700 ease-out motion-reduce:transition-none" style={{ width: `${shown}%` }} />
      </li>
      {flow.map((st, i) => {
        const done = i < at || finished;
        const current = i === at && !finished;
        return (
          <li key={st} aria-current={current ? "step" : undefined} className="relative z-10 flex flex-col items-center">
            <span className="relative grid place-items-center">
              {current && !compact && <span aria-hidden className="absolute h-8 w-8 rounded-full bg-caramel/40 motion-safe:animate-ping" />}
              <span
                className={`relative grid place-items-center rounded-full font-bold transition-colors duration-500 ${compact ? "h-3 w-3 text-[0px]" : "h-8 w-8 text-sm"} ${done ? "bg-caramel text-white" : current ? "bg-caramel text-white ring-4 ring-caramel/30" : "border-2 border-espresso/15 bg-surface text-espresso/50"}`}
              >
                {done ? "✓" : i + 1}
              </span>
            </span>
            {!compact && <span className={`mt-1.5 text-xs sm:text-sm ${current ? "font-bold" : done ? "font-semibold" : "opacity-60"}`}>{STATUS_LABEL[st] ?? st}</span>}
          </li>
        );
      })}
    </ol>
  );
}
