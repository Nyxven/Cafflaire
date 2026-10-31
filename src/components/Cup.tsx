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
const SPRING = { type: "spring", stiffness: 120, damping: 18 } as const;
// Scale/rotate SVG parts around their own middle (or bottom) instead of the SVG corner.
const CENTER = { transformBox: "fill-box", transformOrigin: "50% 50%" } as const;
const BASE_ORIGIN = { transformBox: "fill-box", transformOrigin: "50% 100%" } as const;
// One long wave; sliding it left by one period (40) loops seamlessly.
const WAVE = "M-20 3 " + Array.from({ length: 8 }).map(() => "q10 -5 20 0 t20 0").join(" ") + " V10 H-20 Z";

/** A topping group: fades away when removed. Its pieces animate themselves in. */
function Group({ on, live, children }: { on: boolean; live: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {on && <motion.g key="g" exit={live ? { opacity: 0, y: -16, transition: { duration: 0.2 } } : undefined}>{children}</motion.g>}
    </AnimatePresence>
  );
}

/** One piece (a cookie chunk, a marshmallow, a pinch of cocoa) that falls in, bounces and settles. */
function Piece({ live, delay = 0, from = -70, children }: { live: boolean; delay?: number; from?: number; children: React.ReactNode }) {
  return (
    <motion.g
      initial={live ? { y: from, opacity: 0, rotate: -25 } : false}
      animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ y: { type: "spring", stiffness: 240, damping: 11, delay }, rotate: { type: "spring", stiffness: 200, damping: 12, delay }, opacity: { duration: 0.12, delay } }}
      style={CENTER}
    >{children}</motion.g>
  );
}

/** A tier of whipped cream that grows up from its base, like it is being squirted. */
function Tier({ live, delay, children }: { live: boolean; delay: number; children: React.ReactNode }) {
  return (
    <motion.g initial={live ? { scale: 0 } : false} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 12, delay }} style={BASE_ORIGIN}>
      {children}
    </motion.g>
  );
}

/** A sauce line that is "drawn" across the drink. */
function Line({ live, d, color }: { live: boolean; d: string; color: string }) {
  return (
    <motion.path
      d={d} stroke={color} strokeWidth="4" fill="none" strokeLinecap="round"
      initial={live ? { pathLength: 0, opacity: 0 } : false}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ pathLength: { duration: 0.9, delay: 0.25, ease: "easeInOut" }, opacity: { duration: 0.05, delay: 0.25 } }}
    />
  );
}

/**
 * Layered SVG cup rendered purely from a drink config.
 * `live` turns on the "game" animations (wavy surface, toppings that drop in, ice that splashes in).
 * `lid` slides a lid on, `stir` shows a spoon stirring. Leave them off for static thumbnails.
 */
