"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { OrderItem } from "@/lib/catalog";
import { useCart } from "@/lib/store";

export function SignOutButton() {
  const router = useRouter();
  return <button className="btn-ghost" onClick={() => authClient.signOut({ fetchOptions: { onSuccess: () => { router.push("/"); router.refresh(); } } })}>Sign out</button>;
}

export function RefreshEvery({ ms = 15000 }: { ms?: number }) {
  const router = useRouter();
  useEffect(() => { const t = setInterval(() => router.refresh(), ms); return () => clearInterval(t); }, [router, ms]);
  return null;
}

export function ReorderButton({ items }: { items: OrderItem[] }) {
  const router = useRouter();
  const add = useCart((s) => s.add);
  return <button className="btn-accent" onClick={() => { items.forEach((i) => add(i.name, structuredClone(i.config), i.qty)); router.push("/cart"); }}>Reorder</button>;
}

export function StatusSelect({ id, status, options }: { id: string; status: string; options: readonly string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <select className="input !min-h-9 !w-auto" value={status} disabled={busy} aria-label="Order status" onChange={async (e) => {
      setBusy(true);
      await fetch(`/api/admin/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: e.target.value }) });
      setBusy(false);
      router.refresh();
    }}>
      {options.map((o) => <option key={o} value={o}>{o.replaceAll("_", " ")}</option>)}
    </select>
  );
}

/** Admin: delete a COMPLETED order. Asks "sure?" first. The server checks the order really is completed. */
export function DeleteOrderButton({ id, number }: { id: string; number: string }) {
  const router = useRouter();
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function remove() {
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(data.error ?? "Could not delete this order."); return; }
    router.refresh();
  }

  if (!ask) return <button type="button" className="btn-ghost !min-h-9 !px-3 text-sm text-berry" onClick={() => setAsk(true)} aria-label={`Delete order ${number}`}>🗑 Delete</button>;
  return (
    <div className="flex flex-wrap items-center gap-2" role="alertdialog" aria-label={`Confirm deleting order ${number}`}>
      <span className="text-sm font-semibold">Delete {number} for good?</span>
      <button type="button" className="btn !min-h-9 !px-3 bg-berry text-sm text-white" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Yes, delete"}</button>
      <button type="button" className="btn-ghost !min-h-9 !px-3 text-sm" disabled={busy} onClick={() => { setAsk(false); setErr(""); }}>Keep it</button>
      {err && <span role="alert" className="w-full text-sm text-berry">{err}</span>}
    </div>
  );
}

/** Customer: remove a finished (completed/cancelled) order from My orders. Asks first. The server only hides it. */
export function HideOrderButton({ id, number, goTo }: { id: string; number: string; goTo?: string }) {
  const router = useRouter();
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function remove() {
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); setErr(data.error ?? "Could not remove this order."); return; }
    if (goTo) router.push(goTo);
    router.refresh();
  }

  if (!ask) return <button type="button" className="btn-ghost !min-h-9 !px-3 text-sm text-berry" onClick={() => setAsk(true)} aria-label={`Remove order ${number} from my orders`}>🗑 Remove</button>;
  return (
    <div className="flex flex-wrap items-center justify-end gap-2" role="alertdialog" aria-label={`Confirm removing order ${number}`}>
      <span className="text-sm font-semibold">Remove {number} from your orders?</span>
      <button type="button" className="btn !min-h-9 !px-3 bg-berry text-sm text-white" disabled={busy} onClick={remove}>{busy ? "Removing…" : "Yes, remove"}</button>
      <button type="button" className="btn-ghost !min-h-9 !px-3 text-sm" disabled={busy} onClick={() => { setAsk(false); setErr(""); }}>Keep it</button>
      {err && <span role="alert" className="w-full text-right text-sm text-berry">{err}</span>}
    </div>
  );
}
