"use client";
import { useEffect, useState } from "react";

/** True after first client render — avoids SSR/localStorage hydration mismatches. */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