export default function Cup({ config, className = "h-64", live = false, lid = false, stir = false }: { config: Config; className?: string; live?: boolean; lid?: boolean; stir?: boolean }) {
  const reduce = useReducedMotion();
  const lively = live && !reduce;
  const base = BASE_MAP[config.base];
  if (!base) return null;
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
  const layers = blended
    ? [{ y: top, h: total, c: mixed }]
    : iced
      ? [{ y: top + coffeeH, h: milkH, c: milk.color }, { y: top, h: coffeeH, c: coffee }]
      : [{ y: top + milkH, h: coffeeH, c: coffee }, { y: top, h: milkH, c: milk.color }];
  const surface = layers[layers.length - 1].c;

  const has = (t: string) => config.toppings.includes(t);
  const wy = -4; // whipped cream base, measured from the liquid surface (the toppings group moves with the liquid)
  const showLid = lid && config.toppings.length === 0;

  return (
    <svg viewBox="0 0 200 270" className={className} role="img" aria-label={`${base.name} preview`}>
      <defs><clipPath id="cupclip"><path d={CUP} /></clipPath></defs>
      <ellipse cx="100" cy="262" rx="62" ry="6" fill="currentColor" opacity=".12" />
      {iced && <line x1="122" y1="14" x2="106" y2="236" stroke="#e8554e" strokeWidth="6" strokeLinecap="round" />}
      <path d={CUP} fill="currentColor" fillOpacity=".07" />
      <g clipPath="url(#cupclip)">
        {layers.map((l, i) => (
          <motion.rect key={i} x="30" width="140" initial={false} animate={{ y: l.y, height: Math.max(l.h, 0), fill: l.c }} transition={SPRING} />
        ))}
        {lively && (
          <motion.g initial={false} animate={{ y: top - 3 }} transition={SPRING}>
            <motion.path d={WAVE} fill={surface} initial={{ x: 0 }} animate={{ x: -40 }} transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }} />
          </motion.g>
        )}
        {!blended && !iced && milk.id !== "none" && <ellipse cx="100" cy={top + 4} rx="58" ry="7" fill="#fffaf2" opacity=".8" />}
        {iced && [[72, 14], [108, 30], [84, 62], [118, 78], [74, 100]].map(([x, dy], i) => (
          <motion.g key={i} initial={lively ? { y: -170, opacity: 0 } : false} animate={{ y: 0, opacity: 1 }} transition={{ y: { type: "spring", stiffness: 150, damping: 11, delay: i * 0.09 }, opacity: { duration: 0.1, delay: i * 0.09 } }}>
            <motion.g animate={lively ? { y: [0, -3, 0] } : undefined} transition={{ duration: 2.4 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.35 }}>
              <rect x={x} y={top + dy} width="26" height="26" rx="5" fill="#fff" fillOpacity=".38" stroke="#fff" strokeOpacity=".6" transform={`rotate(${i * 17} ${x + 13} ${top + dy + 13})`} />
            </motion.g>
          </motion.g>
        ))}
        {blended && [[70, 40], [120, 70], [90, 100], [130, 30]].map(([x, dy], i) => <circle key={i} cx={x} cy={top + dy} r="4" fill="#fff" fillOpacity=".35" />)}
      </g>
      <path d={CUP} fill="none" stroke="currentColor" strokeOpacity=".45" strokeWidth="3" strokeLinejoin="round" />
      <path d="M36 56 H164" stroke="currentColor" strokeOpacity=".6" strokeWidth="6" strokeLinecap="round" />

      {/* Toppings ride on the liquid surface, so they rise and fall smoothly with it. */}
      <motion.g initial={false} animate={{ y: top }} transition={SPRING}>
        <Group on={has("cocoa")} live={lively}>
          {Array.from({ length: 14 }).map((_, i) => <Piece key={i} live={lively} delay={i * 0.03} from={-90}><circle cx={62 + ((i * 37) % 76)} cy={3 + (i % 3) * 2} r="2" fill="#5a3a28" /></Piece>)}
        </Group>
        <Group on={has("cookie")} live={lively}>
          {[[70, 0], [90, -3], [112, 0], [128, -2], [100, -6]].map(([x, dy], i) => <Piece key={i} live={lively} delay={i * 0.07}><rect x={x} y={dy - 6} width="11" height="8" rx="2" fill="#b07a45" transform={`rotate(${i * 25} ${x} 0)`} /></Piece>)}
        </Group>
        <Group on={has("marshmallow")} live={lively}>
          {[[72, 0], [100, -4], [124, 0]].map(([x, dy], i) => <Piece key={i} live={lively} delay={i * 0.1}><rect x={x - 8} y={dy - 14} width="16" height="14" rx="4" fill="#fff" stroke="#eadfd0" /></Piece>)}
        </Group>
        <Group on={has("whipped")} live={lively}>
          <g fill="#fffdf8" stroke="#eadfd0" strokeWidth="1.5">
            <Tier live={lively} delay={0}><circle cx="76" cy={wy - 6} r="22" /><circle cx="124" cy={wy - 6} r="22" /><ellipse cx="100" cy={wy} rx="50" ry="12" /></Tier>
            <Tier live={lively} delay={0.14}><circle cx="100" cy={wy - 22} r="24" /></Tier>
            <Tier live={lively} delay={0.28}><circle cx="100" cy={wy - 44} r="10" /></Tier>
          </g>
        </Group>
        <Group on={has("caramel_drizzle")} live={lively}><Line live={lively} d={`M62 ${wy - 14} q14 -12 26 0 t26 0 t26 0`} color="#c68642" /></Group>
        <Group on={has("choco_drizzle")} live={lively}><Line live={lively} d={`M66 ${wy - 26} q12 12 24 0 t24 0 t22 0`} color="#3b2417" /></Group>
      </motion.g>

      {!iced && [78, 100, 122].map((x, i) => (
        <motion.path key={x} d={`M${x} 40 q-8 -10 0 -20 q8 -10 0 -20`} stroke="currentColor" strokeOpacity=".3" strokeWidth="3" fill="none" strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0], y: [0, -8, -14] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }} />
      ))}

      {/* Stirring spoon (shown while the drink is being mixed). */}
      <AnimatePresence>
        {stir && (
          <motion.g key="spoon" initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
            <motion.g animate={{ x: [-22, 22, -22], rotate: [-6, 6, -6] }} transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }} style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}>
              <line x1="100" y1="8" x2="100" y2="190" stroke="#d9d9d9" strokeWidth="6" strokeLinecap="round" />
              <ellipse cx="100" cy="196" rx="9" ry="6" fill="#d9d9d9" stroke="#8c8c8c" strokeWidth="1.5" />
            </motion.g>
          </motion.g>
        )}
      </AnimatePresence>

      {/* Lid (open-top drinks with toppings stay open, like a sundae). */}
      <AnimatePresence>
        {showLid && (
          <motion.g key="lid" initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ y: { type: "spring", stiffness: 280, damping: 13 }, opacity: { duration: 0.1 } }}>
            <path d="M32 54 Q100 38 168 54 L166 66 Q100 74 34 66 Z" fill="#f3ece2" stroke="currentColor" strokeOpacity=".5" strokeWidth="3" strokeLinejoin="round" />
            <ellipse cx="136" cy="55" rx="8" ry="3" fill="currentColor" fillOpacity=".35" />
            {iced && <line x1="122" y1="14" x2="118.7" y2="60" stroke="#e8554e" strokeWidth="6" strokeLinecap="round" />}
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}
