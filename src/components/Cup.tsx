"use client";
import { motion } from "framer-motion";
import { BASE_MAP, Config, MILK_MAP, SIZES } from "@/lib/catalog";

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const [x, y] = [hex(a), hex(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};

const CUP = "M40 60 L160 60 L146 238 Q144 252 130 252 L70 252 Q56 252 54 238 Z";
const BOTTOM = 250;

/** Layered SVG cup rendered purely from a drink config. */
export default function Cup({ config, className = "h-64" }: { config: Config; className?: string }) {
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

  const has = (t: string) => config.toppings.includes(t);
  const whippedY = top - 4;

  return (
    <svg viewBox="0 0 200 270" className={className} role="img" aria-label={`${base.name} preview`}>
      <defs><clipPath id="cupclip"><path d={CUP} /></clipPath></defs>
      <ellipse cx="100" cy="262" rx="62" ry="6" fill="#3B2417" opacity=".12" />
      {iced && <line x1="122" y1="14" x2="106" y2="236" stroke="#e8554e" strokeWidth="6" strokeLinecap="round" />}
      <path d={CUP} fill="#fff" fillOpacity=".55" />
      <g clipPath="url(#cupclip)">
        {layers.map((l, i) => (
          <motion.rect key={i} x="30" width="140" initial={false} animate={{ y: l.y, height: Math.max(l.h, 0), fill: l.c }} transition={{ type: "spring", stiffness: 120, damping: 18 }} />
        ))}
        {!blended && !iced && milk.id !== "none" && <ellipse cx="100" cy={top + 4} rx="58" ry="7" fill="#fffaf2" opacity=".8" />}
        {iced && [[72, 14], [108, 30], [84, 62], [118, 78], [74, 100]].map(([x, dy], i) => (
          <rect key={i} x={x} y={top + dy} width="26" height="26" rx="5" fill="#fff" fillOpacity=".38" stroke="#fff" strokeOpacity=".6" transform={`rotate(${i * 17} ${x + 13} ${top + dy + 13})`} />
        ))}
        {blended && [[70, 40], [120, 70], [90, 100], [130, 30]].map(([x, dy], i) => <circle key={i} cx={x} cy={top + dy} r="4" fill="#fff" fillOpacity=".35" />)}
      </g>
      <path d={CUP} fill="none" stroke="#3B2417" strokeOpacity=".35" strokeWidth="3" strokeLinejoin="round" />
      <path d="M36 56 H164" stroke="#3B2417" strokeOpacity=".5" strokeWidth="6" strokeLinecap="round" />

      {has("cocoa") && Array.from({ length: 14 }).map((_, i) => <circle key={i} cx={62 + ((i * 37) % 76)} cy={top + 3 + (i % 3) * 2} r="2" fill="#5a3a28" />)}
      {has("cookie") && [[70, 0], [90, -3], [112, 0], [128, -2], [100, -6]].map(([x, dy], i) => <rect key={i} x={x} y={top + dy - 6} width="11" height="8" rx="2" fill="#b07a45" transform={`rotate(${i * 25} ${x} ${top})`} />)}
      {has("marshmallow") && [[72, 0], [100, -4], [124, 0]].map(([x, dy], i) => <rect key={i} x={x - 8} y={top + dy - 14} width="16" height="14" rx="4" fill="#fff" stroke="#eadfd0" />)}
      {has("whipped") && (
        <g fill="#fffdf8" stroke="#eadfd0" strokeWidth="1.5">
          <circle cx="76" cy={whippedY - 6} r="22" /><circle cx="124" cy={whippedY - 6} r="22" /><circle cx="100" cy={whippedY - 22} r="24" /><ellipse cx="100" cy={whippedY} rx="50" ry="12" />
        </g>
      )}
      {has("caramel_drizzle") && <path d={`M62 ${whippedY - 14} q14 -12 26 0 t26 0 t26 0`} stroke="#c68642" strokeWidth="4" fill="none" strokeLinecap="round" />}
      {has("choco_drizzle") && <path d={`M66 ${whippedY - 26} q12 12 24 0 t24 0 t22 0`} stroke="#3b2417" strokeWidth="4" fill="none" strokeLinecap="round" />}
      {!iced && [78, 100, 122].map((x, i) => (
        <motion.path key={x} d={`M${x} 40 q-8 -10 0 -20 q8 -10 0 -20`} stroke="#3B2417" strokeOpacity=".25" strokeWidth="3" fill="none" strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0], y: [0, -8, -14] }} transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }} />
      ))}
    </svg>
  );
}
