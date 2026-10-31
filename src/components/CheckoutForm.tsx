"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DELIVERY_FEE_CENTS, MIN_PREP_MINUTES, STORE, fmt, unitPrice } from "@/lib/catalog";
import { useHydrated } from "@/lib/hydrated";
import { play } from "@/lib/sound";
import { useCart } from "@/lib/store";

function slots() {
  const out: { v: string; l: string }[] = [];
  const t = new Date(Date.now() + MIN_PREP_MINUTES * 60000);
  t.setMinutes(Math.ceil(t.getMinutes() / 15) * 15, 0, 0);
  for (let i = 0; i < 8; i++) {
    out.push({ v: t.toISOString(), l: t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) });
    t.setMinutes(t.getMinutes() + 15);
  }
  return out;
}

export default function CheckoutForm() {
  const router = useRouter();
  const hydrated = useHydrated();
  const { items, clear } = useCart();
  const [mode, setMode] = useState<"pickup" | "delivery">("pickup");
  const [pickup, setPickup] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const times = useMemo(slots, []);

  if (!hydrated) return <div className="card h-40 animate-pulse" />;
  if (items.length === 0) return <div className="card text-center"><p className="mb-3">Your basket is empty.</p><Link href="/build" className="btn-accent">Build my coffee</Link></div>;

  const subtotal = items.reduce((a, i) => a + unitPrice(i.config) * i.qty, 0);
  const fee = mode === "delivery" ? DELIVERY_FEE_CENTS : 0;

  async function place(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fulfilment: mode, phone, notes: notes || undefined,
        pickupTime: mode === "pickup" && pickup ? pickup : null,
        address: mode === "delivery" ? { line1, city } : undefined,
        items: items.map((i) => ({ name: i.name, qty: i.qty, config: i.config })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "Could not place your order.");
    play("chime");
    clear();
    router.push(`/orders/${data.id}?placed=1`);
  }

  return (
    <form onSubmit={place} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-5">
        <div className="card">
          <h2 className="mb-3 text-xl font-bold">How do you want it?</h2>
          <div className="grid grid-cols-2 gap-3" role="radiogroup">
            {(["pickup", "delivery"] as const).map((m) => (
              <button type="button" key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`rounded-2xl border-2 p-4 text-left ${mode === m ? "border-caramel bg-caramel/10" : "border-espresso/10"}`}>
                <div className="text-2xl">{m === "pickup" ? "🏪" : "🛵"}</div><div className="font-bold capitalize">{m}</div><div className="text-sm opacity-70">{m === "pickup" ? `Free · ready in ~${MIN_PREP_MINUTES} min` : `Fee ${fmt(DELIVERY_FEE_CENTS)}`}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="card space-y-3">
          <label className="block text-sm font-semibold">Mobile number<input className="input mt-1" required type="tel" minLength={7} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></label>
          {mode === "pickup" ? (
            <label className="block text-sm font-semibold">Pickup time
              <select className="input mt-1" value={pickup} onChange={(e) => setPickup(e.target.value)}><option value="">ASAP (~{MIN_PREP_MINUTES} min)</option>{times.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}</select>
            </label>
          ) : (
            <>
              <label className="block text-sm font-semibold">Street address<input className="input mt-1" required value={line1} onChange={(e) => setLine1(e.target.value)} autoComplete="address-line1" /></label>
              <label className="block text-sm font-semibold">City<input className="input mt-1" required value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" /></label>
            </>
          )}
          <label className="block text-sm font-semibold">Notes (optional)<textarea className="input mt-1 min-h-20" maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
          {mode === "pickup" && STORE.pickupAddress && <p className="text-sm">📍 Pick up at: <strong>{STORE.pickupAddress}</strong></p>}
          {mode === "delivery" && STORE.deliveryArea && <p className="text-sm">🛵 We deliver to: {STORE.deliveryArea}</p>}
          {STORE.hours && <p className="text-sm opacity-70">🕒 Store hours: {STORE.hours}</p>}
          <p className="text-sm opacity-70">💵 Payment: cash on {mode === "pickup" ? "pickup" : "delivery"}.</p>
        </div>
      </div>
      <aside className="card h-fit lg:sticky lg:top-20">
        <h2 className="mb-3 text-xl font-bold">Order summary</h2>
        <ul className="space-y-1 text-sm">{items.map((i) => <li key={i.id} className="flex justify-between gap-2"><span className="truncate">{i.qty}× {i.name}</span><span>{fmt(unitPrice(i.config) * i.qty)}</span></li>)}</ul>
        <div className="mt-3 space-y-1 border-t border-espresso/10 pt-3 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>{fmt(fee)}</span></div>
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{fmt(subtotal + fee)}</span></div>
        </div>
        <p role="alert" className="mt-2 min-h-5 text-sm text-berry">{error}</p>
        <button className="btn-primary mt-1 w-full" disabled={busy}>{busy ? "Placing…" : "Place order"}</button>
        <Link href="/cart" className="mt-2 block text-center text-sm underline">Back to basket</Link>
      </aside>
    </form>
  );
}
