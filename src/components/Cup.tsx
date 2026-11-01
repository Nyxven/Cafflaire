"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BASE_MAP, Config, MILK_MAP, SIZES } from "@/lib/catalog";

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const [x, y] = [hex(a), hex(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};

const CUP = "M40 60 L160 60 L146 238 Q144 252 130 252 L70 252 Q56 252 54 238 Z";
const BOTTOM = 250;

/** Liquid that is pouring in right now: it rises through its zone of the cup while the pour lasts. */
export type Pour = { zone: "coffee" | "milk"; color: string; ms: number; key: number; target: Config };

type Layer = { zone: "coffee" | "milk" | "both"; y: number; h: number; c: string };

/** Where each liquid layer sits for a drink. Shared by the cup drawing and the pour animation. */
function layout(config: Config) {
  const base = BASE_MAP[config.base];
  const milk = MILK_MAP[config.milk];
  const total = 170 * SIZES[config.size].fill;
  const top = BOTTOM - total;
  const coffee = config.matcha > 0 && config.shots === 0 ? "#7a9e5a" : config.matcha > 0 ? "#5d6b3a" : mix("#6b4128", "#2f1a0f", Math.min(config.shots / 4, 1));
  const ratio = milk.id === "none" ? 0 : base.milkRatio;
  const blended = config.temp === "blended";
  const iced = config.temp !== "hot";
  const mixed = mix(coffee, milk.color, ratio);
  // iced: milk bottom + coffee on top; hot: coffee bottom + milk on top
  const milkH = total * ratio;
  const coffeeH = total - milkH;
  const layers: Layer[] = blended
    ? [{ zone: "both", y: top, h: total, c: mixed }]
    : iced
      ? [{ zone: "milk", y: top + coffeeH, h: milkH, c: milk.color }, { zone: "coffee", y: top, h: coffeeH, c: coffee }]
      : [{ zone: "coffee", y: top + milkH, h: coffeeH, c: coffee }, { zone: "milk", y: top, h: milkH, c: milk.color }];
  return { base, milk, total, top, iced, blended, layers };
}

/**
 * Layered SVG cup rendered purely from a drink config.
 * Optional "game" props (all off by default, so cart / home / hero cups look exactly as before):
 *  - pour:   liquid rising in its zone while it is being poured
 *  - ripple: change the number to make the liquid surface ripple once
 *  - shine:  change the number to sweep a glossy highlight across the cup
 *  - lively: toppings settle in and ice cubes drop in when they appear
 */
export default function Cup({ config, className = "h-64", pour, ripple = 0, shine = 0, lively = false }: { config: Config; className?: string; pour?: Pour | null; ripple?: number; shine?: number; lively?: boolean }) {
  const reduce = useReducedMotion();
  if (!BASE_MAP[config.base]) return null;
  const fancy = !reduce; // no decorative motion for people who asked for less
  const settle = lively; // same on server and client; reduced motion just makes the transitions instant
  const { base, milk, top, iced, blended, layers } = layout(config);

  const has = (t: string) => config.toppings.includes(t);
  const whippedY = top - 4;
  const drop = settle ? { y: -38, opacity: 0 } : false;
  const land = { y: 0, opacity: 1 };
  const instant = { duration: 0 };
  const spring = reduce ? instant : { type: "spring" as const, stiffness: 200, damping: 15 };
  const draw = settle ? { pathLength: 0, opacity: 0 } : false;
  const drawn = { pathLength: 1, opacity: 1 };

  let zone: { y: number; h: number } | null = null;
  if (pour && fancy) {
    const t = layout(pour.target).layers;
    const z = t.find((l) => l.zone === pour.zone) ?? t[0];
    zone = { y: z.y, h: z.h };
  }

  return (
    <svg viewBox="0 0 200 270" className={className} role="img" aria-label={`${base.name} preview`}>
      <defs><clipPath id="cupclip"><path d={CUP} /></clipPath></defs>
      <ellipse cx="100" cy="262" rx="62" ry="6" fill="currentColor" opacity=".12" />
      {iced && <line x1="122" y1="14" x2="106" y2="236" stroke="#e8554e" strokeWidth="6" strokeLinecap="round" />}
      <path d={CUP} fill="currentColor" fillOpacity=".07" />
      <g clipPath="url(#cupclip)">
        {layers.map((l, i) => (
          <motion.rect key={i} x="30" width="140" initial={false} animate={{ y: l.y, height: Math.max(l.h, 0), fill: l.c }} transition={{ type: "spring", stiffness: 120, damping: 18 }} />
        ))}
        {!blended && !iced && milk.id !== "none" && (
          <motion.ellipse key={`foam-${milk.id}`} cx="100" cy={top + 4} rx="58" fill="#fffaf2" initial={settle ? { ry: 0, opacity: 0 } : false} animate={{ ry: 7, opacity: 0.8 }} transition={reduce ? instant : { delay: settle ? 0.15 : 0, duration: 0.5, ease: "easeOut" }} />
        )}
        {iced && [[72, 14], [108, 30], [84, 62], [118, 78], [74, 100]].map(([x, dy], i) => (
          <motion.g key={i} initial={settle ? { y: -90, opacity: 0 } : false} animate={land} transition={reduce ? instant : { ...spring, delay: settle ? i * 0.07 : 0 }}>
            <rect x={x} y={top + dy} width="26" height="26" rx="5" fill="#fff" fillOpacity=".38" stroke="#fff" strokeOpacity=".6" transform={`rotate(${i * 17} ${x + 13} ${top + dy + 13})`} />
          </motion.g>
        ))}
        {blended && [[70, 40], [120, 70], [90, 100], [130, 30]].map(([x, dy], i) => <circle key={i} cx={x} cy={top + dy} r="4" fill="#fff" fillOpacity=".35" />)}

        {/* liquid being poured right now (rises through its zone, then fades as the real layer takes over) */}
        <AnimatePresence>
          {pour && zone && (
            <motion.rect key={pour.key} x="30" width="140" fill={pour.color} fillOpacity=".92"
              initial={{ y: zone.y + zone.h, height: 0, opacity: 1 }} animate={{ y: zone.y, height: zone.h, opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }}
              transition={{ duration: pour.ms / 1000, ease: "linear" }} />
          )}
        </AnimatePresence>

        {/* surface ripple when something lands in the liquid */}
        {fancy && ripple > 0 && (
          <motion.ellipse key={`r${ripple}`} cx="100" cy={top + 3} ry="5" fill="none" stroke="#fff" strokeWidth="2.5"
            initial={{ rx: 14, opacity: 0.9 }} animate={{ rx: 60, opacity: 0 }} transition={{ duration: 0.65, ease: "easeOut" }} />
        )}

        {/* glossy highlight sweeping across (step completed / drink finished) */}
        {fancy && shine > 0 && (
          <g transform="skewX(-16)">
            <motion.rect key={`s${shine}`} x="-70" y="40" width="30" height="230" fill="#fff"
              initial={{ x: 0, opacity: 0 }} animate={{ x: 300, opacity: [0, 0.55, 0] }} transition={{ duration: 0.8, ease: "easeInOut" }} />
          </g>
        )}
      </g>
      <path d={CUP} fill="none" stroke="currentColor" strokeOpacity=".45" strokeWidth="3" strokeLinejoin="round" />
      <path d="M36 56 H164" stroke="currentColor" strokeOpacity=".6" strokeWidth="6" strokeLinecap="round" />

      {has("cocoa") && (
        <motion.g initial={drop} animate={land} transition={spring}>
          {Array.from({ length: 14 }).map((_, i) => <circle key={i} cx={62 + ((i * 37) % 76)} cy={top + 3 + (i % 3) * 2} r="2" fill="#5a3a28" />)}
        </motion.g>
      )}
      {has("cookie") && (
        <motion.g initial={drop} animate={land} transition={spring}>
          {[[70, 0], [90, -3], [112, 0], [128, -2], [100, -6]].map(([x, dy], i) => <rect key={i} x={x} y={top + dy - 6} width="11" height="8" rx="2" fill="#b07a45" transform={`rotate(${i * 25} ${x} ${top})`} />)}
        </motion.g>
      )}
      {has("marshmallow") && (
        <motion.g initial={drop} animate={land} transition={spring}>
          {[[72, 0], [100, -4], [124, 0]].map(([x, dy], i) => <rect key={i} x={x - 8} y={top + dy - 14} width="16" height="14" rx="4" fill="#fff" stroke="#eadfd0" />)}
        </motion.g>
      )}
      {has("whipped") && (
        <motion.g initial={drop} animate={land} transition={spring}>
          <g fill="#fffdf8" stroke="#eadfd0" strokeWidth="1.5">
            <circle cx="76" cy={whippedY - 6} r="22" /><circle cx="124" cy={whippedY - 6} r="22" /><circle cx="100" cy={whippedY - 22} r="24" /><ellipse cx="100" cy={whippedY} rx="50" ry="12" />
          </g>
        </motion.g>
      )}
      {has("caramel_drizzle") && <motion.path d={`M62 ${whippedY - 14} q14 -12 26 0 t26 0 t26 0`} stroke="#c68642" strokeWidth="4" fill="none" strokeLinecap="round" initial={draw} animate={drawn} transition={reduce ? instant : { duration: 0.55, ease: "easeOut" }} />}
      {has("choco_drizzle") && <motion.path d={`M66 ${whippedY - 26} q12 12 24 0 t24 0 t22 0`} stroke="#3b2417" strokeWidth="4" fill="none" strokeLinecap="round" initial={draw} animate={drawn} transition={reduce ? instant : { duration: 0.55, ease: "easeOut" }} />}
      {!iced && [78, 100, 122].map((x, i) => (
        <motion.path key={x} d={`M${x} 40 q-8 -10 0 -20 q8 -10 0 -20`} stroke="currentColor" strokeOpacity=".3" strokeWidth="3" fill="none" strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0], y: [0, -8, -14] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }} />
      ))}
    </svg>
  );
}
