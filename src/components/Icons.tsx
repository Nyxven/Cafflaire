// Small line icons (24px grid). Decorative: always paired with a text label or aria-label.
type P = { className?: string };
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const Icon = {
  home: ({ className }: P) => <svg {...base} className={className}><path d="M3 11 12 4l9 7" /><path d="M5 10v10h5v-6h4v6h5V10" /></svg>,
  menu: ({ className }: P) => <svg {...base} className={className}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" /><path d="M9 9h6M9 13h6" /></svg>,
  build: ({ className }: P) => <svg {...base} className={className}><path d="M6 8h12l-1.4 11a2 2 0 0 1-2 1.7H9.4a2 2 0 0 1-2-1.7z" /><path d="M5 8h14" /><path d="M10 4c0 1.2 2 1.2 2 2.4M14 4c0 1.2 2 1.2 2 2.4" /></svg>,
  orders: ({ className }: P) => <svg {...base} className={className}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" /><path d="M9 8h6M9 12h6" /></svg>,
  cart: ({ className }: P) => <svg {...base} className={className}><path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6 5 3H2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>,
  user: ({ className }: P) => <svg {...base} className={className}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>,
  settings: ({ className }: P) => <svg {...base} className={className}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></svg>,
  shield: ({ className }: P) => <svg {...base} className={className}><path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" /><path d="m9 12 2 2 4-4" /></svg>,
  logout: ({ className }: P) => <svg {...base} className={className}><path d="M10 4H5v16h5" /><path d="M15 8l4 4-4 4M19 12H9" /></svg>,
  close: ({ className }: P) => <svg {...base} className={className}><path d="M6 6l12 12M18 6 6 18" /></svg>,
  burger: ({ className }: P) => <svg {...base} className={className}><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  sun: ({ className }: P) => <svg {...base} className={className}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" /></svg>,
  moon: ({ className }: P) => <svg {...base} className={className}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>,
  monitor: ({ className }: P) => <svg {...base} className={className}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>,
  check: ({ className }: P) => <svg {...base} className={className}><path d="m5 12 5 5 9-10" /></svg>,
  sparkle: ({ className }: P) => <svg {...base} className={className}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 17v4M17 19h4" /></svg>,
};
export type IconName = keyof typeof Icon;
