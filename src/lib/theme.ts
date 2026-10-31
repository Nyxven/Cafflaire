// Light is the default. Dark (or "match my device") is something a person picks in Settings.
export type Theme = "light" | "dark" | "system";
export const THEME_KEY = "theme";

export function readTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "dark" || t === "system" ? t : "light";
  } catch { return "light"; }
}

export function applyTheme(t: Theme) {
  const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#18100C" : "#FFF8F0");
  try { localStorage.setItem(THEME_KEY, t); } catch { /* private mode */ }
}
