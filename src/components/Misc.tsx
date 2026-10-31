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
