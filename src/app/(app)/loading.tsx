"use client";
import { motion, useReducedMotion } from "framer-motion";

/** Shown while a page is fetching: a cup that fills, over and over. */
export default function Loading() {
  const reduce = useReducedMotion();
  return (
    <div className="grid min-h-[50vh] place-items-center" role="status" aria-label="Loading">
      <div className="text-center">
        <svg viewBox="0 0 80 90" className="mx-auto h-24 text-espresso" aria-hidden>
          <defs><clipPath id="loadclip"><path d="M14 22h52l-5 52a6 6 0 0 1-6 5H25a6 6 0 0 1-6-5z" /></clipPath></defs>
          <g clipPath="url(#loadclip)">
            <motion.rect x="10" width="60" height="64" fill="#C68642" initial={{ y: 80 }} animate={reduce ? { y: 40 } : { y: [80, 30, 30, 80] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", times: [0, 0.55, 0.8, 1] }} />
          </g>
          <path d="M14 22h52l-5 52a6 6 0 0 1-6 5H25a6 6 0 0 1-6-5z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          {!reduce && [30, 42, 54].map((x, i) => <motion.path key={x} d={`M${x} 14q-4-5 0-10`} stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" animate={{ opacity: [0, 0.5, 0], y: [2, -3, -6] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.35 }} />)}
        </svg>
        <p className="mt-2 text-sm opacity-70">Brewing this page…</p>
      </div>
    </div>
  );
}
