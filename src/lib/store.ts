"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { BASE_MAP, Config, PRESET_MAP, defaultConfig, defaultName } from "./catalog";

export interface CartItem { id: string; name: string; qty: number; config: Config }
const uid = () => Math.random().toString(36).slice(2, 10);

interface CartState {
  items: CartItem[];
  add: (name: string, config: Config, qty?: number) => void;
  update: (id: string, name: string, config: Config) => void;
  setQty: (id: string, qty: number) => void;
  duplicate: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (name, config, qty = 1) => set((s) => ({ items: [...s.items, { id: uid(), name, config, qty }] })),
      update: (id, name, config) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, name, config } : i)) })),
      setQty: (id, qty) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(20, qty)) } : i)) })),
      duplicate: (id) => set((s) => { const f = s.items.find((i) => i.id === id); return f ? { items: [...s.items, { ...f, id: uid(), config: structuredClone(f.config) }] } : s; }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: "byo-cart", storage: createJSONStorage(() => localStorage) },
  ),
);

interface BuilderState {
  config: Config;
  name: string;
  step: number;
  editingId: string | null;
  patch: (p: Partial<Config>) => void;
  pickBase: (id: string) => void;
  setName: (n: string) => void;
  setStep: (n: number) => void;
  reset: () => void;
  loadPreset: (slug: string) => boolean;
  loadItem: (item: CartItem) => void;
}

export const useBuilder = create<BuilderState>((set) => ({
  config: defaultConfig(),
  name: "",
  step: 0,
  editingId: null,
  patch: (p) => set((s) => ({ config: { ...s.config, ...p } })),
  pickBase: (id) => {
    const b = BASE_MAP[id];
    if (b) set((s) => ({ config: { ...s.config, base: id, ...b.defaults } }));
  },
  setName: (name) => set({ name }),
  setStep: (step) => set({ step }),
  reset: () => set({ config: defaultConfig(), name: "", step: 0, editingId: null }),
  loadPreset: (slug) => {
    const p = PRESET_MAP[slug];
    if (!p) return false;
    set({ config: structuredClone(p.config), name: p.name, step: 0, editingId: null });
    return true;
  },
  loadItem: (item) => set({ config: structuredClone(item.config), name: item.name, step: 6, editingId: item.id }),
}));

export { defaultName };
