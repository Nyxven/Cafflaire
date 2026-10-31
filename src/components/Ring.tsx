"use client";
import { motion, useReducedMotion } from "framer-motion";

/**
 * A coffee-cup ring stain. The signature motif of the app: it sits behind cups, in hero panels
 * and on the reveal screen. Set `draw` to trace it in once when it appears.
 */
export default function Ring({ className = "", draw = false }: { className?: string; draw?: boolean }) {
  const reduce = useReducedMotion();
  const trace = draw && !reduce;
  const p = (delay: number) => trace
    ? { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 1.1, delay, ease: "easeOut" as const } }
    : {};
  return (
    <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeLinecap="round" className={className} aria-hidden>
      <motion.path d="M100 10a90 90 0 1 1-63 26" strokeWidth="6" opacity=".55" {...p(0)} />
      <motion.path d="M100 22a78 78 0 0 1 77 66" strokeWidth="2.5" opacity=".45" {...p(0.25)} />
      <motion.path d="M26 118a78 78 0 0 0 44 56" strokeWidth="2" opacity=".35" {...p(0.45)} />
      <circle cx="172" cy="30" r="3" fill="currentColor" stroke="none" opacity=".5" />
      <circle cx="184" cy="46" r="1.6" fill="currentColor" stroke="none" opacity=".4" />
      <circle cx="22" cy="168" r="2.4" fill="currentColor" stroke="none" opacity=".35" />
    </svg>
  );
}
