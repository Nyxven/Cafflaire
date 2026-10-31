"use client";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon, IconName } from "./Icons";
import Logo from "./Logo";
import { authClient } from "@/lib/auth-client";
import { useHydrated } from "@/lib/hydrated";
import { useCart } from "@/lib/store";

const LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/menu", label: "Menu", icon: "menu" },
  { href: "/build", label: "Build my coffee", icon: "build" },
  { href: "/orders", label: "My orders", icon: "orders" },
];

function NavIcon({ name, className }: { name: IconName; className?: string }) {
  const I = Icon[name];
  return <I className={className} />;
}

function CartButton() {
  const hydrated = useHydrated();
  const count = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0));
  const shown = hydrated ? count : 0;
  return (
    <Link href="/cart" aria-label={`Basket, ${shown} items`} className="relative grid h-11 w-11 place-items-center rounded-full transition hover:bg-milk">
      <Icon.cart className="h-6 w-6" />
      {shown > 0 && (
        // key = count, so the badge pops each time the number changes
        <motion.span key={shown} initial={{ scale: 1.7 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }} className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-berry px-1 text-xs font-bold text-white">{shown}</motion.span>
      )}
    </Link>
  );
}

export default function Navbar({ user, admin }: { user: { name: string; email: string }; admin: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setOpen(false); setMenu(false); }, [pathname]);

  // Esc closes whatever is open; clicking outside closes the profile menu.
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); setMenu(false); } };
    const outside = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    window.addEventListener("keydown", esc);
    window.addEventListener("mousedown", outside);
    return () => { window.removeEventListener("keydown", esc); window.removeEventListener("mousedown", outside); };
  }, []);

  // Drawer: lock page scroll, move focus in, keep Tab inside it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  const trapTab = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !drawerRef.current) return;
    const f = drawerRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }, []);

  const active = (h: string) => pathname === h || pathname.startsWith(h + "/");
  const signOut = () => authClient.signOut({ fetchOptions: { onSuccess: () => { router.push("/"); router.refresh(); } } });
  const initial = user.name?.[0]?.toUpperCase() ?? "?";
  const links = admin ? [...LINKS, { href: "/admin", label: "Admin", icon: "shield" as IconName }] : LINKS;
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 380, damping: 32 };

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <nav aria-label="Primary" className="mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-espresso/10 bg-surface/80 pl-3 pr-2 shadow-soft backdrop-blur-xl">
        <Logo />

        <LayoutGroup id="nav">
          <ul className="hidden items-center gap-0.5 rounded-full bg-milk/60 p-1 lg:flex">
            {links.map((l) => {
              const on = active(l.href);
              return (
                <li key={l.href}>
                  <Link href={l.href} aria-current={on ? "page" : undefined} className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${on ? "text-cream" : "hover:text-caramel"}`}>
                    {on && <motion.span layoutId="nav-pill" transition={spring} className="absolute inset-0 rounded-full bg-espresso shadow-[0_6px_14px_-6px_rgb(var(--espresso)/.7)]" />}
                    <span className="relative flex items-center gap-2"><NavIcon name={l.icon} className="h-[18px] w-[18px]" />{l.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </LayoutGroup>

        <div className="flex items-center gap-1">
          <CartButton />
          <div className="relative hidden lg:block" ref={menuRef}>
            <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="Account menu" className="grid h-10 w-10 place-items-center rounded-full bg-caramel font-bold text-white shadow-[0_6px_14px_-6px_rgb(var(--caramel)/.9)] transition active:scale-95">{initial}</button>
            <AnimatePresence>
              {menu && (
                <motion.div role="menu" initial={reduce ? false : { opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduce ? undefined : { opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.16 }} style={{ transformOrigin: "top right" }} className="absolute right-0 mt-3 w-60 rounded-3xl border border-espresso/10 bg-surface p-2 shadow-float">
                  <div className="px-3 py-2"><p className="truncate font-semibold">{user.name}</p><p className="truncate text-xs opacity-60">{user.email}</p></div>
                  <Link role="menuitem" href="/profile" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-milk"><Icon.user className="h-[18px] w-[18px]" />Profile</Link>
                  <Link role="menuitem" href="/profile/settings" className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-milk"><Icon.settings className="h-[18px] w-[18px]" />Settings</Link>
                  <button role="menuitem" onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-milk"><Icon.logout className="h-[18px] w-[18px]" />Sign out</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-full transition hover:bg-milk lg:hidden" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}><Icon.burger className="h-6 w-6" /></button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu" onKeyDown={trapTab}>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-espresso/45 backdrop-blur-[2px]" aria-label="Close menu" onClick={() => setOpen(false)} />
            <motion.aside ref={drawerRef} initial={reduce ? false : { x: "100%" }} animate={{ x: 0 }} exit={reduce ? undefined : { x: "100%" }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 340, damping: 36 }} className="absolute right-0 top-0 flex h-full w-80 max-w-[88%] flex-col gap-1 rounded-l-[2rem] bg-cream p-4 shadow-float">
              <div className="mb-3 flex items-center gap-3 rounded-2xl bg-milk/70 p-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-caramel text-lg font-bold text-white">{initial}</span>
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{user.name}</p><p className="truncate text-xs opacity-60">{user.email}</p></div>
                <button ref={closeRef} className="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-surface" aria-label="Close menu" onClick={() => setOpen(false)}><Icon.close className="h-5 w-5" /></button>
              </div>
              {[...links, { href: "/profile", label: "Profile", icon: "user" as IconName }, { href: "/profile/settings", label: "Settings", icon: "settings" as IconName }].map((l, i) => (
                <motion.div key={l.href} initial={reduce ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.04 }}>
                  <Link href={l.href} aria-current={l.href === "/profile" ? (pathname === "/profile" ? "page" : undefined) : active(l.href) ? "page" : undefined} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-lg font-semibold ${(l.href === "/profile" ? pathname === "/profile" : active(l.href)) ? "bg-espresso text-cream" : "hover:bg-milk"}`}><NavIcon name={l.icon} className="h-5 w-5" />{l.label}</Link>
                </motion.div>
              ))}
              <button onClick={signOut} className="btn-ghost mt-auto"><Icon.logout className="h-[18px] w-[18px]" />Sign out</button>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
