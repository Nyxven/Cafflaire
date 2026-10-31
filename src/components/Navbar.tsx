"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { authClient } from "@/lib/auth-client";
import { useHydrated } from "@/lib/hydrated";
import { useCart } from "@/lib/store";

const LINKS = [
  { href: "/home", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/build", label: "Build My Coffee" },
  { href: "/orders", label: "My Orders" },
];

function CartButton() {
  const hydrated = useHydrated();
  const count = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0));
  return (
    <Link href="/cart" aria-label={`Basket, ${hydrated ? count : 0} items`} className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-milk">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6 5 3H2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>
      {hydrated && count > 0 && <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-berry px-1 text-xs font-bold text-white">{count}</span>}
    </Link>
  );
}

export default function Navbar({ user, admin }: { user: { name: string; email: string }; admin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => { setOpen(false); setMenu(false); }, [pathname]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), setMenu(false));
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []);

  const active = (h: string) => pathname === h || pathname.startsWith(h + "/");
  const signOut = () => authClient.signOut({ fetchOptions: { onSuccess: () => { router.push("/"); router.refresh(); } } });
  const initial = user.name?.[0]?.toUpperCase() ?? "?";
  const links = admin ? [...LINKS, { href: "/admin", label: "Admin" }] : LINKS;

  return (
    <header className="sticky top-0 z-40 border-b border-espresso/10 bg-cream/90 backdrop-blur">
      <nav aria-label="Primary" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />
        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} aria-current={active(l.href) ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${active(l.href) ? "bg-espresso text-cream" : "hover:bg-milk"}`}>{l.label}</Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1">
          <CartButton />
          <div className="relative hidden lg:block">
            <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="Profile menu" className="grid h-10 w-10 place-items-center rounded-full bg-caramel font-bold text-white">{initial}</button>
            {menu && (
              <div role="menu" className="absolute right-0 mt-2 w-52 rounded-2xl bg-white p-2 shadow-soft">
                <p className="truncate px-3 py-2 text-xs opacity-60">{user.email}</p>
                <Link role="menuitem" href="/profile" className="block rounded-xl px-3 py-2 hover:bg-milk">Profile</Link>
                <button role="menuitem" onClick={signOut} className="block w-full rounded-xl px-3 py-2 text-left hover:bg-milk">Sign out</button>
              </div>
            )}
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-milk lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-espresso/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="absolute right-0 top-0 flex h-full w-72 max-w-[85%] flex-col gap-1 bg-cream p-4 shadow-soft">
            <button className="mb-2 self-end grid h-11 w-11 place-items-center rounded-full hover:bg-milk" aria-label="Close menu" onClick={() => setOpen(false)}>✕</button>
            {[...links, { href: "/profile", label: "Profile" }].map((l) => (
              <Link key={l.href} href={l.href} aria-current={active(l.href) ? "page" : undefined} className={`rounded-xl px-4 py-3 text-lg font-semibold ${active(l.href) ? "bg-espresso text-cream" : "hover:bg-milk"}`}>{l.label}</Link>
            ))}
            <button onClick={signOut} className="btn-ghost mt-auto">Sign out</button>
          </aside>
        </div>
      )}
    </header>
  );
}
