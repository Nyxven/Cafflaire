"use client";
import { LayoutGroup, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icons";

const TABS = [
  { href: "/profile", label: "Profile", icon: Icon.user },
  { href: "/profile/settings", label: "Settings", icon: Icon.settings },
];

export default function ProfileTabs() {
  const pathname = usePathname();
  return (
    <LayoutGroup id="profile-tabs">
      <nav aria-label="Account" className="mb-6 inline-flex gap-1 rounded-full bg-milk/70 p-1">
        {TABS.map(({ href, label, icon: I }) => {
          const on = pathname === href;
          return (
            <Link key={href} href={href} aria-current={on ? "page" : undefined} className={`relative flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${on ? "text-cream" : "hover:text-caramel"}`}>
              {on && <motion.span layoutId="profile-tab" transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-full bg-espresso" />}
              <span className="relative flex items-center gap-2"><I className="h-[18px] w-[18px]" />{label}</span>
            </Link>
          );
        })}
      </nav>
    </LayoutGroup>
  );
}
